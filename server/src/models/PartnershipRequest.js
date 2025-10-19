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
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
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