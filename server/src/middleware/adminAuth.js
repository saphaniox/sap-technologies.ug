const { User } = require("../models");
const { AppError } = require("./errorHandler");

// Middleware to check if user is authenticated
const authMiddleware = async (req, res, next) => {
    try {
        console.log("=== AUTH MIDDLEWARE DEBUG ===");
        console.log("Session ID:", req.sessionID);
        console.log("Session userId:", req.session.userId);
        console.log("Session data:", JSON.stringify(req.session, null, 2));
        console.log("Cookies:", req.headers.cookie);
        console.log("Origin:", req.headers.origin);
        
        if (!req.session.userId) {
            console.log("❌ No session userId found - User needs to log in");
            return res.status(401).json({
                status: "error",
                message: "Authentication required. Please log in.",
                needsLogin: true
            });
        }

        const user = await User.findById(req.session.userId);
        console.log("User found:", user ? `${user.name} (${user.role})` : "null");
        
        if (!user || !user.isActive) {
            console.log("❌ User not found or inactive");
            req.session.destroy(); // Clear invalid session
            return res.status(401).json({
                status: "error",
                message: "User not found or inactive. Please log in again.",
                needsLogin: true
            });
        }

        req.user = user;
        console.log("✅ Authentication successful");
        next();
    } catch (error) {
        console.log("❌ Authentication error:", error.message);
        return res.status(401).json({
            status: "error",
            message: "Authentication failed. Please log in.",
            needsLogin: true
        });
    }
};

// Middleware to check if user is admin
const adminMiddleware = async (req, res, next) => {
    try {
        console.log("=== ADMIN MIDDLEWARE DEBUG ===");
        console.log("User exists:", !!req.user);
        console.log("User role:", req.user?.role);
        
        if (!req.user) {
            console.log("❌ No user found in request");
            return next(new AppError("Authentication required", 401));
        }

        if (req.user.role !== "admin") {
            console.log("❌ User is not admin, role:", req.user.role);
            return next(new AppError("Admin access required", 403));
        }

        console.log("✅ Admin access granted");
        next();
    } catch (error) {
        console.log("❌ Authorization error:", error.message);
        next(new AppError("Authorization failed", 403));
    }
};

// Combined middleware for admin routes
const adminAuth = [authMiddleware, adminMiddleware];

module.exports = {
    authMiddleware,
    adminMiddleware,
    adminAuth
};