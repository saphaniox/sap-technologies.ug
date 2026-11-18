const { checkDatabaseHealth, auditDatabaseSecurity } = require("../config/database");

const sendHealth = async (req, res, message) => {
    const dbHealth = await checkDatabaseHealth();
    res.status(200).json({
        status: "success",
        message,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
        security: {
            headers: !!res.get("X-Frame-Options"),
            rateLimiting: true,
            sanitization: true,
            cors: true,
            session: !!req.sessionID
        },
        database: dbHealth,
        version: "2.0.0-secure"
    });
};

exports.getHealth = (req, res) => sendHealth(req, res, "Server is running with enhanced security");
exports.getApiHealth = (req, res) => sendHealth(req, res, "Server is awake");

// Database security audit endpoint (admin only)
exports.getSecurityAudit = (req, res) => {
    const auditReport = auditDatabaseSecurity();
    res.status(200).json({
        status: "success",
        message: "Database security audit completed",
        data: auditReport
    });
};
