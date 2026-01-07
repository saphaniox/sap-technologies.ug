const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Name is required"],
        trim: true,
        minlength: [2, "Name must be at least 2 characters long"],
        maxlength: [100, "Name cannot exceed 100 characters"]
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        lowercase: true,
        trim: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please provide a valid email"]
    },
    message: {
        type: String,
        required: [true, "Message is required"],
        trim: true,
        maxlength: [1000, "Message cannot exceed 1000 characters"]
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    status: {
        type: String,
        enum: ["pending", "read", "replied", "archived"],
        default: "pending"
    },
    submittedAt: {
        type: Date,
        default: Date.now
    },
    ipAddress: {
        type: String,
        default: null
    },
    userAgent: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

// Indexes for performance optimization
contactSchema.index({ submittedAt: -1 }); // Recent submissions
contactSchema.index({ status: 1, submittedAt: -1 }); // Status filtering with date sorting (using submittedAt instead of createdAt)
contactSchema.index({ email: 1 }); // Email lookup

module.exports = mongoose.model("Contact", contactSchema);

