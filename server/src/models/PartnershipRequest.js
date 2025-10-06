/**
 * Partnership Request Model
 * 
 * Defines the database schema for partnership and sponsorship
 * requests from companies interested in collaborating.
 * 
 * Features:
 * - Company information (name, website, description)
 * - Contact details (email, contact person)
 * - Request status tracking (pending, reviewed, approved, rejected)
 * - Admin notes for internal communication
 * - Email validation
 * - Automatic timestamps
 * 
 * Status Workflow:
 * 1. pending - New partnership request submitted
 * 2. reviewed - Admin has reviewed the request
 * 3. approved - Partnership accepted
 * 4. rejected - Partnership declined
 * 
 * @module models/PartnershipRequest
 */

const mongoose = require("mongoose");

const partnershipRequestSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  contactEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email"]
  },
  website: {
    type: String,
    trim: true,
    maxlength: 500
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  contactPerson: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  status: {
    type: String,
    enum: ["pending", "reviewed", "approved", "rejected"],
    default: "pending"
  },
  adminNotes: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
partnershipRequestSchema.pre("save", function(next) {
  if (this.isModified() && !this.isNew) {
    this.updatedAt = Date.now();
  }
  next();
});

// Create indexes for better query performance
partnershipRequestSchema.index({ status: 1, createdAt: -1 });
partnershipRequestSchema.index({ contactEmail: 1 });

module.exports = mongoose.model("PartnershipRequest", partnershipRequestSchema);