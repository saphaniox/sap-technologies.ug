require("dotenv").config();

const mongoose = require("mongoose");
const { isDeepStrictEqual } = require("node:util");

const { MongoClient } = mongoose.mongo;
const BATCH_SIZE = 500;
const COLLECTION_OPTION_KEYS = [
    "capped",
    "size",
    "max",
    "validator",
    "validationLevel",
    "validationAction",
    "collation",
    "expireAfterSeconds",
    "clusteredIndex",
    "changeStreamPreAndPostImages",
    "timeseries",
    "encryptedFields"
];

const sourceUri = process.env.MONGODB_COPY_SOURCE_URI;
const targetUri = process.env.MONGODB_COPY_TARGET_URI;
const databaseName = process.env.MONGODB_COPY_DATABASE || process.env.MONGODB_DB_NAME || "sap-technologies";
const resume = process.argv.includes("--resume");

const createClient = (uri, name) => {
    if (!uri) {
        throw new Error(`Missing MONGODB_COPY_${name.toUpperCase()}_URI`);
    }

    if (!/^mongodb(?:\+srv)?:\/\//i.test(uri)) {
        throw new Error(`MONGODB_COPY_${name.toUpperCase()}_URI must be a MongoDB connection URI`);
    }

    return new MongoClient(uri, {
        maxPoolSize: 5,
        serverSelectionTimeoutMS: 15000,
        socketTimeoutMS: 120000
    });
};

const getMongoAddress = (uri) => {
    const parsedUri = new URL(uri);
    return `${parsedUri.hostname}:${parsedUri.port || (parsedUri.protocol === "mongodb+srv:" ? "srv" : "27017")}`;
};

const getCollectionOptions = (collectionInfo) => (
    Object.fromEntries(
        COLLECTION_OPTION_KEYS
            .filter(key => collectionInfo.options?.[key] !== undefined)
            .map(key => [key, collectionInfo.options[key]])
    )
);

const copyIndexes = async (sourceCollection, targetCollection) => {
    const indexes = await sourceCollection.listIndexes().toArray();

    for (const index of indexes) {
        if (index.name === "_id_") continue;

        const { key, name, ns, v, background, ...options } = index;
        await targetCollection.createIndex(key, { ...options, name });
    }

    const targetIndexes = await targetCollection.listIndexes().toArray();
    const normalizeIndex = ({ v, ns, background, ...spec }) => spec;
    const targetIndexesByName = new Map(targetIndexes.map(index => [index.name, index]));

    for (const index of indexes) {
        const targetIndex = targetIndexesByName.get(index.name);
        if (!targetIndex || !isDeepStrictEqual(normalizeIndex(index), normalizeIndex(targetIndex))) {
            throw new Error(`Index verification failed for ${targetCollection.collectionName}.${index.name}`);
        }
    }

    return indexes.length;
};

const copyCollection = async (sourceDb, targetDb, collectionInfo) => {
    const { name } = collectionInfo;
    const sourceCollection = sourceDb.collection(name);
    const targetCollection = targetDb.collection(name);
    const sourceCount = await sourceCollection.countDocuments();
    const cursor = sourceCollection.find({}, { batchSize: BATCH_SIZE, noCursorTimeout: true });
    let copied = 0;
    let batch = [];

    for await (const document of cursor) {
        batch.push(document);

        if (batch.length >= BATCH_SIZE) {
            if (resume) {
                await targetCollection.bulkWrite(batch.map(document => ({
                    replaceOne: {
                        filter: { _id: document._id },
                        replacement: document,
                        upsert: true
                    }
                })), { ordered: true });
            } else {
                await targetCollection.insertMany(batch, { ordered: true });
            }
            copied += batch.length;
            batch = [];
        }
    }

    if (batch.length > 0) {
        if (resume) {
            await targetCollection.bulkWrite(batch.map(document => ({
                replaceOne: {
                    filter: { _id: document._id },
                    replacement: document,
                    upsert: true
                }
            })), { ordered: true });
        } else {
            await targetCollection.insertMany(batch, { ordered: true });
        }
        copied += batch.length;
    }

    const indexCount = await copyIndexes(sourceCollection, targetCollection);
    const targetCount = await targetCollection.countDocuments();

    if (copied !== sourceCount || targetCount !== sourceCount) {
        throw new Error(
            `${name} count verification failed (source=${sourceCount}, copied=${copied}, target=${targetCount})`
        );
    }

    console.log(`Copied ${name}: ${copied} documents; ${indexCount} indexes verified.`);
};

const copyView = async (sourceDb, targetDb, viewInfo, existingTargetNames) => {
    const viewOptions = {
        viewOn: viewInfo.options.viewOn,
        pipeline: viewInfo.options.pipeline || []
    };

    if (viewInfo.options.collation) {
        viewOptions.collation = viewInfo.options.collation;
    }

    if (!existingTargetNames.has(viewInfo.name)) {
        await targetDb.createCollection(viewInfo.name, viewOptions);
    }

    const [sourceCount, targetCount] = await Promise.all([
        sourceDb.collection(viewInfo.name).countDocuments(),
        targetDb.collection(viewInfo.name).countDocuments()
    ]);

    if (sourceCount !== targetCount) {
        throw new Error(
            `${viewInfo.name} view verification failed (source=${sourceCount}, target=${targetCount})`
        );
    }

    console.log(`Verified view ${viewInfo.name}: ${targetCount} documents.`);
};

const main = async () => {
    if (!databaseName.trim()) {
        throw new Error("MONGODB_COPY_DATABASE must be a non-empty database name");
    }

    if (sourceUri && targetUri && getMongoAddress(sourceUri) === getMongoAddress(targetUri)) {
        throw new Error("Source and destination MongoDB addresses must be different.");
    }

    const sourceClient = createClient(sourceUri, "source");
    const targetClient = createClient(targetUri, "target");

    try {
        await Promise.all([sourceClient.connect(), targetClient.connect()]);

        const sourceDb = sourceClient.db(databaseName);
        const targetDb = targetClient.db(databaseName);
        const sourceCollections = (await sourceDb.listCollections().toArray())
            .filter(({ name }) => !name.startsWith("system."));
        const targetCollections = (await targetDb.listCollections().toArray())
            .filter(({ name }) => !name.startsWith("system."));

        if (sourceCollections.length === 0) {
            throw new Error(`No application collections found in source database "${databaseName}"`);
        }

        const sourceByName = new Map(sourceCollections.map(info => [info.name, info]));
        if (targetCollections.length > 0 && !resume) {
            throw new Error(
                `Destination database "${databaseName}" is not empty ` +
                `(${targetCollections.map(({ name }) => name).join(", ")}). ` +
                "No data was copied. Use --resume only if this is a partial copy from this script."
            );
        }

        for (const targetInfo of targetCollections) {
            const sourceInfo = sourceByName.get(targetInfo.name);
            if (!sourceInfo || sourceInfo.type !== targetInfo.type) {
                throw new Error(
                    `Destination contains unexpected collection "${targetInfo.name}" ` +
                    `(${targetInfo.type}); refusing to continue.`
                );
            }
        }

        const unsupported = sourceCollections.filter(
            ({ type }) => !["collection", "timeseries", "view"].includes(type)
        );
        if (unsupported.length > 0) {
            throw new Error(
                `Unsupported source collection types: ${unsupported.map(({ name, type }) => `${name} (${type})`).join(", ")}`
            );
        }

        console.log(
            `Copying ${sourceCollections.length} collections/views into "${databaseName}"` +
            `${resume ? " (resume mode)" : ""}.`
        );

        const regularCollections = sourceCollections.filter(
            ({ type }) => type === "collection" || type === "timeseries"
        );
        const views = sourceCollections.filter(({ type }) => type === "view");
        const existingTargetNames = new Set(targetCollections.map(({ name }) => name));

        for (const collectionInfo of regularCollections) {
            if (!existingTargetNames.has(collectionInfo.name)) {
                await targetDb.createCollection(collectionInfo.name, getCollectionOptions(collectionInfo));
            }
        }

        for (const collectionInfo of regularCollections) {
            await copyCollection(sourceDb, targetDb, collectionInfo);
        }

        for (const viewInfo of views) {
            await copyView(sourceDb, targetDb, viewInfo, existingTargetNames);
        }

        console.log(`Database copy completed and verified for "${databaseName}".`);
    } finally {
        await Promise.all([
            sourceClient.close(),
            targetClient.close()
        ]);
    }
};

main().catch(error => {
    console.error(`Database copy failed: ${error.message}`);
    process.exitCode = 1;
});
