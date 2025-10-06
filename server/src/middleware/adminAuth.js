const { User } = require("../models");
const { AppError } = require("./errorHandler");

// Middleware to check if user is authenticated
const authMiddleware = async (req, res, next) => {
    try {
        console.log("=== AUTH MIDDLEWARE DEBUG ===");
        console.log("Session ID:", req.sessionID);
        console.log("Session userId:", req.session.userId);
        console.log("Session data:", JSON.stringify(req.session, null, 2));
        
        if (!req.session.userId) {
            console.log("❌ No session userId found");
            return next(new AppError("Authentication required", 401));
        }

        const user = await User.findById(req.session.userId);
        console.log("User found:", user ? `${user.name} (${user.role})` : "null");
        
        if (!user || !user.isActive) {
            console.log("❌ User not found or inactive");
            return next(new AppError("User not found or inactive", 401));
        }

        req.user = user;
        console.log("✅ Authentication successful");
        next();
    } catch (error) {
        console.log("❌ Authentication error:", error.message);
        next(new AppError("Authentication failed", 401));
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