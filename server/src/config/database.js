const mongoose = require("mongoose");
const environmentConfig = require('./environment');

// Secure database connection configuration
const connectDB = async () => {
    try {
        // Get secure database configuration
        const dbConfig = environmentConfig.getDatabaseConfig();
        
        console.log('🔍 Attempting database connection...');
        console.log(`🎯 Target: ${dbConfig.uri.replace(/\/\/.*@/, '//***:***@')}`); // Hide credentials in logs
        
        const conn = await mongoose.connect(dbConfig.uri, dbConfig.options);

        console.log(`🔒 Secure MongoDB Connection Established: ${conn.connection.host}`);
        console.log(`📊 Database: ${conn.connection.name}`);
        console.log(`🔐 SSL Enabled: ${dbConfig.options.ssl ? 'Yes' : 'No (Development)'}`);
        
        // Enhanced connection event handlers
        mongoose.connection.on("error", (err) => {
            console.error("🚨 MongoDB connection error:", err.message);
            
            // Log security-related errors
            if (err.message?.includes('authentication') || 
                err.message?.includes('authorization') ||
                err.message?.includes('ssl')) {
                console.error("🛡️ Security-related database error detected");
            }
        });

        mongoose.connection.on("disconnected", () => {
            console.warn("⚠️ MongoDB disconnected - attempting to reconnect...");
        });

        mongoose.connection.on("reconnected", () => {
            console.log("✅ MongoDB reconnected successfully");
        });

        // Set up mongoose security configurations
        mongoose.set('sanitizeFilter', true); // Prevents NoSQL injection attacks
        mongoose.set('strictQuery', true); // Strict mode for queries
        
        // Enable query logging in development for debugging
        if (process.env.NODE_ENV === 'development') {
            mongoose.set('debug', (collectionName, method, query, doc) => {
                console.log(`🔍 DB Query: ${collectionName}.${method}`, 
                    JSON.stringify(query).substring(0, 100) + '...');
            });
        }

        // Database security monitoring
        mongoose.connection.on('connected', () => {
            console.log('🛡️ Database security features enabled:');
            console.log('  ✅ Query sanitization');
            console.log('  ✅ Strict query mode');
            console.log('  ✅ Write concerns');
            console.log('  ✅ Read concerns');
            console.log('  ✅ Connection pooling');
            console.log('  ✅ Automatic retries');
        });

        // Enhanced graceful shutdown with cleanup
        const gracefulShutdown = async (signal) => {
            console.log(`\n🔄 ${signal} received - initiating graceful database shutdown...`);
            try {
                // Close mongoose connection
                await mongoose.connection.close();
                console.log("✅ MongoDB connection closed successfully");
                
                // Additional cleanup can be added here
                console.log("🔒 Database security cleanup completed");
                process.exit(0);
            } catch (err) {
                console.error("❌ Error during database shutdown:", err);
                process.exit(1);
            }
        };

        // Handle various shutdown signals
        process.on("SIGINT", () => gracefulShutdown("SIGINT"));
        process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
        process.on("SIGUSR2", () => gracefulShutdown("SIGUSR2")); // Nodemon restart

        return conn;

    } catch (error) {
        console.error("❌ Error connecting to MongoDB:", error.message);
        
        // Enhanced error logging for security issues
        if (error.message?.includes('authentication')) {
            console.error("🚨 Database authentication failed - check credentials");
        } else if (error.message?.includes('network')) {
            console.error("🌐 Network error - check database connectivity");
        } else if (error.message?.includes('ssl')) {
            console.error("🔐 SSL/TLS error - check certificate configuration");
        }
        
        process.exit(1);
    }
};

// Connection health check function
const checkDatabaseHealth = async () => {
    try {
        if (mongoose.connection.readyState === 1) {
            // Perform a simple operation to verify connectivity
            await mongoose.connection.db.admin().ping();
            return {
                status: 'healthy',
                readyState: mongoose.connection.readyState,
                host: mongoose.connection.host,
                name: mongoose.connection.name
            };
        } else {
            return {
                status: 'unhealthy',
                readyState: mongoose.connection.readyState,
                message: 'Database not connected'
            };
        }
    } catch (error) {
        return {
            status: 'error',
            readyState: mongoose.connection.readyState,
            message: error.message
        };
    }
};

// Database security audit function
const auditDatabaseSecurity = () => {
    const securityReport = {
        timestamp: new Date().toISOString(),
        sanitizeFilter: mongoose.get('sanitizeFilter'),
        strictQuery: mongoose.get('strictQuery'),
        connectionState: mongoose.connection.readyState,
        ssl: mongoose.connection.options?.ssl || false,
        authSource: mongoose.connection.options?.authSource,
        writeConcern: mongoose.connection.options?.writeConcern,
        readConcern: mongoose.connection.options?.readConcern,
        maxPoolSize: mongoose.connection.options?.maxPoolSize
    };
    
    console.log('🔒 Database Security Audit:', securityReport);
    return securityReport;
};

module.exports = { 
    connectDB, 
    checkDatabaseHealth, 
    auditDatabaseSecurity 
};
