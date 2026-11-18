const app = require("./app");
const { securityLogger } = require("./config/security");

// Start server with security monitoring
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    securityLogger.info("Server started with enhanced security", {
        port: PORT,
        environment: process.env.NODE_ENV || "development",
        timestamp: new Date().toISOString()
    });

    console.log(`
🚀 Saptech Uganda Secure Server Started!

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

📝 Frontend URL: ${process.env.FRONTEND_URL || "https://saptechug.com"}

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
