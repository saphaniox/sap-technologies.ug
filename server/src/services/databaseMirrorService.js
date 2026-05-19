const mongoose = require("mongoose");

const OUTBOX_COLLECTION = "mirror_outbox";
const DEFAULT_BATCH_SIZE = 500;

const maskMongoUri = (uri = "") => uri.replace(/\/\/.*@/, "//***:***@");

const state = {
    enabled: false,
    activeCluster: "primary",
    targetCluster: null,
    targetUri: null,
    options: {},
    connection: null,
    reconnectTimer: null,
    replayTimer: null,
    catchUpTimer: null,
    reconnecting: false,
    replayingOutbox: false,
    catchUpRunning: false,
    pendingCatchUp: false,
    lastError: null,
    lastOutboxReplayAt: null,
    lastCatchUpAt: null,
    lastCatchUpResult: null,
    lastCatchUpError: null
};

const isEnabledFromEnv = () => process.env.MONGODB_MIRROR_ENABLED === "true";

const numberFromEnv = (name, fallback) => {
    const value = parseInt(process.env[name], 10);
    return Number.isFinite(value) && value > 0 ? value : fallback;
};

const reconnectMs = () => numberFromEnv("MONGODB_MIRROR_RETRY_MS", 60000);
const outboxReplayMs = () => numberFromEnv("MONGODB_MIRROR_OUTBOX_REPLAY_MS", 30000);
const catchUpMs = () => numberFromEnv("MONGODB_MIRROR_CATCH_UP_INTERVAL_MS", 300000);
const mirrorTimeoutMs = () => numberFromEnv("MONGODB_MIRROR_TIMEOUT_MS", 5000);
const catchUpBatchSize = () => numberFromEnv("MONGODB_MIRROR_CATCH_UP_BATCH_SIZE", DEFAULT_BATCH_SIZE);
const outboxBatchSize = () => numberFromEnv("MONGODB_MIRROR_OUTBOX_BATCH_SIZE", 250);
const catchUpEnabled = () => process.env.MONGODB_MIRROR_CATCH_UP_ENABLED !== "false";
const catchUpPruneEnabled = () => process.env.MONGODB_MIRROR_CATCH_UP_PRUNE === "true";

const getActiveDb = () => mongoose.connection?.readyState === 1 ? mongoose.connection.db : null;

const clearTimer = (timer) => {
    if (timer) clearInterval(timer);
};

const closeMirrorConnection = async () => {
    clearTimer(state.reconnectTimer);
    clearTimer(state.replayTimer);
    clearTimer(state.catchUpTimer);
    state.reconnectTimer = null;
    state.replayTimer = null;
    state.catchUpTimer = null;

    if (state.connection) {
        await state.connection.close().catch(() => {});
        state.connection = null;
    }
};

const executeMirrorOperation = async (connection, operation) => {
    const collection = connection.collection(operation.collectionName);

    switch (operation.type) {
        case "replaceOne":
            return collection.replaceOne(operation.filter, operation.replacement, {
                upsert: !!operation.options?.upsert
            });
        case "updateOne":
        case "updateMany":
            return collection[operation.type](operation.filter, operation.update, {
                upsert: !!operation.options?.upsert
            });
        case "deleteOne":
        case "deleteMany":
            return collection[operation.type](operation.filter);
        case "bulkWrite":
            return collection.bulkWrite(operation.operations, { ordered: false });
        default:
            throw new Error(`Unsupported mirror operation: ${operation.type}`);
    }
};

const enqueueOutboxOperation = async (operation, reason, error) => {
    if (!operation?.collectionName || operation.collectionName === OUTBOX_COLLECTION) return;

    const activeDb = getActiveDb();
    if (!activeDb) return;

    try {
        await activeDb.collection(OUTBOX_COLLECTION).insertOne({
            operation,
            reason,
            attempts: 0,
            lastError: error?.message || String(error || ""),
            createdAt: new Date(),
            updatedAt: new Date()
        });
    } catch (outboxError) {
        state.lastError = outboxError.message;
        console.warn(`Database mirror outbox write failed: ${outboxError.message}`);
    }
};

const replayOutbox = async (reason = "scheduled") => {
    if (!state.enabled || state.replayingOutbox) return;

    const activeDb = getActiveDb();
    const target = state.connection?.readyState === 1
        ? state.connection
        : await connectMirror({ queueMaintenance: false });

    if (!activeDb || !target || target.readyState !== 1) return;

    state.replayingOutbox = true;

    try {
        const pending = await activeDb
            .collection(OUTBOX_COLLECTION)
            .find({})
            .sort({ createdAt: 1 })
            .limit(outboxBatchSize())
            .toArray();

        for (const item of pending) {
            try {
                await executeMirrorOperation(target, item.operation);
                await activeDb.collection(OUTBOX_COLLECTION).deleteOne({ _id: item._id });
            } catch (error) {
                state.lastError = error.message;
                await activeDb.collection(OUTBOX_COLLECTION).updateOne(
                    { _id: item._id },
                    {
                        $inc: { attempts: 1 },
                        $set: {
                            lastError: error.message,
                            lastAttemptAt: new Date(),
                            updatedAt: new Date()
                        }
                    }
                );
                console.warn(`Database mirror outbox replay stopped (${reason}): ${error.message}`);
                break;
            }
        }

        state.lastOutboxReplayAt = new Date().toISOString();
    } catch (error) {
        state.lastError = error.message;
        console.warn(`Database mirror outbox replay failed (${reason}): ${error.message}`);
    } finally {
        state.replayingOutbox = false;
    }
};

const queueOutboxReplay = (reason) => {
    if (!state.enabled) return;
    setImmediate(() => replayOutbox(reason).catch(() => {}));
};

const flushBulk = async (collectionName, targetCollection, ops, counts) => {
    if (ops.length === 0) return;

    counts.written += ops.length;
    await targetCollection.bulkWrite(ops.splice(0), { ordered: false });
};

const syncCollection = async (sourceDb, targetDb, collectionInfo) => {
    const collectionName = collectionInfo.name;

    if (collectionName.startsWith("system.") || collectionName === OUTBOX_COLLECTION) {
        return { collectionName, skipped: true };
    }

    const sourceCollection = sourceDb.collection(collectionName);
    const targetCollection = targetDb.collection(collectionName);
    const cursor = sourceCollection.find({}).batchSize(catchUpBatchSize());
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

        if (ops.length >= catchUpBatchSize()) {
            await flushBulk(collectionName, targetCollection, ops, counts);
        }
    }

    await flushBulk(collectionName, targetCollection, ops, counts);

    if (catchUpPruneEnabled()) {
        const targetCursor = targetCollection.find({}, { projection: { _id: 1 } }).batchSize(catchUpBatchSize());
        const deleteOps = [];

        for await (const doc of targetCursor) {
            if (!sourceIds.has(String(doc._id))) {
                deleteOps.push({ deleteOne: { filter: { _id: doc._id } } });
                counts.pruned += 1;
            }

            if (deleteOps.length >= catchUpBatchSize()) {
                await targetCollection.bulkWrite(deleteOps.splice(0), { ordered: false });
            }
        }

        if (deleteOps.length > 0) {
            await targetCollection.bulkWrite(deleteOps, { ordered: false });
        }
    }

    return { collectionName, ...counts };
};

const runCatchUpSync = async (reason = "scheduled") => {
    if (!state.enabled || !catchUpEnabled()) return;
    if (state.catchUpRunning) {
        state.pendingCatchUp = true;
        return;
    }

    const sourceDb = getActiveDb();
    const target = state.connection?.readyState === 1
        ? state.connection
        : await connectMirror({ queueMaintenance: false });

    if (!sourceDb || !target || target.readyState !== 1) return;

    state.catchUpRunning = true;
    state.pendingCatchUp = false;

    try {
        await replayOutbox(`before-catch-up:${reason}`);

        const collections = await sourceDb.listCollections().toArray();
        const totals = { collections: 0, read: 0, written: 0, pruned: 0 };

        for (const collectionInfo of collections) {
            const result = await syncCollection(sourceDb, target.db, collectionInfo);
            if (result.skipped) continue;

            totals.collections += 1;
            totals.read += result.read || 0;
            totals.written += result.written || 0;
            totals.pruned += result.pruned || 0;
        }

        state.lastCatchUpAt = new Date().toISOString();
        state.lastCatchUpResult = { reason, ...totals };
        state.lastCatchUpError = null;
        console.log(
            `Database mirror catch-up completed (${reason}): ` +
            `collections=${totals.collections}, read=${totals.read}, upserted=${totals.written}, pruned=${totals.pruned}`
        );
    } catch (error) {
        state.lastCatchUpError = error.message;
        state.lastError = error.message;
        console.warn(`Database mirror catch-up failed (${reason}): ${error.message}`);
    } finally {
        state.catchUpRunning = false;

        if (state.pendingCatchUp) {
            queueCatchUpSync("pending");
        }
    }
};

const queueCatchUpSync = (reason) => {
    if (!state.enabled || !catchUpEnabled()) return;
    setImmediate(() => runCatchUpSync(reason).catch(() => {}));
};

const connectMirror = async ({ queueMaintenance = true } = {}) => {
    if (!state.enabled || !state.targetUri) return null;
    if (state.connection?.readyState === 1) return state.connection;
    if (state.reconnecting) return state.connection;

    state.reconnecting = true;

    try {
        if (!state.connection) {
            state.connection = mongoose.createConnection();
        }

        if (state.connection.readyState === 0) {
            await state.connection.openUri(state.targetUri, {
                ...state.options,
                serverSelectionTimeoutMS: mirrorTimeoutMs()
            });
        } else if (state.connection.readyState !== 1) {
            await state.connection.asPromise();
        }

        state.lastError = null;
        console.log(`Database mirror connected to ${state.targetCluster}: ${maskMongoUri(state.targetUri)}`);

        if (queueMaintenance) {
            queueOutboxReplay("mirror-connected");
            queueCatchUpSync("mirror-connected");
        }

        return state.connection;
    } catch (error) {
        state.lastError = error.message;
        console.warn(`Database mirror unavailable (${state.targetCluster}): ${error.message}`);
        return null;
    } finally {
        state.reconnecting = false;
    }
};

const scheduleReconnect = () => {
    if (state.reconnectTimer || !state.enabled || !state.targetUri) return;

    state.reconnectTimer = setInterval(() => {
        if (state.connection?.readyState !== 1) {
            connectMirror().catch(() => {});
        }
    }, reconnectMs());

    if (state.reconnectTimer.unref) {
        state.reconnectTimer.unref();
    }
};

const scheduleOutboxReplay = () => {
    if (state.replayTimer || !state.enabled || !state.targetUri) return;

    state.replayTimer = setInterval(() => {
        replayOutbox("interval").catch(() => {});
    }, outboxReplayMs());

    if (state.replayTimer.unref) {
        state.replayTimer.unref();
    }
};

const scheduleCatchUp = () => {
    if (state.catchUpTimer || !state.enabled || !state.targetUri || !catchUpEnabled()) return;

    state.catchUpTimer = setInterval(() => {
        runCatchUpSync("interval").catch(() => {});
    }, catchUpMs());

    if (state.catchUpTimer.unref) {
        state.catchUpTimer.unref();
    }
};

const initializeMirror = async ({ activeCluster, targetCluster, targetUri, options = {} }) => {
    await closeMirrorConnection();

    state.enabled = isEnabledFromEnv() && !!targetUri;
    state.activeCluster = activeCluster;
    state.targetCluster = targetCluster;
    state.targetUri = targetUri;
    state.options = options;
    state.lastError = null;
    state.lastCatchUpError = null;

    if (!state.enabled) {
        if (!targetUri) {
            console.log("Database mirror disabled: no secondary cluster URI configured.");
        } else {
            console.log("Database mirror disabled. Set MONGODB_MIRROR_ENABLED=true to enable write mirroring.");
        }
        return;
    }

    await connectMirror();
    scheduleReconnect();
    scheduleOutboxReplay();
    scheduleCatchUp();
};

const getMirrorCollection = () => {
    if (!state.enabled || state.connection?.readyState !== 1) {
        return null;
    }

    return state.connection;
};

const scheduleMirrorOperation = (description, operation) => {
    if (!state.enabled) return;

    setImmediate(async () => {
        const connection = getMirrorCollection() || await connectMirror();

        if (!connection || connection.readyState !== 1) {
            await enqueueOutboxOperation(operation, "mirror_unavailable");
            return;
        }

        try {
            await executeMirrorOperation(connection, operation);
        } catch (error) {
            state.lastError = error.message;
            console.warn(`Database mirror write failed (${description}): ${error.message}`);
            await enqueueOutboxOperation(operation, "mirror_write_failed", error);
        }
    });
};

const upsertDocument = (collectionName, document) => {
    if (!document?._id) return;

    scheduleMirrorOperation(`${collectionName}.replaceOne`, {
        type: "replaceOne",
        collectionName,
        filter: { _id: document._id },
        replacement: document,
        options: { upsert: true }
    });
};

const upsertDocuments = (collectionName, documents = []) => {
    const operations = documents
        .filter(doc => doc?._id)
        .map(doc => ({
            replaceOne: {
                filter: { _id: doc._id },
                replacement: doc,
                upsert: true
            }
        }));

    for (let i = 0; i < operations.length; i += 100) {
        scheduleMirrorOperation(`${collectionName}.bulkWrite`, {
            type: "bulkWrite",
            collectionName,
            operations: operations.slice(i, i + 100)
        });
    }
};

const applyUpdate = (collectionName, filter, update, options = {}) => {
    if (!filter || !update) return;

    scheduleMirrorOperation(`${collectionName}.${options.multi ? "updateMany" : "updateOne"}`, {
        type: options.multi ? "updateMany" : "updateOne",
        collectionName,
        filter,
        update,
        options: { upsert: !!options.upsert }
    });
};

const replaceOne = (collectionName, filter, replacement, options = {}) => {
    if (!filter || !replacement) return;

    scheduleMirrorOperation(`${collectionName}.replaceOne`, {
        type: "replaceOne",
        collectionName,
        filter,
        replacement,
        options: { upsert: !!options.upsert }
    });
};

const deleteDocuments = (collectionName, filter, options = {}) => {
    if (!filter) return;

    scheduleMirrorOperation(`${collectionName}.${options.multi ? "deleteMany" : "deleteOne"}`, {
        type: options.multi ? "deleteMany" : "deleteOne",
        collectionName,
        filter
    });
};

const getMirrorStatus = () => ({
    enabled: state.enabled,
    activeCluster: state.activeCluster,
    targetCluster: state.targetCluster,
    targetConnected: state.connection?.readyState === 1,
    targetReadyState: state.connection?.readyState || 0,
    outboxReplaying: state.replayingOutbox,
    catchUpRunning: state.catchUpRunning,
    lastOutboxReplayAt: state.lastOutboxReplayAt,
    lastCatchUpAt: state.lastCatchUpAt,
    lastCatchUpResult: state.lastCatchUpResult,
    lastCatchUpError: state.lastCatchUpError,
    lastError: state.lastError
});

module.exports = {
    initializeMirror,
    closeMirrorConnection,
    getMirrorStatus,
    upsertDocument,
    upsertDocuments,
    applyUpdate,
    replaceOne,
    deleteDocuments,
    maskMongoUri
};
