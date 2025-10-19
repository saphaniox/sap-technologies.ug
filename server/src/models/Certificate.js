const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  certificateId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  recipientName: {
    type: String,
    required: true,
    trim: true
  },
  recipientEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  categoryName: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['winner', 'finalist', 'participation'],
    required: true
  },
  awardYear: {
    type: String,
    default: '2025'
  },
  issueDate: {
    type: Date,
    default: Date.now
  },
  filename: {
    type: String,
    required: true
  },
  verificationUrl: {
    type: String
  },
  status: {
    type: String,
    enum: ['active', 'revoked', 'expired'],
    default: 'active'
  },
  verificationCount: {
    type: Number,
    default: 0
  },
  lastVerifiedAt: {
    type: Date
  },
  metadata: {
    generatedBy: String,
    ipAddress: String,
    userAgent: String
  }
}, {
  timestamps: true
});

// Index for fast lookups
certificateSchema.index({ certificateId: 1, status: 1 });
certificateSchema.index({ recipientEmail: 1 });
certificateSchema.index({ type: 1, awardYear: 1 });

// Method to increment verification count
certificateSchema.methods.recordVerification = async function() {
  this.verificationCount += 1;
  this.lastVerifiedAt = new Date();
  await this.save();
};

// Static method to find valid certificate
certificateSchema.statics.findValidCertificate = async function(certificateId) {
  return this.findOne({ 
    certificateId, 
    status: 'active' 
  });
};

const Certificate = mongoose.model('Certificate', certificateSchema);

module.exports = Certificate;
