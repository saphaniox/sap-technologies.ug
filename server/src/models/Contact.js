/**
 * Contact Model
 * 
 * Defines the database schema for contact form submissions with
 * status tracking and security metadata.
 * 
 * Features:
 * - Contact form data (name, email, message)
 * - Status management (pending, read, replied, archived)
 * - Submission tracking (date, IP address, user agent)
 * - Email validation
 * - Automatic timestamps
 * - Indexed fields for query performance
 * 
 * Status Workflow:
 * 1. pending - New submission
 * 2. read - Admin has viewed
 * 3. replied - Admin has responded
 * 4. archived - No longer active
 * 
 * @module models/Contact
 */

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
        minlength: [10, "Message must be at least 10 characters long"],
        maxlength: [1000, "Message cannot exceed 1000 characters"]
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

// Index for better query performance
contactSchema.index({ submittedAt: -1 });
contactSchema.index({ status: 1 });
contactSchema.index({ email: 1 });

module.exports = mongoose.model("Contact", contactSchema);

