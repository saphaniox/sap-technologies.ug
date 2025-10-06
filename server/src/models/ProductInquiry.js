/**
 * Product Inquiry Model
 * 
 * Defines the database schema for customer inquiries about
 * specific products in the catalog.
 * 
 * Features:
 * - Product reference (ObjectId link to Product model)
 * - Customer contact information (email, phone)
 * - Preferred contact method (email, phone, both)
 * - Inquiry message
 * - Status tracking (new, contacted, resolved, closed)
 * - Admin notes for follow-up
 * - Metadata (IP address, user agent, timestamps)
 * 
 * Status Workflow:
 * 1. new - Fresh inquiry submitted
 * 2. contacted - Admin has reached out to customer
 * 3. resolved - Inquiry answered successfully
 * 4. closed - Inquiry no longer active
 * 
 * @module models/ProductInquiry
 */

const mongoose = require("mongoose");

const productInquirySchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  customerEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"]
  },
  customerPhone: {
    type: String,
    trim: true
  },
  preferredContact: {
    type: String,
    enum: ["email", "phone", "both"],
    default: "email"
  },
  message: {
    type: String,
    maxlength: 1000
  },
  status: {
    type: String,
    enum: ["new", "contacted", "resolved", "closed"],
    default: "new"
  },
  adminNotes: {
    type: String
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    createdAt: {
      type: Date,
      default: Date.now
    },
    respondedAt: Date
  }
}, {
  timestamps: true
});

// Index for faster queries
productInquirySchema.index({ product: 1, createdAt: -1 });
productInquirySchema.index({ customerEmail: 1 });
productInquirySchema.index({ status: 1 });

module.exports = mongoose.model("ProductInquiry", productInquirySchema);
