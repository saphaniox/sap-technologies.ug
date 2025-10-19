const mongoose = require("mongoose");

const newsletterSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, "Email is required"],
        lowercase: true,
        trim: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please provide a valid email"]
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
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
