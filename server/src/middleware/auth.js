const jwt = require('jsonwebtoken');
const { User } = require("../models");
const { logger } = require('../config/security');

// Enhanced authentication middleware with JWT and session support
const authMiddleware = async (req, res, next) => {
    try {
        let token = null;
        let userId = null;

        // Try to get token from cookies first (more secure)
        if (req.cookies.accessToken) {
            token = req.cookies.accessToken;
        }
        // Fallback to Authorization header
        else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.substring(7);
        }

        // If we have a token, verify it
        if (token) {
            try {
                const decoded = jwt.verify(
                    token, 
                    process.env.JWT_SECRET || 'fallback-secret-key-change-in-production'
                );
                
                if (decoded.type === 'access') {
                    userId = decoded.userId;
                }
            } catch (jwtError) {
                // Token invalid, try refresh token or fall back to session
                logger.warn('Invalid access token', { 
                    error: jwtError.message, 
                    ip: req.ip,
                    path: req.path 
                });
            }
        }

        // Fallback to session if no valid token
        if (!userId && req.session.userId) {
            userId = req.session.userId;
        }

        // If still no user ID, authentication failed
        if (!userId) {
            return res.status(401).json({
                status: "error",
                message: "Authentication required",
                code: 'AUTH_REQUIRED'
            });
        }

        // Get user from database
        const user = await User.findById(userId).select("-password");
        if (!user || !user.isActive) {
            // Clear invalid session
            if (req.session.userId) {
                req.session.destroy();
            }
            
            logger.warn('Authentication failed - user not found or inactive', {
                userId,
                ip: req.ip,
                path: req.path
            });
            
            return res.status(401).json({
                status: "error",
                message: "User not found or inactive",
                code: 'USER_INACTIVE'
            });
        }

        // Check if account is locked
        if (user.accountLocked && user.accountLockedUntil > new Date()) {
            logger.warn('Authentication failed - account locked', {
                userId: user._id,
                ip: req.ip,
                path: req.path
            });
            
            return res.status(423).json({
                status: "error",
                message: "Account is locked",
                code: 'ACCOUNT_LOCKED'
            });
        }

        // Update last activity
        user.lastActivity = new Date();
        await user.save();

        // Attach user to request
        req.user = user;
        req.userId = user._id;
        
        next();
    } catch (error) {
        logger.error('Authentication middleware error', { 
            error: error?.message || error || 'Unknown error', 
            ip: req.ip,
            path: req.path 
        });
        
        return res.status(500).json({
            status: "error",
            message: "Authentication error",
            code: 'AUTH_ERROR'
        });
    }
};

// Enhanced admin middleware with security logging
const adminMiddleware = (req, res, next) => {
    if (!req.user) {
        logger.warn('Admin access attempt without authentication', {
            ip: req.ip,
            path: req.path,
            userAgent: req.get('User-Agent')
        });
        
        return res.status(401).json({
            status: "error",
            message: "Authentication required",
            code: 'AUTH_REQUIRED'
        });
    }

    if (req.user.role !== "admin") {
        logger.warn('Admin access attempt by non-admin user', {
            userId: req.user._id,
            email: req.user.email,
            role: req.user.role,
            ip: req.ip,
            path: req.path,
            userAgent: req.get('User-Agent')
        });
        
        return res.status(403).json({
            status: "error",
            message: "Admin access required",
            code: 'ADMIN_REQUIRED'
        });
    }

    // Log successful admin access
    logger.info('Admin access granted', {
        userId: req.user._id,
        email: req.user.email,
        ip: req.ip,
        path: req.path,
        method: req.method
    });

    next();
};

// Enhanced optional auth middleware with JWT support
const optionalAuthMiddleware = async (req, res, next) => {
    try {
        let token = null;
        let userId = null;

        // Try to get token from cookies first
        if (req.cookies.accessToken) {
            token = req.cookies.accessToken;
        }
        // Fallback to Authorization header
        else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.substring(7);
        }

        // If we have a token, verify it
        if (token) {
            try {
                const decoded = jwt.verify(
                    token, 
                    process.env.JWT_SECRET || 'fallback-secret-key-change-in-production'
                );
                
                if (decoded.type === 'access') {
                    userId = decoded.userId;
                }
            } catch (jwtError) {
                // Token invalid, ignore and continue
            }
        }

        // Fallback to session if no valid token
        if (!userId && req.session.userId) {
            userId = req.session.userId;
        }

        // If we have a user ID, get the user
        if (userId) {
            const user = await User.findById(userId).select("-password");
            if (user && user.isActive) {
                req.user = user;
                req.userId = user._id;
            }
        }
        
        next();
    } catch (error) {
        // Don't fail if there's an error, just continue without user
        logger.debug('Optional auth middleware error (continuing)', { 
            error: error.message,
            path: req.path 
        });
        next();
    }
};

module.exports = {
    authMiddleware,
    adminMiddleware,
    optionalAuthMiddleware
};
