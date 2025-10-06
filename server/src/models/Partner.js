/**
 * Partner Model
 * 
 * Defines the database schema for business partners and sponsors
 * displayed on the website.
 * 
 * Features:
 * - Partner information (name, logo, website, description)
 * - Active/inactive status control
 * - Display order management
 * - Logo image storage
 * - Automatic timestamps
 * - Indexed ordering for efficient queries
 * 
 * Display Logic:
 * - Partners sorted by 'order' field (ascending)
 * - Then by creation date (newest first)
 * - Only active partners shown on public pages
 * 
 * @module models/Partner
 */

const mongoose = require("mongoose");

const partnerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  logo: {
    type: String,
    required: true
  },
  website: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for ordering
partnerSchema.index({ order: 1, createdAt: -1 });

module.exports = mongoose.model("Partner", partnerSchema);