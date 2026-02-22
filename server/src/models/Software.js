const mongoose = require("mongoose");

const softwareSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Software name is required"],
    trim: true,
    maxLength: [100, "Software name cannot exceed 100 characters"]
  },
  description: {
    type: String,
    required: false,
    trim: true,
    default: ""
  },
  url: {
    type: String,
    required: [true, "Software URL is required"],
    trim: true
  },
  image: {
    type: String,
    required: false,
    trim: true,
    default: null
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    alt: {
      type: String,
      default: ""
    }
  }],
  category: {
    type: String,
    required: false,
    trim: true,
    default: "General"
  },
  features: [{
    type: String,
    trim: true
  }],
  technologies: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ["active", "inactive", "coming-soon", "beta"],
    default: "active"
  },
  launchDate: {
    type: Date,
    default: Date.now
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  },
  stats: {
    views: {
      type: Number,
      default: 0
    },
    clicks: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
softwareSchema.index({ category: 1, status: 1 });
softwareSchema.index({ name: "text", description: "text" });
softwareSchema.index({ order: 1, createdAt: -1 });

// Virtual for primary image
softwareSchema.virtual("primaryImage").get(function() {
  if (this.images && this.images.length > 0) {
    return this.images[0].url;
  }
  return this.image || null;
});

// Ensure virtuals are included in JSON
softwareSchema.set("toJSON", { virtuals: true });
softwareSchema.set("toObject", { virtuals: true });

// Pre-save middleware to sync images array with image field
softwareSchema.pre("save", function(next) {
  if (this.images && this.images.length > 0 && !this.image) {
    this.image = this.images[0].url;
  }
  next();
});

// Static method to get all categories
softwareSchema.statics.getCategories = async function() {
  try {
    const categories = await this.aggregate([
      { $match: { isPublic: true } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    return categories.map(cat => ({
      name: cat._id || "Uncategorized",
      count: cat.count
    }));
  } catch (error) {
    throw error;
  }
};

// Instance method to increment views
softwareSchema.methods.incrementViews = async function() {
  this.stats.views += 1;
  await this.save();
};

// Instance method to increment clicks
softwareSchema.methods.incrementClicks = async function() {
  this.stats.clicks += 1;
  await this.save();
};

const Software = mongoose.model("Software", softwareSchema);

module.exports = Software;
