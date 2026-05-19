require("dotenv").config();

const crypto = require("crypto");
const mongoose = require("mongoose");

const maskMongoUri = (uri = "") => uri.replace(/\/\/.*@/, "//***:***@");

const args = new Set(process.argv.slice(2));
const reverse = args.has("--reverse");
const prune = args.has("--prune");
const dryRun = args.has("--dry-run");
const verify = !args.has("--no-verify");
const OUTBOX_COLLECTION = "mirror_outbox";
const BATCH_SIZE = 500;

const getArgValue = (name, fallback) => {
    const prefix = `${name}=`;
    const arg = process.argv.slice(2).find(item => item.startsWith(prefix));
    return arg ? arg.slice(prefix.length) : fallback;
};

const numberOption = (name, envName, fallback) => {
    const value = parseInt(getArgValue(name, process.env[envName] || String(fallback)), 10);
    return Number.isFinite(value) && value >= 0 ? value : fallback;
};

const verifyRetries = numberOption("--verify-retries", "MONGODB_MIRROR_VERIFY_RETRIES", 5);
const liveTailEnabled = !args.has("--no-live-tail") && process.env.MONGODB_MIRROR_LIVE_TAIL !== "false";

const primaryUri = process.env.MONGODB_URI || process.env.MONGODB_LOCAL;
const secondaryUri = process.env.MONGODB_SECONDARY_URI || process.env.MONGODB_MIRROR_URI;

const sourceUri = reverse ? secondaryUri : primaryUri;
const targetUri = reverse ? primaryUri : secondaryUri;
const sourceName = reverse ? "secondary" : "primary";
const targetName = reverse ? "primary" : "secondary";
const usesSrvUri = [sourceUri, targetUri].some(uri => uri?.startsWith("mongodb+srv://"));
const tlsEnabled = process.env.DB_TLS
    ? process.env.DB_TLS === "true"
    : usesSrvUri;
const validateTls = process.env.DB_SSL_VALIDATE !== "false";

const options = {
    tls: tlsEnabled,
    tlsAllowInvalidCertificates: tlsEnabled && !validateTls,
    authSource: process.env.DB_AUTH_SOURCE || "admin",
    readPreference: "primary",
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    family: 4,
    retryWrites: true,
    w: "majority"
};

const connect = async (name, uri) => {
    if (!uri) {
        throw new Error(`Missing ${name} MongoDB URI`);
    }

    console.log(`Connecting to ${name}: ${maskMongoUri(uri)}`);
    const connection = await mongoose.createConnection(uri, options).asPromise();
    console.log(`Connected to ${name}: ${connection.host}/${connection.name}`);
    return connection;
};

const flushBulk = async (collectionName, targetCollection, ops, counts) => {
    if (ops.length === 0) return;

    counts.written += ops.length;

    if (dryRun) {
        ops.length = 0;
        return;
    }

    await targetCollection.bulkWrite(ops.splice(0), { ordered: false });
};

const shouldSkipCollection = (collectionName) => (
    collectionName.startsWith("system.") || collectionName === OUTBOX_COLLECTION
);

const syncCollection = async (sourceDb, targetDb, collectionInfo) => {
    const collectionName = collectionInfo.name;

    if (shouldSkipCollection(collectionName)) {
        return { collectionName, skipped: true };
    }

    const sourceCollection = sourceDb.collection(collectionName);
    const targetCollection = targetDb.collection(collectionName);
    const cursor = sourceCollection.find({}).batchSize(BATCH_SIZE);
    const sourceIds = new Set();
    const ops = [];
    const counts = { read: 0, written: 0, pruned: 0 };

    for await (const doc of cursor) {
        counts.read += 1;
        sourceIds.add(String(doc._id));
        ops.push({
            replaceOne: {
                filter: { _id: doc._id },
                replacement: doc,
                upsert: true
            }
        });

        if (ops.length >= BATCH_SIZE) {
            await flushBulk(collectionName, targetCollection, ops, counts);
        }
    }

    await flushBulk(collectionName, targetCollection, ops, counts);

    if (prune) {
        const targetCursor = targetCollection.find({}, { projection: { _id: 1 } }).batchSize(500);
        const deleteOps = [];

        for await (const doc of targetCursor) {
            if (!sourceIds.has(String(doc._id))) {
                deleteOps.push({ deleteOne: { filter: { _id: doc._id } } });
                counts.pruned += 1;
            }

            if (deleteOps.length >= 500) {
                if (!dryRun) {
                    await targetCollection.bulkWrite(deleteOps.splice(0), { ordered: false });
                } else {
                    deleteOps.length = 0;
                }
            }
        }

        if (deleteOps.length > 0 && !dryRun) {
            await targetCollection.bulkWrite(deleteOps, { ordered: false });
        }
    }

    return { collectionName, ...counts };
};

const pruneExtraTargetCollections = async (sourceDb, targetDb, sourceCollectionNames) => {
    if (!prune) return [];

    const targetCollections = await targetDb.listCollections().toArray();
    const dropped = [];

    for (const collectionInfo of targetCollections) {
        const collectionName = collectionInfo.name;
        if (shouldSkipCollection(collectionName) || sourceCollectionNames.has(collectionName)) {
            continue;
        }

        const documentCount = await targetDb.collection(collectionName).countDocuments();
        dropped.push({ collectionName, documentCount });

        if (!dryRun) {
            await targetDb.collection(collectionName).drop();
        }
    }

    return dropped;
};

const normalizeForHash = (value) => {
    if (value === null || value === undefined) return value;
    if (value instanceof Date) return { $date: value.toISOString() };
    if (Buffer.isBuffer(value)) return { $buffer: value.toString("base64") };
    if (Array.isArray(value)) return value.map(normalizeForHash);

    if (typeof value === "object") {
        if (value._bsontype && typeof value.toString === "function") {
            return { [`$${value._bsontype}`]: value.toString() };
        }

        const normalized = {};
        for (const key of Object.keys(value).sort()) {
            normalized[key] = normalizeForHash(value[key]);
        }
        return normalized;
    }

    return value;
};

const hashDocument = (document) => (
    crypto
        .createHash("sha256")
        .update(JSON.stringify(normalizeForHash(document)))
        .digest("hex")
);

const collectDocumentHashes = async (collection) => {
    const documents = new Map();
    const cursor = collection.find({}).batchSize(BATCH_SIZE);

    for await (const doc of cursor) {
        documents.set(String(doc._id), hashDocument(doc));
    }

    return documents;
};

const verifyCollection = async (sourceDb, targetDb, collectionName) => {
    if (shouldSkipCollection(collectionName)) {
        return { collectionName, skipped: true };
    }

    const sourceCollection = sourceDb.collection(collectionName);
    const targetCollection = targetDb.collection(collectionName);
    const [sourceDocuments, targetDocuments] = await Promise.all([
        collectDocumentHashes(sourceCollection),
        collectDocumentHashes(targetCollection)
    ]);

    let missing = 0;
    let extra = 0;
    let changed = 0;

    for (const [id, sourceHash] of sourceDocuments.entries()) {
        if (!targetDocuments.has(id)) {
            missing += 1;
        } else if (targetDocuments.get(id) !== sourceHash) {
            changed += 1;
        }
    }

    for (const id of targetDocuments.keys()) {
        if (!sourceDocuments.has(id)) extra += 1;
    }

    return {
        collectionName,
        sourceCount: sourceDocuments.size,
        targetCount: targetDocuments.size,
        missing,
        extra,
        changed,
        ok: sourceDocuments.size === targetDocuments.size && missing === 0 && extra === 0 && changed === 0
    };
};

const verifySync = async (sourceDb, targetDb, sourceCollectionNames) => {
    const results = [];

    for (const collectionName of sourceCollectionNames) {
        const result = await verifyCollection(sourceDb, targetDb, collectionName);
        if (!result.skipped) {
            results.push(result);
        }
    }

    const targetCollections = await targetDb.listCollections().toArray();
    for (const collectionInfo of targetCollections) {
        const collectionName = collectionInfo.name;
        if (!sourceCollectionNames.has(collectionName) && !shouldSkipCollection(collectionName)) {
            const targetCount = await targetDb.collection(collectionName).countDocuments();
            results.push({
                collectionName,
                sourceCount: 0,
                targetCount,
                missing: 0,
                extra: targetCount,
                changed: 0,
                ok: targetCount === 0
            });
        }
    }

    return results;
};

const applyLiveChange = async (targetDb, change) => {
    const collectionName = change.ns?.coll;
    if (!collectionName || shouldSkipCollection(collectionName)) return;

    const targetCollection = targetDb.collection(collectionName);

    switch (change.operationType) {
        case "insert":
        case "replace":
            if (change.fullDocument?._id) {
                await targetCollection.replaceOne(
                    { _id: change.fullDocument._id },
                    change.fullDocument,
                    { upsert: true }
                );
            }
            break;
        case "update":
            if (change.fullDocument?._id) {
                await targetCollection.replaceOne(
                    { _id: change.fullDocument._id },
                    change.fullDocument,
                    { upsert: true }
                );
            } else if (change.documentKey?._id && change.updateDescription) {
                const update = {};
                if (Object.keys(change.updateDescription.updatedFields || {}).length > 0) {
                    update.$set = change.updateDescription.updatedFields;
                }
                if ((change.updateDescription.removedFields || []).length > 0) {
                    update.$unset = Object.fromEntries(
                        change.updateDescription.removedFields.map(field => [field, ""])
                    );
                }
                if (Object.keys(update).length > 0) {
                    await targetCollection.updateOne({ _id: change.documentKey._id }, update);
                }
            }
            break;
        case "delete":
            if (change.documentKey?._id) {
                await targetCollection.deleteOne({ _id: change.documentKey._id });
            }
            break;
        default:
            break;
    }
};

const startLiveTail = (sourceDb, targetDb) => {
    if (!liveTailEnabled || dryRun) {
        return {
            enabled: false,
            waitForQuiet: async () => {},
            close: async () => {}
        };
    }

    const state = {
        pending: 0,
        applied: 0,
        failed: 0,
        lastActivityAt: Date.now(),
        closed: false
    };

    const changeStream = sourceDb.watch([], {
        fullDocument: "updateLookup",
        maxAwaitTimeMS: 1000
    });

    changeStream.on("change", (change) => {
        state.pending += 1;
        state.lastActivityAt = Date.now();

        applyLiveChange(targetDb, change)
            .then(() => {
                state.applied += 1;
            })
            .catch((error) => {
                state.failed += 1;
                console.warn(`live-tail failed for ${change.ns?.coll || "unknown"}: ${error.message}`);
            })
            .finally(() => {
                state.pending -= 1;
                state.lastActivityAt = Date.now();
            });
    });

    changeStream.on("error", (error) => {
        state.failed += 1;
        console.warn(`live-tail change stream error: ${error.message}`);
    });

    console.log("Live tail enabled: source changes during sync will be mirrored before verification.");

    return {
        enabled: true,
        waitForQuiet: async (quietMs = 3000, timeoutMs = 30000) => {
            const startedAt = Date.now();
            while (
                Date.now() - startedAt < timeoutMs &&
                (state.pending > 0 || Date.now() - state.lastActivityAt < quietMs)
            ) {
                await new Promise(resolve => setTimeout(resolve, 250));
            }
            console.log(`live-tail status: applied=${state.applied}, pending=${state.pending}, failed=${state.failed}`);
        },
        close: async () => {
            if (state.closed) return;
            state.closed = true;
            await changeStream.close().catch(() => {});
        }
    };
};

const repairFailedVerification = async (sourceDb, targetDb, sourceCollectionNames, failedResults) => {
    for (const result of failedResults) {
        if (sourceCollectionNames.has(result.collectionName)) {
            const repair = await syncCollection(sourceDb, targetDb, { name: result.collectionName });
            console.log(
                `repair ${repair.collectionName}: read=${repair.read}, upserted=${repair.written}, pruned=${repair.pruned}`
            );
            continue;
        }

        if (prune && !dryRun) {
            const targetCollections = await targetDb.listCollections({ name: result.collectionName }).toArray();
            if (targetCollections.length > 0) {
                await targetDb.collection(result.collectionName).drop();
                console.log(`repair dropped extra target collection ${result.collectionName}`);
            }
        }
    }
};

const runVerificationWithRepairs = async (sourceDb, targetDb, sourceCollectionNames) => {
    let verification = await verifySync(sourceDb, targetDb, sourceCollectionNames);
    let failed = verification.filter(result => !result.ok);
    let attempt = 0;

    while (failed.length > 0 && attempt < verifyRetries) {
        attempt += 1;
        console.log(`Verification repair pass ${attempt}/${verifyRetries}: ${failed.map(item => item.collectionName).join(", ")}`);
        await repairFailedVerification(sourceDb, targetDb, sourceCollectionNames, failed);
        await new Promise(resolve => setTimeout(resolve, 500));
        verification = await verifySync(sourceDb, targetDb, sourceCollectionNames);
        failed = verification.filter(result => !result.ok);
    }

    return { verification, failed };
};

const main = async () => {
    console.log(`Database mirror sync: ${sourceName} -> ${targetName}`);
    console.log(`Mode: ${dryRun ? "dry-run" : "write"}${prune ? " with prune" : ""}${verify ? " with verify" : ""}`);

    const source = await connect(sourceName, sourceUri);
    const target = await connect(targetName, targetUri);
    const liveTail = startLiveTail(source.db, target.db);

    try {
        const collections = await source.db.listCollections().toArray();
        const sourceCollectionNames = new Set(
            collections
                .map(collectionInfo => collectionInfo.name)
                .filter(collectionName => !shouldSkipCollection(collectionName))
        );

        for (const collectionInfo of collections) {
            const result = await syncCollection(source.db, target.db, collectionInfo);

            if (result.skipped) {
                console.log(`Skipped ${result.collectionName}`);
                continue;
            }

            console.log(
                `${result.collectionName}: read=${result.read}, upserted=${result.written}, pruned=${result.pruned}`
            );
        }

        const droppedCollections = await pruneExtraTargetCollections(source.db, target.db, sourceCollectionNames);
        for (const dropped of droppedCollections) {
            console.log(
                `${dryRun ? "Would drop" : "Dropped"} extra target collection ` +
                `${dropped.collectionName} (${dropped.documentCount} documents)`
            );
        }

        if (verify && !dryRun) {
            await liveTail.waitForQuiet();
            const { verification, failed } = await runVerificationWithRepairs(
                source.db,
                target.db,
                sourceCollectionNames
            );

            for (const result of verification) {
                console.log(
                    `verify ${result.collectionName}: source=${result.sourceCount}, target=${result.targetCount}, ` +
                    `missing=${result.missing}, extra=${result.extra}, changed=${result.changed}, ok=${result.ok}`
                );
            }

            if (failed.length > 0) {
                throw new Error(`Verification failed for ${failed.length} collection(s)`);
            }

            console.log("Database mirror verification passed: no missing or extra documents.");
        }

        console.log("Database mirror sync completed.");
    } finally {
        await liveTail.close();
        await Promise.allSettled([source.close(), target.close()]);
    }
};

main().catch((error) => {
    console.error("Database mirror sync failed:", error.message);
    process.exit(1);
});
