require("dotenv").config();

const mongoose = require("mongoose");

const maskMongoUri = (uri = "") => uri.replace(/\/\/.*@/, "//***:***@");

const args = new Set(process.argv.slice(2));
const reverse = args.has("--reverse");
const prune = args.has("--prune");
const dryRun = args.has("--dry-run");

const primaryUri = process.env.MONGODB_URI || process.env.MONGODB_LOCAL;
const secondaryUri = process.env.MONGODB_SECONDARY_URI || process.env.MONGODB_MIRROR_URI;

const sourceUri = reverse ? secondaryUri : primaryUri;
const targetUri = reverse ? primaryUri : secondaryUri;
const sourceName = reverse ? "secondary" : "primary";
const targetName = reverse ? "primary" : "secondary";

const options = {
    ssl: process.env.DB_SSL_VALIDATE !== "false",
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

const syncCollection = async (sourceDb, targetDb, collectionInfo) => {
    const collectionName = collectionInfo.name;

    if (collectionName.startsWith("system.")) {
        return { collectionName, skipped: true };
    }

    const sourceCollection = sourceDb.collection(collectionName);
    const targetCollection = targetDb.collection(collectionName);
    const cursor = sourceCollection.find({}).batchSize(500);
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

        if (ops.length >= 500) {
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

const main = async () => {
    console.log(`Database mirror sync: ${sourceName} -> ${targetName}`);
    console.log(`Mode: ${dryRun ? "dry-run" : "write"}${prune ? " with prune" : ""}`);

    const source = await connect(sourceName, sourceUri);
    const target = await connect(targetName, targetUri);

    try {
        const collections = await source.db.listCollections().toArray();

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

        console.log("Database mirror sync completed.");
    } finally {
        await Promise.allSettled([source.close(), target.close()]);
    }
};

main().catch((error) => {
    console.error("Database mirror sync failed:", error.message);
    process.exit(1);
});
