const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * Secure Environment Configuration Manager
 * Handles secure loading and validation of environment variables
 */
class EnvironmentConfig {
    constructor() {
        this.requiredVars = [
            'NODE_ENV',
            'PORT',
            'SESSION_SECRET',
            'MONGODB_URI'
        ];
        
        this.optionalVars = [
            'MONGODB_LOCAL',
            'JWT_SECRET',
            'GMAIL_USER',
            'GMAIL_PASS',
            'TWILIO_SID',
            'TWILIO_AUTH',
            'CLIENT_URL'
        ];

        this.validateEnvironment();
    }

    /**
     * Validate all required environment variables
     */
    validateEnvironment() {
        const missing = [];
        const weak = [];

        // Check required variables
        for (const varName of this.requiredVars) {
            const value = process.env[varName];
            if (!value) {
                missing.push(varName);
            } else if (this.isWeakSecret(varName, value)) {
                weak.push(varName);
            }
        }

        // Report missing variables
        if (missing.length > 0) {
            console.error('❌ Missing required environment variables:');
            missing.forEach(varName => {
                console.error(`   - ${varName}`);
            });
            console.error('\n📝 Copy .env.example to .env and configure your variables');
            
            // Don't exit in development for database-less testing
            if (process.env.NODE_ENV === 'production') {
                process.exit(1);
            }
        }

        // Report weak secrets
        if (weak.length > 0) {
            console.warn('⚠️  Weak security configuration detected:');
            weak.forEach(varName => {
                console.warn(`   - ${varName}: Please use a stronger secret`);
            });
        }

        // Log validation status
        if (missing.length === 0 && weak.length === 0) {
            console.log('✅ Environment configuration validated successfully');
        }
    }

    /**
     * Check if a secret is weak or default
     */
    isWeakSecret(varName, value) {
        const weakPatterns = [
            'your_',
            'default',
            'example',
            'test',
            'demo',
            '123456',
            'password'
        ];

        // Check for weak patterns
        const isWeak = weakPatterns.some(pattern => 
            value.toLowerCase().includes(pattern)
        );

        // Check length for secrets
        if (varName.includes('SECRET') && value.length < 32) {
            return true;
        }

        return isWeak;
    }

    /**
     * Generate secure random secret
     */
    static generateSecret(length = 32) {
        return crypto.randomBytes(length).toString('hex');
    }

    /**
     * Get database configuration with fallback
     */
    getDatabaseConfig() {
        const config = {
            uri: process.env.MONGODB_URI || process.env.MONGODB_LOCAL,
            options: {
                // Security options
                ssl: process.env.DB_SSL_VALIDATE !== 'false',
                authSource: process.env.DB_AUTH_SOURCE || 'admin',
                readPreference: process.env.DB_READ_PREFERENCE || 'primary',
                
                // Connection options
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
                family: 4, // Use IPv4, skip trying IPv6
                
                // Security and reliability
                retryWrites: true,
                w: 'majority'
            }
        };

        // Add authentication if credentials are provided
        if (process.env.DB_USERNAME && process.env.DB_PASSWORD) {
            config.options.auth = {
                username: process.env.DB_USERNAME,
                password: process.env.DB_PASSWORD
            };
        }

        return config;
    }

    /**
     * Get JWT configuration
     */
    getJWTConfig() {
        return {
            secret: process.env.JWT_SECRET || this.generateFallbackSecret('JWT'),
            expiresIn: process.env.JWT_EXPIRES_IN || '24h',
            cookieExpiresIn: parseInt(process.env.JWT_COOKIE_EXPIRES_IN) || 1,
            issuer: 'sap-technologies',
            audience: 'sap-technologies-api'
        };
    }

    /**
     * Get session configuration
     */
    getSessionConfig() {
        // Check if running on localhost regardless of NODE_ENV
        const isLocalhost = process.env.PORT && (
            process.env.PORT === '5000' || 
            process.env.PORT === '3000'
        );
        
        return {
            secret: process.env.SESSION_SECRET || this.generateFallbackSecret('SESSION'),
            resave: false,
            saveUninitialized: false,
            cookie: {
                // Only require secure cookies in production AND not on localhost
                secure: process.env.NODE_ENV === 'production' && !isLocalhost,
                httpOnly: true,
                maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days (1 month)
                // Use 'lax' for localhost, 'none' for production (requires secure)
                sameSite: (process.env.NODE_ENV === 'production' && !isLocalhost) ? 'none' : 'lax'
            },
            name: 'sap.sid'
        };
    }

    /**
     * Get CORS configuration
     */
    getCORSConfig() {
        const allowedOrigins = process.env.ALLOWED_ORIGINS 
            ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
            : ['http://localhost:5174'];

        console.log('🔗 CORS Allowed Origins:', allowedOrigins);

        return {
            origin: (origin, callback) => {
                console.log('🔍 CORS Origin Check:', origin);
                
                // Allow requests with no origin (like mobile apps or curl requests)
                if (!origin) {
                    console.log('✅ CORS: Allowing request with no origin');
                    return callback(null, true);
                }
                
                // Check if origin is in allowed list
                if (allowedOrigins.includes(origin)) {
                    console.log('✅ CORS: Origin allowed:', origin);
                    return callback(null, true);
                }
                
                // Allow Vercel preview deployments (e.g., sap-technologies-uganda-*.vercel.app)
                if (origin.includes('sap-technologies-uganda') && origin.includes('.vercel.app')) {
                    console.log('✅ CORS: Vercel preview deployment allowed:', origin);
                    return callback(null, true);
                }
                
                // Reject all other origins
                console.log('❌ CORS: Origin rejected:', origin);
                console.log('📝 CORS: Allowed origins:', allowedOrigins);
                return callback(new Error(`CORS: Origin ${origin} not allowed`), false);
            },
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'X-Session-ID', 'X-Fingerprint'],
            exposedHeaders: ['X-Total-Count'],
            preflightContinue: false,
            optionsSuccessStatus: 204
        };
    }

    /**
     * Get email configuration
     */
    getEmailConfig() {
        return {
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_PASS
            },
            from: {
                name: process.env.EMAIL_FROM_NAME || 'SAP Technologies',
                address: process.env.GMAIL_USER
            },
            replyTo: process.env.EMAIL_REPLY_TO || process.env.GMAIL_USER
        };
    }

    /**
     * Get rate limiting configuration
     */
    getRateLimitConfig() {
        return {
            windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) * 60 * 1000 || 15 * 60 * 1000,
            max: parseInt(process.env.RATE_LIMIT_MAX) || 1000,
            auth: {
                windowMs: 15 * 60 * 1000,
                max: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 5
            },
            contact: {
                windowMs: 60 * 60 * 1000,
                max: parseInt(process.env.CONTACT_RATE_LIMIT_MAX) || 3
            }
        };
    }

    /**
     * Generate fallback secret for development
     */
    generateFallbackSecret(type) {
        console.warn(`⚠️  Using generated ${type} secret. Set ${type}_SECRET in production!`);
        return crypto.randomBytes(32).toString('hex');
    }

    /**
     * Test database connectivity
     */
    async testDatabaseConnection() {
        const mongoose = require('mongoose');
        const config = this.getDatabaseConfig();
        
        try {
            console.log('🔍 Testing database connection...');
            console.log('🎯 Connecting to MongoDB Atlas...');
            
            // Try primary connection with longer timeout for Atlas
            await mongoose.connect(config.uri, {
                ...config.options,
                serverSelectionTimeoutMS: 5000 // Quick timeout for testing
            });
            
            console.log('✅ MongoDB Atlas connection successful');
            return true;
            
        } catch (error) {
            console.error('❌ MongoDB Atlas connection failed:', error.message);
            
            // Provide helpful error messages for Atlas connection issues
            if (error.message.includes('IP') || error.message.includes('whitelist')) {
                console.log('\n� IP Whitelist Issue:');
                console.log('📍 Your current IP (41.75.172.212) needs to be added to MongoDB Atlas');
                console.log('🔧 Steps to fix:');
                console.log('   1. Go to MongoDB Atlas → Network Access');
                console.log('   2. Add IP: 41.75.172.212');
                console.log('   3. Or add 0.0.0.0/0 for development');
            }
            
            this.provideDatabaseTroubleshooting(error);
            return false;
        }
    }

    /**
     * Provide database troubleshooting guidance
     */
    provideDatabaseTroubleshooting(error) {
        console.log('\n🚨 Database Connection Troubleshooting:');
        
        if (error.message.includes('IP')) {
            console.log('📍 IP Whitelist Issue:');
            console.log('   1. Go to MongoDB Atlas → Network Access');
            console.log('   2. Add your current IP address to the whitelist');
            console.log('   3. Or add 0.0.0.0/0 for development (not recommended for production)');
        }
        
        if (error.message.includes('authentication')) {
            console.log('🔐 Authentication Issue:');
            console.log('   1. Check your username and password in MONGODB_URI');
            console.log('   2. Ensure the user has proper permissions');
            console.log('   3. Try creating a new database user');
        }
        
        if (error.message.includes('timeout')) {
            console.log('⏱️  Connection Timeout:');
            console.log('   1. Check your internet connection');
            console.log('   2. Verify the cluster is running');
            console.log('   3. Try connecting from MongoDB Compass');
        }
        
        console.log('\n💡 Solutions:');
        console.log('   • Use local MongoDB for development: npm install -g mongodb');
        console.log('   • Update .env with correct MONGODB_URI');
        console.log('   • Check MongoDB Atlas dashboard for cluster status');
        console.log('   • Contact support if issues persist\n');
    }

    /**
     * Get security monitoring configuration
     */
    getSecurityConfig() {
        return {
            enableMetrics: process.env.ENABLE_METRICS === 'true',
            logLevel: process.env.LOG_LEVEL || 'info',
            maxRequestSize: process.env.MAX_REQUEST_SIZE || '1mb',
            maxParameters: parseInt(process.env.MAX_PARAMETERS) || 20,
            adminTimeout: parseInt(process.env.ADMIN_SESSION_TIMEOUT) || 30,
            maxLoginAttempts: parseInt(process.env.ADMIN_MAX_LOGIN_ATTEMPTS) || 3
        };
    }
}

module.exports = new EnvironmentConfig();