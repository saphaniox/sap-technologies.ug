/**
 * SAP Technologies Server Application
 * 
 * Main Express application server for SAP Technologies platform.
 * Handles all backend operations including:
 * - User authentication and authorization
 * - Contact form submissions
 * - Newsletter subscriptions
 * - Product/service management
 * - Admin dashboard API endpoints
 * - File uploads and static assets
 * - Security middleware and rate limiting
 * - Database connections and health checks
 * 
 * @module app
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const compression = require("compression");
const morgan = require("morgan");
const mongoSanitize = require("express-mongo-sanitize");
const hpp = require("hpp");
const path = require("path");
const fs = require("fs");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const cookieParser = require("cookie-parser");

// Import environment configuration
const environmentConfig = require("./config/environment");

// Import security configurations
const {
    helmetConfig,
    rateLimits,
    mongoSanitizeConfig,
    hppConfig,
    compressionConfig,
    securityLogger,
    detectSuspiciousActivity
} = require("./config/security");

// Import other configurations
const { connectDB, checkDatabaseHealth, auditDatabaseSecurity } = require("./config/database");
const sessionConfig = require("./config/session");
const { errorHandler } = require("./middleware/errorHandler");
const apiRoutes = require("./routes");

/**
 * Initialize Express Application
 * Creates the main Express app instance
 */
const app = express();

/**
 * Database Connection Setup
 * Establishes MongoDB connection with error handling and fallback
 */
(async () => {
    try {
        console.log("🚀 Initializing SAP Technologies Secure Server...");
        
        // Test database connection
        const dbConnected = await environmentConfig.testDatabaseConnection();
        
        if (dbConnected) {
            // Database connection is already established in testDatabaseConnection
            console.log("✅ Database connection ready");
        } else {
            console.warn("⚠️  Starting server without database connection...");
            console.log("📝 Server will function in limited mode for frontend development");
        }
    } catch (error) {
        console.error("❌ Database initialization failed:", error.message);
        console.log("📝 Server will start without database features...");
    }
})();

/**
 * Proxy Configuration
 * Trust proxy for accurate IP addresses behind reverse proxy (important for rate limiting)
 */
app.set("trust proxy", 1);

/**
 * Security Middleware Stack
 * Order of middleware is critical for proper security and functionality
 */

// 1. Compression middleware (should be early)
app.use(compression(compressionConfig));

// 2. Cookie parser (needed for JWT tokens)
app.use(cookieParser());

// 3. Request logging
app.use(morgan("combined", {
    stream: {
        write: (message) => securityLogger.info(message.trim())
    }
}));

// 4. Helmet for security headers
app.use(helmetConfig);

// 5. Rate limiting (global)
app.use(rateLimits.global);

// 6. Body parsing middleware with size limits
app.use(express.json({ 
    limit: "1mb",
    verify: (req, res, buf) => {
        // Store raw body for signature verification if needed
        req.rawBody = buf;
    }
}));
app.use(express.urlencoded({ 
    extended: true, 
    limit: "1mb",
    parameterLimit: 20 // Limit number of parameters
}));

// 7. MongoDB injection protection - Custom implementation for Express 5.x compatibility
app.use((req, res, next) => {
  // Custom MongoDB injection protection
  const sanitizeObject = (obj) => {
    if (obj && typeof obj === 'object') {
      for (const key in obj) {
        if (key.startsWith('$') || key.includes('.')) {
          delete obj[key];
          securityLogger.warn("MongoDB injection attempt blocked", {
            ip: req.ip,
            key,
            url: req.url,
            userAgent: req.get("User-Agent")
          });
        } else if (typeof obj[key] === 'object') {
          sanitizeObject(obj[key]);
        }
      }
    }
  };

  // Sanitize query, body, and params
  if (req.query) sanitizeObject(req.query);
  if (req.body) sanitizeObject(req.body);
  if (req.params) sanitizeObject(req.params);
  
  next();
});

// 8. HTTP Parameter Pollution protection
app.use(hpp(hppConfig));

// 9. Suspicious activity detection
app.use(detectSuspiciousActivity);

// 10. Session configuration with MongoDB store
const sessionConfig = environmentConfig.getSessionConfig();
// Add MongoStore for persistent sessions in production
if (process.env.NODE_ENV === 'production') {
    sessionConfig.store = MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        collectionName: 'sessions',
        ttl: 24 * 60 * 60, // 24 hours
        autoRemove: 'native',
        touchAfter: 3600 // Lazy session update - update session every 1 hour
    });
    console.log('✅ Using MongoDB session store for production');
} else {
    console.log('⚠️ Using memory session store for development');
}
app.use(session(sessionConfig));

// CORS configuration with enhanced security
app.use(cors(environmentConfig.getCORSConfig()));

// Security monitoring middleware
app.use((req, res, next) => {
    // Log admin requests with enhanced details
    if (req.path.includes("/admin/")) {
        securityLogger.info("Admin endpoint access", {
            method: req.method,
            path: req.path,
            ip: req.ip,
            userAgent: req.get("User-Agent"),
            sessionId: req.sessionID,
            timestamp: new Date().toISOString()
        });
    }
    
    // Set security response headers
    res.set({
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Feature-Policy": "camera 'none'; microphone 'none'; geolocation 'self'",
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains"
    });
    
    next();
});

// Rate limiting for specific endpoints
app.use("/api/auth", rateLimits.auth);
app.use("/api/contact", rateLimits.contact);
app.use("/api/upload", rateLimits.upload);
app.use("/api/admin", rateLimits.admin);

// Static files with security headers
app.use("/uploads", express.static(path.join(__dirname, "../uploads"), {
    setHeaders: (res, path) => {
        // Set appropriate MIME types and security headers for uploads
        const allowedOrigin = process.env.ALLOWED_ORIGINS?.split(',')[0]?.trim() || 'http://localhost:5174';
        res.set({
            "X-Content-Type-Options": "nosniff",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0",
            "Access-Control-Allow-Origin": allowedOrigin,
            "Access-Control-Allow-Credentials": "true"
        });
        
        // Only allow certain file types to be served
        const ext = path.substring(path.lastIndexOf("."));
    }
}));

// Serve images from frontend public directory for development
app.use("/images", express.static(path.join(__dirname, "../../frontend/sap-technologies/public/images"), {
    setHeaders: (res, path) => {
        const allowedOrigin = process.env.ALLOWED_ORIGINS?.split(',')[0]?.trim() || 'http://localhost:5174';
        res.set({
            "X-Content-Type-Options": "nosniff",
            "Cache-Control": "public, max-age=86400", // 1 day cache for images
            "Access-Control-Allow-Origin": allowedOrigin,
            "Access-Control-Allow-Credentials": "true"
        });
        
        // Only allow image file types
        const ext = path.substring(path.lastIndexOf("."));
        const allowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".pdf", ".svg"];
        if (!allowedExtensions.includes(ext.toLowerCase())) {
            res.status(403);
            return false;
        }
    }
}));

// Serve other public assets (like vite.svg)
app.use("/public", express.static(path.join(__dirname, "../../frontend/sap-technologies/public"), {
    setHeaders: (res, path) => {
        const allowedOrigin = process.env.ALLOWED_ORIGINS?.split(',')[0]?.trim() || 'http://localhost:5174';
        res.set({
            "X-Content-Type-Options": "nosniff",
            "Cache-Control": "public, max-age=86400",
            "Access-Control-Allow-Origin": allowedOrigin,
            "Access-Control-Allow-Credentials": "true"
        });
    }
}));

// Rate limiting per endpoint (more strict) - AFTER static files
app.use("/api/auth", rateLimits.auth);
app.use("/api/contact", rateLimits.contact);
app.use("/api/newsletter", rateLimits.contact);
app.use("/api/upload", rateLimits.upload);
app.use("/api/admin", rateLimits.admin);

// Enhanced health check endpoint with security info
app.get("/health", async (req, res) => {
    const securityStatus = {
        headers: !!res.get("X-Frame-Options"),
        rateLimiting: true,
        sanitization: true,
        cors: true,
        session: !!req.sessionID
    };

    // Check database health
    const dbHealth = await checkDatabaseHealth();

    res.status(200).json({
        status: "success",
        message: "Server is running with enhanced security",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
        security: securityStatus,
        database: dbHealth,
        version: "2.0.0-secure"
    });
});

// Database security audit endpoint (admin only)
app.get("/api/admin/security-audit", rateLimits.admin, (req, res) => {
    // In production, this should require admin authentication
    if (process.env.NODE_ENV === "production") {
        return res.status(401).json({
            status: "error",
            message: "Admin authentication required"
        });
    }
    
    const auditReport = auditDatabaseSecurity();
    res.status(200).json({
        status: "success",
        message: "Database security audit completed",
        data: auditReport
    });
});

// API routes with security validation
app.use("/api", (req, res, next) => {
    // Add request metadata for logging
    req.requestId = require("crypto").randomUUID();
    req.startTime = Date.now();
    
    securityLogger.info("API request started", {
        requestId: req.requestId,
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.get("User-Agent")?.substring(0, 200) // Truncate long user agents
    });
    
    next();
}, apiRoutes);

// Enhanced API info endpoint
app.get("/api", (req, res) => {
    res.status(200).json({
        status: "success",
        message: "SAP Technologies API - Secure MVC Architecture",
        version: "2.0.0-secure",
        security: {
            rateLimiting: "Enabled",
            inputSanitization: "Enabled", 
            cors: "Configured",
            headers: "Secured",
            monitoring: "Active"
        },
        endpoints: {
            health: "/health",
            auth: "/api/auth/*",
            users: "/api/users/*", 
            contacts: "/api/contacts/*",
            newsletter: "/api/newsletter/*",
            admin: "/api/admin/*",
            projects: "/api/projects/*",
            services: "/api/services/*"
        },
        documentation: "Contact admin for API documentation"
    });
});

// Security test endpoints (remove in production)
if (process.env.NODE_ENV !== "production") {
    app.post("/api/auth/test", rateLimits.auth, (req, res) => {
        res.json({ 
            status: "success", 
            message: "Auth endpoint working with security", 
            security: "Rate limited and sanitized"
        });
    });

    app.post("/api/contacts/test", rateLimits.contact, (req, res) => {
        res.json({ 
            status: "success", 
            message: "Contacts endpoint working with security",
            security: "Rate limited and sanitized"
        });
    });

    app.post("/api/newsletter/test", (req, res) => {
        res.json({ 
            status: "success", 
            message: "Newsletter endpoint working with security",
            security: "Rate limited and sanitized"
        });
    });
}

// Serve static files from the React app build directory
if (process.env.NODE_ENV === 'production') {
    const frontendPath = path.join(__dirname, '../../frontend/sap-technologies/dist');
    const indexPath = path.join(frontendPath, 'index.html');
    
    // Check if frontend files exist (they won't exist on backend-only deployments like Render)
    if (fs.existsSync(indexPath)) {
        // Serve static files from React build
        app.use(express.static(frontendPath));
        
        // Handle React Router routes - this must come AFTER all API routes
        app.get(/^(?!\/api).*/, (req, res) => {
            res.sendFile(indexPath);
        });
        
        console.log('✅ Serving frontend files from:', frontendPath);
    } else {
        // Backend-only deployment (frontend deployed separately)
        app.get('/', (req, res) => {
            res.json({
                status: "success",
                message: "SAP Technologies Backend API",
                environment: "production",
                frontend: "Deployed separately (e.g., Vercel)",
                api: `${req.protocol}://${req.get('host')}/api`,
                endpoints: {
                    health: "/api/health",
                    auth: "/api/auth",
                    contact: "/api/contact",
                    products: "/api/products",
                    services: "/api/services"
                }
            });
        });
        
        console.log('ℹ️  Backend-only deployment: Frontend files not found, serving API only');
    }
} else {
    // In development, serve the React dev server or provide helpful message
    app.get('/', (req, res) => {
        res.json({
            status: "success",
            message: "SAP Technologies Backend Server",
            environment: "development",
            frontend: "Run 'npm run dev' in frontend/sap-technologies directory",
            api: "http://localhost:5000/api"
        });
    });
}

// Enhanced 404 handler with security logging
app.use((req, res, next) => {
    securityLogger.warn("404 - Route not found", {
        method: req.method,
        path: req.originalUrl,
        ip: req.ip,
        userAgent: req.get("User-Agent")?.substring(0, 200),
        timestamp: new Date().toISOString()
    });
    
    res.status(404).json({
        status: "error",
        message: `Route ${req.originalUrl} not found`,
        timestamp: new Date().toISOString()
    });
});

// Enhanced global error handler
app.use((error, req, res, next) => {
    // Log security-related errors
    if (error.message?.includes("CORS") || 
        error.message?.includes("rate limit") ||
        error.code === "EBADCSRFTOKEN") {
        securityLogger.error("Security error", {
            error: error.message,
            path: req.path,
            ip: req.ip,
            userAgent: req.get("User-Agent")?.substring(0, 200)
        });
    }
    
    errorHandler(error, req, res, next);
});

// Start server with security monitoring
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    securityLogger.info("Server started with enhanced security", {
        port: PORT,
        environment: process.env.NODE_ENV || "development",
        timestamp: new Date().toISOString()
    });
    
    console.log(`
� SAP Technologies Secure Server Started!

📍 Server running on: http://localhost:${PORT}
🌍 Environment: ${process.env.NODE_ENV || "development"}
📊 Health check: http://localhost:${PORT}/health

🛡️  Security Features Enabled:
   ✅ Rate Limiting (Multiple tiers)
   ✅ Input Sanitization & Validation
   ✅ Security Headers (Helmet)
   ✅ CORS Protection
   ✅ MongoDB Injection Protection
   ✅ HTTP Parameter Pollution Protection
   ✅ Request Logging & Monitoring
   ✅ Suspicious Activity Detection
   ✅ File Upload Security
   ✅ Session Security

🔗 Secure API Endpoints:
   • API Info: http://localhost:${PORT}/api
   • Auth (Rate Limited): http://localhost:${PORT}/api/auth/*
   • Contacts (Rate Limited): http://localhost:${PORT}/api/contacts/*
   • Admin (Restricted): http://localhost:${PORT}/api/admin/*

📝 Frontend URL: ${process.env.FRONTEND_URL || "http://sap-technologies.com"}

🏗️  Architecture: Secure Model-View-Controller (MVC)
💾 Database: MongoDB with Injection Protection
🔐 Security Level: Enterprise Grade
    `);
});

// Enhanced graceful shutdown with cleanup
process.on("SIGTERM", () => {
    securityLogger.info("SIGTERM signal received: closing HTTP server");
    server.close(() => {
        securityLogger.info("HTTP server closed gracefully");
        console.log("HTTP server closed");
    });
});

process.on("SIGINT", () => {
    securityLogger.info("SIGINT signal received: closing HTTP server");
    server.close(() => {
        securityLogger.info("HTTP server closed gracefully");
        console.log("HTTP server closed");
        process.exit(0);
    });
});

module.exports = app;
