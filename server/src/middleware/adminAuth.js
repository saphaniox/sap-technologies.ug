const {
    authMiddleware,
    adminMiddleware
} = require("./auth");

// Keep a single auth stack across the API so admin endpoints
// behave consistently with /api/account and token/session auth.
const adminAuth = [authMiddleware, adminMiddleware];

module.exports = {
    authMiddleware,
    adminMiddleware,
    adminAuth
};