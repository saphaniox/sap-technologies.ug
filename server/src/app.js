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

const environmentConfig = require("./config/environment");
const {
    helmetConfig,
    rateLimits,
    speedLimiter,
    mongoSanitizeConfig,
    hppConfig,
    compressionConfig,
    securityLogger,
    detectSuspiciousActivity
} = require("./config/security");
const { connectDB, checkDatabaseHealth, auditDatabaseSecurity } = require("./config/database");
const { errorHandler } = require("./middleware/errorHandler");
const { trackVisitor } = require("./middleware/visitorTracking");
const apiRoutes = require("./routes");

const app = express();
app.disable("x-powered-by");

// CORS must run before sessions, rate limits, body parsing, and route work so
// browser preflight requests always receive the proper access-control headers.
const corsConfig = environmentConfig.getCORSConfig();
app.use(cors(corsConfig));
app.options(/.*/, cors(corsConfig));

// Initialize database connection once. The same active cluster client is reused
// for sessions so primary/secondary startup failover stays consistent.
console.log("🚀 Initializing SAPTech Uganda Server...");
const databaseReady = connectDB()
    .then((conn) => {
        console.log("✅ Database connected");
        return conn;
    })
    .catch((error) => {
        console.error("❌ Database error:", error.message);
        throw error;
    });

// Trust proxy for rate limiting behind reverse proxies
app.set("trust proxy", 1);

app.use(compression(compressionConfig));
app.use(cookieParser());
app.use(morgan("combined", {
    stream: {
        write: (message) => securityLogger.info(message.trim())
    }
}));

// 4. Helmet for security headers
app.use(helmetConfig);

// 5. Rate limiting (global)
app.use(rateLimits.global);
app.use(speedLimiter);

// 6. Body parsing middleware with size limits
app.use(express.json({ 
    limit: "50mb", // Increased for API requests with metadata
    verify: (req, res, buf) => {
        // Store raw body for signature verification if needed
        req.rawBody = buf;
    }
}));
app.use(express.urlencoded({ 
    extended: true, 
    limit: "50mb", // Increased for form-based requests (including file upload metadata)
    parameterLimit: 100 // Increased parameter limit for complex forms
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
console.log('🔒 Session configuration:', {
    secure: sessionConfig.cookie.secure,
    sameSite: sessionConfig.cookie.sameSite,
    httpOnly: sessionConfig.cookie.httpOnly,
    maxAge: sessionConfig.cookie.maxAge,
    port: process.env.PORT,
    nodeEnv: process.env.NODE_ENV
});

if (process.env.NODE_ENV === 'production') {
    sessionConfig.store = MongoStore.create({
        clientPromise: databaseReady.then((conn) => conn.connection.getClient()),
        collectionName: 'sessions',
        ttl: 30 * 24 * 60 * 60, // 30 days (1 month)
        autoRemove: 'native',
        touchAfter: 3600 // Update session every hour
    });
    console.log('✅ Using MongoDB session store (30-day sessions)');
} else {
    // In development, use MongoDB store too for session persistence
    if (process.env.MONGODB_URI || process.env.MONGODB_SECONDARY_URI || process.env.MONGODB_LOCAL) {
        try {
            sessionConfig.store = MongoStore.create({
                clientPromise: databaseReady.then((conn) => conn.connection.getClient()),
                collectionName: 'dev_sessions',
                ttl: 7 * 24 * 60 * 60, // 7 days in development
                autoRemove: 'native'
            });
            console.log('✅ Using MongoDB session store for development (7-day sessions)');
        } catch (error) {
            console.warn('⚠️ MongoDB session store failed, using memory store:', error.message);
            console.log('⚠️ Using memory session store for development');
        }
    } else {
        console.log('⚠️ Using memory session store for development');
    }
}

const sessionMiddleware = session(sessionConfig);
app.use((req, res, next) => {
    const hasBearerToken = req.headers.authorization?.startsWith("Bearer ");
    const hasAccessTokenCookie = Boolean(req.cookies?.accessToken);
    const canUseStatelessAuth =
        req.path.startsWith("/api/") &&
        (hasBearerToken || hasAccessTokenCookie) &&
        !["/api/login", "/api/signup", "/api/logout"].includes(req.path);

    if (canUseStatelessAuth) {
        req.session = {};
        return next();
    }

    return sessionMiddleware(req, res, next);
});

// Visitor tracking middleware (after CORS and before routes)
app.use(trackVisitor);

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
    const headers = {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": "camera=(), microphone=(), geolocation=(self)"
    };

    if (process.env.NODE_ENV === "production") {
        headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";
    }

    res.set(headers);
    
    next();
});

// Rate limiting for specific endpoints
app.use("/api/auth", rateLimits.auth);
app.use("/api/contact", rateLimits.contact);
app.use("/api/upload", rateLimits.upload);
app.use("/api/admin", rateLimits.admin);
app.use("/api/newsletter", rateLimits.newsletter);
app.use("/api/search", rateLimits.search);
app.use("/api/partnership-requests", rateLimits.partnerRequests);
app.use("/api/products/inquiries", rateLimits.inquiry);
app.use("/api/services/quotes", rateLimits.serviceQuote);

// Static files with security headers - FIX FOR IMAGE LOADING
app.use("/uploads", express.static(path.join(__dirname, "../uploads"), {
    setHeaders: (res, filePath) => {
        // Set appropriate MIME types and security headers for uploads
        // Allow ALL configured origins for image serving
        const origin = res.req.headers.origin;
        const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || ['http://localhost:5174'];
        
        if (origin && allowedOrigins.includes(origin)) {
            res.set("Access-Control-Allow-Origin", origin);
        } else if (allowedOrigins.length > 0) {
            // Fallback to first allowed origin for images
            res.set("Access-Control-Allow-Origin", allowedOrigins[0]);
        }
        
        res.set({
            "X-Content-Type-Options": "nosniff",
            "Cache-Control": "public, max-age=31536000", // 1 year cache for uploaded images
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
        });
        
        // Only allow certain file types to be served
        const ext = filePath.substring(filePath.lastIndexOf(".")).toLowerCase();
        const allowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".pdf", ".svg", ".webp"];
        if (!allowedExtensions.includes(ext)) {
            securityLogger.warn(`Blocked attempt to access disallowed file type: ${ext}`, { path: filePath, ip: res.req.ip });
            res.status(403).end();
            return;
        }
    }
}));

// Serve images from frontend public directory (only in development)
if (process.env.NODE_ENV !== 'production') {
    const frontendImagesPath = path.join(__dirname, "../../frontend/sap-technologies/public/images");
    const frontendPublicPath = path.join(__dirname, "../../frontend/sap-technologies/public");
    
    // Only serve if the paths exist (local development)
    if (fs.existsSync(frontendImagesPath)) {
        app.use("/images", express.static(frontendImagesPath, {
            setHeaders: (res, path) => {
                res.set({
                    "X-Content-Type-Options": "nosniff",
                    "Cache-Control": "public, max-age=86400",
                });
                
                const ext = path.substring(path.lastIndexOf("."));
                const allowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".pdf", ".svg"];
                if (!allowedExtensions.includes(ext.toLowerCase())) {
                    res.status(403);
                    return false;
                }
            }
        }));
    }
    
    if (fs.existsSync(frontendPublicPath)) {
        app.use("/public", express.static(frontendPublicPath, {
            setHeaders: (res) => {
                res.set({
                    "X-Content-Type-Options": "nosniff",
                    "Cache-Control": "public, max-age=86400",
                });
            }
        }));
    }
}

// Rate limiting for newsletter endpoint
app.use("/api/newsletter", rateLimits.contact);

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

// Also make health check available at /api/health for consistency
app.get("/api/health", async (req, res) => {
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
        message: "Server is awake",
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

    // Add Cache-Control headers for public read-only GET endpoints so CDN/browser
    // can cache them and avoid hitting the Render server on every page load.
    if (req.method === "GET") {
        const path = req.path.toLowerCase();
        const isPublicListing =
            path.startsWith("/products") ||
            path.startsWith("/public/") ||
            path.startsWith("/partners") ||
            path.startsWith("/awards") ||
            path.startsWith("/software") ||
            path.startsWith("/iot") ||
            path.startsWith("/certificates");
        const isAuthOrMutable =
            path.startsWith("/account") ||
            path.startsWith("/admin") ||
            path.startsWith("/users") ||
            path.startsWith("/visitor");
        if (isPublicListing && !isAuthOrMutable) {
            res.set("Cache-Control", "public, max-age=300, stale-while-revalidate=60");
        }
    }
    
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
        message: "SAPTech Uganda API - Secure MVC Architecture",
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
                message: "SAPTech Uganda Backend API",
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
            message: "SAPTech Uganda Backend Server",
            environment: "development",
            frontend: "Run 'npm run dev' in frontend/sap-technologies directory",
            api: "http://localhost:5000/api"
        });
    });
}

// Handle placeholder image requests gracefully (return 204 instead of 404)
app.get("/images/placeholder-logo.png", (req, res) => {
    res.status(204).end(); // No content - browser won't show broken image
});

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
🚀 SAPTech Uganda Secure Server Started!

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
