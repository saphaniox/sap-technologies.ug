const mongoose = require("mongoose");
const environmentConfig = require("./environment");
const databaseMirrorPlugin = require("../plugins/databaseMirrorPlugin");
const mirrorService = require("../services/databaseMirrorService");

if (!mongoose.__sapMirrorPluginRegistered) {
    mongoose.plugin(databaseMirrorPlugin);
    mongoose.__sapMirrorPluginRegistered = true;
}

let activeDatabase = {
    cluster: null,
    uri: null,
    host: null,
    name: null
};

const getClusterCandidates = (dbConfig) => ([
    { name: "primary", uri: dbConfig.primaryUri || dbConfig.uri },
    { name: "secondary", uri: dbConfig.secondaryUri }
]).filter(cluster => !!cluster.uri);

const connectToCluster = async (cluster, options) => {
    console.log(`Target cluster (${cluster.name}): ${mirrorService.maskMongoUri(cluster.uri)}`);
    return mongoose.connect(cluster.uri, options);
};

const configureMongoose = () => {
    mongoose.set("sanitizeFilter", true);
    mongoose.set("strictQuery", true);

    if (process.env.NODE_ENV === "development") {
        mongoose.set("debug", (collectionName, method, query) => {
            console.log(
                `DB Query: ${collectionName}.${method}`,
                `${JSON.stringify(query).substring(0, 100)}...`
            );
        });
    }
};

const attachConnectionHandlers = () => {
    if (mongoose.__sapConnectionHandlersAttached) return;
    mongoose.__sapConnectionHandlersAttached = true;

    mongoose.connection.on("error", (err) => {
        console.error("MongoDB connection error:", err.message);

        if (
            err.message?.includes("authentication") ||
            err.message?.includes("authorization") ||
            err.message?.includes("ssl")
        ) {
            console.error("Security-related database error detected");
        }
    });

    mongoose.connection.on("disconnected", () => {
        console.warn("MongoDB disconnected - driver will attempt to reconnect...");
    });

    mongoose.connection.on("reconnected", () => {
        console.log("MongoDB reconnected successfully");
    });

    mongoose.connection.on("connected", () => {
        console.log("Database security features enabled:");
        console.log("  - Query sanitization");
        console.log("  - Strict query mode");
        console.log("  - Majority write concerns");
        console.log("  - Primary read preference");
        console.log("  - Connection pooling");
        console.log("  - Automatic driver retries");
    });
};

const attachShutdownHandlers = () => {
    if (process.__sapDatabaseShutdownHandlersAttached) return;
    process.__sapDatabaseShutdownHandlersAttached = true;

    const gracefulShutdown = async (signal) => {
        console.log(`\n${signal} received - initiating graceful database shutdown...`);

        try {
            await mirrorService.closeMirrorConnection();
            await mongoose.connection.close();
            console.log("MongoDB connection closed successfully");
            console.log("Database cleanup completed");
            process.exit(0);
        } catch (err) {
            console.error("Error during database shutdown:", err);
            process.exit(1);
        }
    };

    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGUSR2", () => gracefulShutdown("SIGUSR2"));
};

const connectDB = async () => {
    try {
        const dbConfig = environmentConfig.getDatabaseConfig();
        const clusters = getClusterCandidates(dbConfig);

        if (clusters.length === 0) {
            throw new Error("No MongoDB URI configured");
        }

        console.log("Attempting database connection with cluster failover...");

        let conn = null;
        let activeCluster = null;
        let lastError = null;

        for (const cluster of clusters) {
            try {
                conn = await connectToCluster(cluster, dbConfig.options);
                activeCluster = cluster;
                break;
            } catch (error) {
                lastError = error;
                console.error(`MongoDB ${cluster.name} connection failed:`, error.message);
            }
        }

        if (!conn || !activeCluster) {
            throw lastError || new Error("Unable to connect to any MongoDB cluster");
        }

        activeDatabase = {
            cluster: activeCluster.name,
            uri: activeCluster.uri,
            host: conn.connection.host,
            name: conn.connection.name
        };

        const mirrorTarget = clusters.find(cluster => cluster.name !== activeCluster.name);
        await mirrorService.initializeMirror({
            activeCluster: activeCluster.name,
            targetCluster: mirrorTarget?.name || null,
            targetUri: mirrorTarget?.uri || null,
            options: dbConfig.options
        });

        configureMongoose();
        attachConnectionHandlers();
        attachShutdownHandlers();

        console.log(`Secure MongoDB connection established on ${activeCluster.name}: ${conn.connection.host}`);
        console.log(`Database: ${conn.connection.name}`);
        console.log(`TLS Enabled: ${dbConfig.options.tls ? "Yes" : "No (Development)"}`);
        console.log(`TLS Certificate Validation: ${dbConfig.options.tlsAllowInvalidCertificates ? "Disabled" : "Enabled"}`);

        return conn;
    } catch (error) {
        console.error("Error connecting to MongoDB:", error.message);

        if (error.message?.includes("authentication")) {
            console.error("Database authentication failed - check credentials");
        } else if (error.message?.includes("network")) {
            console.error("Network error - check database connectivity");
        } else if (error.message?.includes("ssl")) {
            console.error("SSL/TLS error - check certificate configuration");
        }

        process.exit(1);
    }
};

const checkDatabaseHealth = async () => {
    try {
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.db.admin().ping();

            return {
                status: "healthy",
                readyState: mongoose.connection.readyState,
                activeCluster: activeDatabase.cluster,
                host: mongoose.connection.host,
                name: mongoose.connection.name,
                mirror: mirrorService.getMirrorStatus()
            };
        }

        return {
            status: "unhealthy",
            readyState: mongoose.connection.readyState,
            activeCluster: activeDatabase.cluster,
            mirror: mirrorService.getMirrorStatus(),
            message: "Database not connected"
        };
    } catch (error) {
        return {
            status: "error",
            readyState: mongoose.connection.readyState,
            activeCluster: activeDatabase.cluster,
            mirror: mirrorService.getMirrorStatus(),
            message: error.message
        };
    }
};

const auditDatabaseSecurity = () => {
    const securityReport = {
        timestamp: new Date().toISOString(),
        sanitizeFilter: mongoose.get("sanitizeFilter"),
        strictQuery: mongoose.get("strictQuery"),
        connectionState: mongoose.connection.readyState,
        activeCluster: activeDatabase.cluster,
        mirror: mirrorService.getMirrorStatus(),
        tls: mongoose.connection.options?.tls || false,
        tlsAllowInvalidCertificates: mongoose.connection.options?.tlsAllowInvalidCertificates || false,
        authSource: mongoose.connection.options?.authSource,
        writeConcern: mongoose.connection.options?.writeConcern,
        readConcern: mongoose.connection.options?.readConcern,
        maxPoolSize: mongoose.connection.options?.maxPoolSize
    };

    console.log("Database Security Audit:", securityReport);
    return securityReport;
};

module.exports = {
    connectDB,
    checkDatabaseHealth,
    auditDatabaseSecurity,
    getActiveDatabase: () => ({ ...activeDatabase })
};
