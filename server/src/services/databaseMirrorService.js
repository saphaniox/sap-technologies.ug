const mongoose = require("mongoose");

const maskMongoUri = (uri = "") => uri.replace(/\/\/.*@/, "//***:***@");

const state = {
    enabled: false,
    activeCluster: "primary",
    targetCluster: null,
    targetUri: null,
    options: {},
    connection: null,
    reconnectTimer: null,
    reconnecting: false,
    lastError: null
};

const isEnabledFromEnv = () => process.env.MONGODB_MIRROR_ENABLED === "true";
const reconnectMs = () => parseInt(process.env.MONGODB_MIRROR_RETRY_MS, 10) || 60000;

const closeMirrorConnection = async () => {
    if (state.reconnectTimer) {
        clearInterval(state.reconnectTimer);
        state.reconnectTimer = null;
    }

    if (state.connection) {
        await state.connection.close().catch(() => {});
        state.connection = null;
    }
};

const connectMirror = async () => {
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
                serverSelectionTimeoutMS: parseInt(process.env.MONGODB_MIRROR_TIMEOUT_MS, 10) || 5000
            });
        } else if (state.connection.readyState !== 1) {
            await state.connection.asPromise();
        }

        state.lastError = null;
        console.log(`Database mirror connected to ${state.targetCluster}: ${maskMongoUri(state.targetUri)}`);
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

const initializeMirror = async ({ activeCluster, targetCluster, targetUri, options = {} }) => {
    await closeMirrorConnection();

    state.enabled = isEnabledFromEnv() && !!targetUri;
    state.activeCluster = activeCluster;
    state.targetCluster = targetCluster;
    state.targetUri = targetUri;
    state.options = options;
    state.lastError = null;

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
};

const getMirrorCollection = () => {
    if (!state.enabled || state.connection?.readyState !== 1) {
        return null;
    }

    return state.connection;
};

const scheduleMirrorWrite = (description, operation) => {
    if (!state.enabled) return;

    setImmediate(async () => {
        const connection = getMirrorCollection() || await connectMirror();
        if (!connection || connection.readyState !== 1) return;

        try {
            await operation(connection);
        } catch (error) {
            state.lastError = error.message;
            console.warn(`Database mirror write failed (${description}): ${error.message}`);
        }
    });
};

const upsertDocument = (collectionName, document) => {
    if (!document?._id) return;

    scheduleMirrorWrite(`${collectionName}.replaceOne`, async (connection) => {
        await connection.collection(collectionName).replaceOne(
            { _id: document._id },
            document,
            { upsert: true }
        );
    });
};

const upsertDocuments = (collectionName, documents = []) => {
    const ops = documents
        .filter(doc => doc?._id)
        .map(doc => ({
            replaceOne: {
                filter: { _id: doc._id },
                replacement: doc,
                upsert: true
            }
        }));

    if (ops.length === 0) return;

    scheduleMirrorWrite(`${collectionName}.bulkWrite`, async (connection) => {
        await connection.collection(collectionName).bulkWrite(ops, { ordered: false });
    });
};

const applyUpdate = (collectionName, filter, update, options = {}) => {
    if (!filter || !update) return;
    const method = options.multi ? "updateMany" : "updateOne";

    scheduleMirrorWrite(`${collectionName}.${method}`, async (connection) => {
        await connection.collection(collectionName)[method](filter, update, {
            upsert: !!options.upsert
        });
    });
};

const replaceOne = (collectionName, filter, replacement, options = {}) => {
    if (!filter || !replacement) return;

    scheduleMirrorWrite(`${collectionName}.replaceOne`, async (connection) => {
        await connection.collection(collectionName).replaceOne(filter, replacement, {
            upsert: !!options.upsert
        });
    });
};

const deleteDocuments = (collectionName, filter, options = {}) => {
    if (!filter) return;
    const method = options.multi ? "deleteMany" : "deleteOne";

    scheduleMirrorWrite(`${collectionName}.${method}`, async (connection) => {
        await connection.collection(collectionName)[method](filter);
    });
};

const getMirrorStatus = () => ({
    enabled: state.enabled,
    activeCluster: state.activeCluster,
    targetCluster: state.targetCluster,
    targetConnected: state.connection?.readyState === 1,
    targetReadyState: state.connection?.readyState || 0,
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
