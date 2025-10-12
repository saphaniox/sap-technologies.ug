/**
 * Newsletter Model
 * 
 * Defines the database schema for email newsletter subscriptions
 * with subscription tracking and source analytics.
 * 
 * Features:
 * - Email validation and storage
 * - Subscription date tracking
 * - Active/inactive status (for unsubscribes)
 * - Unsubscribe date tracking
 * - Source tracking (website, social, referral, other)
 * - Automatic timestamps
 * - Indexed fields for query performance
 * - Unique email constraint
 * 
 * Subscription Sources:
 * - website: Direct sign-up from website form
 * - social: From social media links
 * - referral: Referred by another user
 * - other: Other sources
 * 
 * @module models/Newsletter
 */

const mongoose = require("mongoose");

const newsletterSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, "Email is required"],
        lowercase: true,
        trim: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please provide a valid email"]
    },
    subscribedAt: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    },
    unsubscribedAt: {
        type: Date,
        default: null
    },
    source: {
        type: String,
        enum: ["website", "social", "referral", "other"],
        default: "website"
    }
}, {
    timestamps: true
});

// Indexes for performance optimization
newsletterSchema.index({ email: 1 }, { unique: true }); // Primary lookup and uniqueness
newsletterSchema.index({ isActive: 1, subscribedAt: -1 }); // Active subscribers by date
newsletterSchema.index({ source: 1 }); // Analytics by source

module.exports = mongoose.model("Newsletter", newsletterSchema);
