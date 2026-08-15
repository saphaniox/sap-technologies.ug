require("dotenv").config();

const crypto = require("crypto");
const mongoose = require("mongoose");

const { MongoClient } = mongoose.mongo;

const SYSTEM_COLLECTION_PREFIX = "system.";
const DEFAULT_BATCH_SIZE = 500;
const DEFAULT_SOURCE_DB = "test";
const DEFAULT_TARGET_DB = "sap-technologies";
const INTERNAL_COLLECTIONS = new Set(["mirror_outbox"]);

const args = process.argv.slice(2);
const flags = new Set(args.filter(arg => arg.startsWith("--") && !arg.includes("=")));

const getArgValue = (name, fallback) => {
  const prefix = `${name}=`;
  const arg = args.find(item => item.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : fallback;
};

const dryRun = flags.has("--dry-run");
const prune = flags.has("--prune");
const verify = !dryRun && !flags.has("--no-verify");
const sourceDbName = getArgValue("--source", process.env.MONGODB_MIGRATION_SOURCE_DB || DEFAULT_SOURCE_DB);
const targetDbName = getArgValue("--target", process.env.MONGODB_MIGRATION_TARGET_DB || process.env.MONGODB_DB_NAME || DEFAULT_TARGET_DB);
const batchSize = Number.parseInt(getArgValue("--batch-size", String(DEFAULT_BATCH_SIZE)), 10) || DEFAULT_BATCH_SIZE;

const shouldSkipCollection = (collectionName) => (
  collectionName.startsWith(SYSTEM_COLLECTION_PREFIX) || INTERNAL_COLLECTIONS.has(collectionName)
);

const maskMongoUri = (uri = "") => uri.replace(/\/\/.*@/, "//***:***@");

const getMongoOptions = (uri) => {
  const usesSrvUri = uri?.startsWith("mongodb+srv://");
  const tlsEnabled = process.env.DB_TLS
    ? process.env.DB_TLS === "true"
    : usesSrvUri;
  const validateTls = process.env.DB_SSL_VALIDATE !== "false";

  return {
    tls: tlsEnabled,
    tlsAllowInvalidCertificates: tlsEnabled && !validateTls,
    authSource: process.env.DB_AUTH_SOURCE || "admin",
    readPreference: "primary",
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 120000,
    family: 4,
    retryWrites: true,
    w: "majority"
  };
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
  const cursor = collection.find({}).batchSize(batchSize);

  for await (const doc of cursor) {
    documents.set(String(doc._id), hashDocument(doc));
  }

  return documents;
};

const flushBulk = async (collection, ops) => {
  if (ops.length === 0) return { matched: 0, modified: 0, upserted: 0 };

  if (dryRun) {
    const count = ops.length;
    ops.length = 0;
    return { matched: 0, modified: 0, upserted: count };
  }

  const result = await collection.bulkWrite(ops.splice(0), { ordered: false });
  return {
    matched: result.matchedCount || 0,
    modified: result.modifiedCount || 0,
    upserted: result.upsertedCount || 0
  };
};

const copyIndexes = async (sourceCollection, targetCollection) => {
  const indexes = await sourceCollection.indexes();
  const secondaryIndexes = indexes.filter(index => index.name !== "_id_");

  if (secondaryIndexes.length === 0 || dryRun) {
    return { attempted: secondaryIndexes.length, created: dryRun ? 0 : secondaryIndexes.length, failed: 0 };
  }

  let created = 0;
  let failed = 0;

  for (const index of secondaryIndexes) {
    const { key, ns, v, ...options } = index;

    try {
      await targetCollection.createIndex(key, options);
      created += 1;
    } catch (error) {
      failed += 1;
      console.warn(`  index warning on ${targetCollection.collectionName}.${index.name}: ${error.message}`);
    }
  }

  return { attempted: secondaryIndexes.length, created, failed };
};

const migrateCollection = async (sourceDb, targetDb, collectionInfo) => {
  const collectionName = collectionInfo.name;

  if (shouldSkipCollection(collectionName)) {
    return { collectionName, skipped: true };
  }

  const sourceCollection = sourceDb.collection(collectionName);
  const targetCollection = targetDb.collection(collectionName);
  const cursor = sourceCollection.find({}).batchSize(batchSize);
  const sourceIds = new Set();
  const ops = [];
  const counts = {
    read: 0,
    matched: 0,
    modified: 0,
    upserted: 0,
    pruned: 0
  };

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

    if (ops.length >= batchSize) {
      const result = await flushBulk(targetCollection, ops);
      counts.matched += result.matched;
      counts.modified += result.modified;
      counts.upserted += result.upserted;
    }
  }

  const result = await flushBulk(targetCollection, ops);
  counts.matched += result.matched;
  counts.modified += result.modified;
  counts.upserted += result.upserted;

  if (prune) {
    const deleteOps = [];
    const targetCursor = targetCollection.find({}, { projection: { _id: 1 } }).batchSize(batchSize);

    for await (const doc of targetCursor) {
      if (!sourceIds.has(String(doc._id))) {
        deleteOps.push({ deleteOne: { filter: { _id: doc._id } } });
        counts.pruned += 1;
      }

      if (deleteOps.length >= batchSize) {
        if (!dryRun) await targetCollection.bulkWrite(deleteOps.splice(0), { ordered: false });
        else deleteOps.length = 0;
      }
    }

    if (deleteOps.length > 0 && !dryRun) {
      await targetCollection.bulkWrite(deleteOps, { ordered: false });
    }
  }

  const indexes = await copyIndexes(sourceCollection, targetCollection);

  return { collectionName, ...counts, indexes };
};

const pruneExtraCollections = async (sourceDb, targetDb, sourceCollectionNames) => {
  if (!prune) return [];

  const dropped = [];
  const targetCollections = await targetDb.listCollections().toArray();

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

const verifyCollection = async (sourceDb, targetDb, collectionName) => {
  const [sourceDocuments, targetDocuments] = await Promise.all([
    collectDocumentHashes(sourceDb.collection(collectionName)),
    collectDocumentHashes(targetDb.collection(collectionName))
  ]);

  let missing = 0;
  let changed = 0;
  let extra = 0;

  for (const [id, sourceHash] of sourceDocuments.entries()) {
    if (!targetDocuments.has(id)) {
      missing += 1;
    } else if (targetDocuments.get(id) !== sourceHash) {
      changed += 1;
    }
  }

  for (const id of targetDocuments.keys()) {
    if (!sourceDocuments.has(id)) {
      extra += 1;
    }
  }

  return {
    collectionName,
    sourceCount: sourceDocuments.size,
    targetCount: targetDocuments.size,
    missing,
    changed,
    extra,
    ok: missing === 0 && changed === 0 && (!prune || extra === 0)
  };
};

const main = async () => {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGODB_LOCAL;

  if (!mongoUri) {
    throw new Error("Missing MONGODB_URI or MONGODB_LOCAL in environment.");
  }

  if (!sourceDbName || !targetDbName) {
    throw new Error("Both source and target database names are required.");
  }

  if (sourceDbName === targetDbName) {
    throw new Error(`Source and target database are both "${sourceDbName}". Nothing to migrate.`);
  }

  console.log(`Database name migration: ${sourceDbName} -> ${targetDbName}`);
  console.log(`Mode: ${dryRun ? "dry-run" : "write"}${prune ? " with prune" : ""}${verify ? " with verify" : ""}`);
  console.log(`Connecting to MongoDB: ${maskMongoUri(mongoUri)}`);

  const client = new MongoClient(mongoUri, getMongoOptions(mongoUri));
  await client.connect();

  const sourceDb = client.db(sourceDbName);
  const targetDb = client.db(targetDbName);

  try {
    const collections = await sourceDb.listCollections().toArray();
    const sourceCollections = collections.filter(collectionInfo => !shouldSkipCollection(collectionInfo.name));
    const sourceCollectionNames = new Set(sourceCollections.map(collectionInfo => collectionInfo.name));

    console.log(`Found ${sourceCollections.length} source collections.`);

    for (const collectionInfo of sourceCollections) {
      const result = await migrateCollection(sourceDb, targetDb, collectionInfo);

      if (result.skipped) {
        console.log(`skip ${result.collectionName}`);
        continue;
      }

      console.log(
        [
          `copy ${result.collectionName}:`,
          `read=${result.read}`,
          `matched=${result.matched}`,
          `modified=${result.modified}`,
          `upserted=${result.upserted}`,
          `pruned=${result.pruned}`,
          `indexes=${result.indexes.created}/${result.indexes.attempted}`
        ].join(" ")
      );
    }

    const droppedCollections = await pruneExtraCollections(sourceDb, targetDb, sourceCollectionNames);
    for (const item of droppedCollections) {
      console.log(`drop extra collection ${item.collectionName}: documents=${item.documentCount}`);
    }

    if (verify) {
      console.log("Verifying migrated documents...");
      const verification = [];

      for (const collectionName of sourceCollectionNames) {
        verification.push(await verifyCollection(sourceDb, targetDb, collectionName));
      }

      const failed = verification.filter(item => !item.ok);
      for (const item of verification) {
        console.log(
          [
            `verify ${item.collectionName}:`,
            `source=${item.sourceCount}`,
            `target=${item.targetCount}`,
            `missing=${item.missing}`,
            `changed=${item.changed}`,
            `extra=${item.extra}`,
            item.ok ? "ok" : "needs-attention"
          ].join(" ")
        );
      }

      if (failed.length > 0) {
        throw new Error(`Verification failed for: ${failed.map(item => item.collectionName).join(", ")}`);
      }
    }

    console.log(`Migration complete. Set MONGODB_DB_NAME=${targetDbName} on the server and redeploy.`);
  } finally {
    await client.close();
  }
};

main().catch(error => {
  console.error(`Migration failed: ${error.message}`);
  process.exitCode = 1;
});
