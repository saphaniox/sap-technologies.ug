 
 /* @module models/ServiceQuote
 */

const mongoose = require("mongoose");

const serviceQuoteSchema = new mongoose.Schema({
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Service",
    required: false // Optional: frontend services may not exist in DB
  },
  serviceName: {
    type: String,
    required: true // Always required: used for display and emails
  },
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  customerEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  customerPhone: {
    type: String,
    trim: true
  },
  companyName: {
    type: String,
    trim: true
  },
  preferredContact: {
    type: String,
    enum: ["email", "phone", "both"],
    default: "email"
  },
  projectDetails: {
    type: String,
    maxLength: 2000
  },
  budget: {
    type: String,
    enum: ["< $5,000", "$5,000 - $10,000", "$10,000 - $25,000", "$25,000 - $50,000", "> $50,000", "Not sure"],
    default: "Not sure"
  },
  timeline: {
    type: String,
    enum: ["ASAP", "1-2 weeks", "1 month", "2-3 months", "3+ months", "Flexible"],
    default: "Flexible"
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  status: {
    type: String,
    enum: ["new", "contacted", "quoted", "converted", "closed"],
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

// Indexes for efficient querying
serviceQuoteSchema.index({ service: 1, createdAt: -1 });
serviceQuoteSchema.index({ customerEmail: 1 });
serviceQuoteSchema.index({ status: 1 });
serviceQuoteSchema.index({ createdAt: -1 });

const ServiceQuote = mongoose.model("ServiceQuote", serviceQuoteSchema);

module.exports = ServiceQuote;
