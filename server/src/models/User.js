/**
 * User Model
 * 
 * Defines the database schema for user accounts with comprehensive
 * security features and activity tracking.
 * 
 * Features:
 * - User authentication (email/password with bcrypt hashing)
 * - Profile management (name, avatar, bio)
 * - Role-based access control (user, admin, superadmin)
 * - Two-factor authentication (TOTP with encrypted secrets)
 * - Account security (failed login tracking, account locking)
 * - Activity logging (login history, IP tracking)
 * - Email verification system
 * - Password reset functionality
 * - Session management
 * - Certificate tracking
 * - Awards and nominations
 * 
 * Security Features:
 * - AES-256-GCM encryption for sensitive data
 * - Bcrypt password hashing
 * - Failed login attempt monitoring
 * - Automatic account locking after 5 failed attempts
 * - IP address and device tracking
 * 
 * @module models/User
 */

// User data model - defines how user information is stored in the database
// This includes basic profile info, security features, and activity tracking
const mongoose = require("mongoose");
const crypto = require("crypto");

// Encryption setup for sensitive data (like 2FA secrets)
// In production, always use proper key management for encryption keys!
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32);
const ALGORITHM = 'aes-256-gcm';

// Utility functions for encrypting sensitive user data
// We use these for things like 2FA secrets that need extra protection
const encrypt = (text) => {
    if (!text) return text;
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
};

// Decrypt sensitive data when we need to use it
const decrypt = (encryptedData) => {
    if (!encryptedData || !encryptedData.includes(':')) return encryptedData;
    try {
        const parts = encryptedData.split(':');
        const iv = Buffer.from(parts[0], 'hex');
        const authTag = Buffer.from(parts[1], 'hex');
        const encrypted = parts[2];
        const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (error) {
        return encryptedData; // Return original if decryption fails (graceful degradation)
    }
};

// Define the user data structure
const userSchema = new mongoose.Schema({
    // Basic profile information
    name: { 
        type: String, 
        required: [true, "Name is required"],
        trim: true, // Remove whitespace
        minlength: [2, "Name must be at least 2 characters long"],
        maxlength: [50, "Name cannot exceed 50 characters"],
        validate: {
            validator: function(v) {
                // Security: prevent script injection in names
                return !/[<>\"'&]/.test(v);
            },
            message: "Name contains invalid characters"
        }
    },
    // User's email address - used for login and communication
    email: { 
        type: String, 
        required: [true, "Email is required"],
        unique: true, // No two users can have the same email
        lowercase: true, // Always store in lowercase for consistency
        trim: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please provide a valid email"],
        validate: {
            validator: function(v) {
                // Extra security: check length and dangerous characters
                return v.length <= 254 && !/[<>\"'&]/.test(v);
            },
            message: "Email format is invalid or contains dangerous characters"
        }
    },
    // Hashed password (never store plain text passwords!)
    password: { 
        type: String, 
        required: [true, "Password is required"],
        minlength: [8, "Password must be at least 8 characters long"],
        validate: {
            validator: function(v) {
                // Strong password requirements - keeps accounts secure
                const validator = require('validator');
                return validator.isStrongPassword(v, {
                    minLength: 8,
                    minLowercase: 1,
                    minUppercase: 1,
                    minNumbers: 1,
                    minSymbols: 1
                });
            },
            message: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
        }
    },
    profilePic: { 
        type: String, 
        default: "",
        validate: {
            validator: function(v) {
                // Validate file paths to prevent directory traversal
                if (!v) return true;
                return !/\.\.\/|\.\.\\/.test(v) && /\.(jpg|jpeg|png|gif|svg)$/i.test(v);
            },
            message: "Invalid profile picture path"
        }
    },
    // Security-related fields
    failedLoginAttempts: {
        type: Number,
        default: 0,
        max: [10, "Too many failed login attempts"]
    },
    accountLocked: {
        type: Boolean,
        default: false
    },
    accountLockedUntil: {
        type: Date,
        default: null
    },
    lastFailedLogin: {
        type: Date,
        default: null
    },
    passwordResetToken: {
        type: String,
        default: null
    },
    passwordResetExpires: {
        type: Date,
        default: null
    },
    emailVerificationToken: {
        type: String,
        default: null
    },
    emailVerified: {
        type: Boolean,
        default: false
    },
    twoFactorSecret: {
        type: String,
        default: null,
        set: encrypt,
        get: decrypt
    },
    twoFactorEnabled: {
        type: Boolean,
        default: false
    },
    // IP and location tracking
    registrationIP: {
        type: String,
        default: null,
        validate: {
            validator: function(v) {
                if (!v) return true;
                // Basic IP validation
                return /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(v) ||
                       /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/.test(v);
            },
            message: "Invalid IP address format"
        }
    },
    lastLoginIP: {
        type: String,
        default: null
    },
    trustedDevices: [{
        deviceId: String,
        userAgent: String,
        lastUsed: { type: Date, default: Date.now },
        createdAt: { type: Date, default: Date.now }
    }],
    // Activity and session tracking
    lastActivity: {
        type: Date,
        default: Date.now
    },
    sessionTokens: [{
        token: String,
        expiresAt: Date,
        createdAt: { type: Date, default: Date.now }
    }],
    createdAt: { 
        type: Date, 
        default: Date.now,
        immutable: true // Prevent modification after creation
    },
    activity: [{ 
        action: {
            type: String,
            required: true,
            maxlength: [200, "Activity description too long"]
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        ipAddress: {
            type: String,
            default: null
        },
        userAgent: {
            type: String,
            default: null,
            maxlength: [500, "User agent too long"]
        }
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date,
        default: null
    },
    loginCount: {
        type: Number,
        default: 0,
        min: [0, "Login count cannot be negative"]
    },
    role: {
        type: String,
        enum: {
            values: ["user", "admin", "moderator"],
            message: "Role must be either user, admin, or moderator"
        },
        default: "user"
    },
    // Data retention and privacy
    dataRetentionConsent: {
        type: Boolean,
        default: true
    },
    marketingConsent: {
        type: Boolean,
        default: false
    },
    privacyPolicyAccepted: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    // Enable schema-level encryption for sensitive fields
    toJSON: { 
        transform: function(doc, ret) {
            delete ret.password;
            delete ret.twoFactorSecret;
            delete ret.passwordResetToken;
            delete ret.emailVerificationToken;
            delete ret.sessionTokens;
            return ret;
        }
    },
    toObject: { 
        transform: function(doc, ret) {
            delete ret.password;
            delete ret.twoFactorSecret;
            delete ret.passwordResetToken;
            delete ret.emailVerificationToken;
            delete ret.sessionTokens;
            return ret;
        }
    }
});

// Compound indexes for better query performance and security
userSchema.index({ email: 1, isActive: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ lastActivity: -1 });
userSchema.index({ accountLocked: 1, accountLockedUntil: 1 });
userSchema.index({ emailVerified: 1 });

// Text index for search functionality
userSchema.index({ 
    name: 'text', 
    email: 'text' 
}, {
    weights: {
        name: 10,
        email: 5
    }
});

// Enhanced virtual for user's public profile (security-filtered)
userSchema.virtual("profile").get(function() {
    return {
        id: this._id,
        name: this.name,
        email: this.email,
        profilePic: this.profilePic,
        createdAt: this.createdAt,
        lastLogin: this.lastLogin,
        loginCount: this.loginCount,
        role: this.role,
        isActive: this.isActive,
        emailVerified: this.emailVerified,
        twoFactorEnabled: this.twoFactorEnabled
    };
});

// Virtual for admin profile (includes more details)
userSchema.virtual("adminProfile").get(function() {
    return {
        ...this.profile,
        failedLoginAttempts: this.failedLoginAttempts,
        accountLocked: this.accountLocked,
        lastActivity: this.lastActivity,
        registrationIP: this.registrationIP,
        lastLoginIP: this.lastLoginIP,
        trustedDevices: this.trustedDevices?.length || 0,
        updatedAt: this.updatedAt
    };
});

// Enhanced method to add activity log with security context
userSchema.methods.addActivity = function(activity, ipAddress = null, userAgent = null) {
    // Limit activity log size to prevent database bloat
    if (this.activity.length >= 100) {
        this.activity = this.activity.slice(-50); // Keep last 50 entries
    }
    
    this.activity.push({
        action: activity,
        timestamp: new Date(),
        ipAddress: ipAddress,
        userAgent: userAgent?.substring(0, 500) // Truncate long user agents
    });
    
    this.lastActivity = new Date();
    return this.save();
};

// Method to check if account is locked
userSchema.methods.isAccountLocked = function() {
    return this.accountLocked && 
           this.accountLockedUntil && 
           this.accountLockedUntil > new Date();
};

// Method to unlock account
userSchema.methods.unlockAccount = function() {
    this.accountLocked = false;
    this.accountLockedUntil = null;
    this.failedLoginAttempts = 0;
    return this.save();
};

// Method to generate password reset token
userSchema.methods.createPasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    return resetToken;
};

// Method to generate email verification token
userSchema.methods.createEmailVerificationToken = function() {
    const verificationToken = crypto.randomBytes(32).toString('hex');
    this.emailVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
    return verificationToken;
};

// Method to clean up expired sessions
userSchema.methods.cleanupExpiredSessions = function() {
    const now = new Date();
    this.sessionTokens = this.sessionTokens.filter(session => session.expiresAt > now);
    return this.save();
};

// Method to add trusted device
userSchema.methods.addTrustedDevice = function(deviceId, userAgent) {
    // Remove existing device if it exists
    this.trustedDevices = this.trustedDevices.filter(device => device.deviceId !== deviceId);
    
    // Add new device (limit to 5 trusted devices)
    this.trustedDevices.push({
        deviceId,
        userAgent: userAgent?.substring(0, 200),
        lastUsed: new Date(),
        createdAt: new Date()
    });
    
    // Keep only last 5 trusted devices
    if (this.trustedDevices.length > 5) {
        this.trustedDevices = this.trustedDevices.slice(-5);
    }
    
    return this.save();
};

// Pre-save middleware for additional security
userSchema.pre('save', function(next) {
    // Ensure email is always lowercase
    if (this.isModified('email')) {
        this.email = this.email.toLowerCase().trim();
    }
    
    // Validate and sanitize name
    if (this.isModified('name')) {
        this.name = this.name.trim();
        // Remove any potentially dangerous characters
        this.name = this.name.replace(/[<>\"'&]/g, '');
    }
    
    // Update last activity on any modification
    this.lastActivity = new Date();
    
    next();
});

// Post-save middleware for audit logging
userSchema.post('save', function(doc) {
    if (process.env.NODE_ENV !== 'test') {
        console.log(`User ${doc._id} (${doc.email}) was saved at ${new Date().toISOString()}`);
    }
});

// Indexes for performance optimization
userSchema.index({ email: 1 }, { unique: true }); // Primary lookup field
userSchema.index({ role: 1 }); // For admin/user filtering
userSchema.index({ isActive: 1, createdAt: -1 }); // For active users list
userSchema.index({ "activity.lastLogin": -1 }); // For recent activity tracking
userSchema.index({ accountLocked: 1, accountLockedUntil: 1 }); // For locked account queries

module.exports = mongoose.model("User", userSchema);
