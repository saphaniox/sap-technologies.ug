const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Service title is required"],
    trim: true,
    maxLength: [100, "Title cannot exceed 100 characters"]
  },
  description: {
    type: String,
    required: false,
    trim: true,
    maxLength: [500, "Description cannot exceed 500 characters"],
    default: ""
  },
  longDescription: {
    type: String,
    required: false,
    trim: true,
    maxLength: [2000, "Long description cannot exceed 2000 characters"],
    default: ""
  },
  icon: {
    type: String,
    required: false,
    trim: true,
    default: "🛠️"
  },
  category: {
    type: String,
    required: false,
    enum: ["Web Development", "Mobile Development", "IoT Solutions", "Graphics Design", "Electrical Engineering", "Other"],
    default: "Other"
  },
  price: {
    startingPrice: {
      type: Number,
      required: false,
      min: [0, "Price cannot be negative"],
      default: null
    },
    currency: {
      type: String,
      required: false,
      default: "USD",
      enum: ["USD", "EUR", "GBP","KES", "NGN", "UGX"]
    },
    priceType: {
      type: String,
      required: false,
      enum: ["fixed", "hourly", "project-based", "custom"],
      default: "custom"
    }
  },
  features: [{
    type: String,
    trim: true
  }],
  technologies: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    level: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced", "Expert"],
      default: "Intermediate"
    }
  }],
  duration: {
    estimated: {
      type: Number, // in days
      required: false,
      min: [1, "Duration must be at least 1 day"],
      default: null
    },
    unit: {
      type: String,
      required: false,
      enum: ["days", "weeks", "months"],
      default: "days"
    }
  },
  image: {
    type: String,
    trim: true
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    alt: {
      type: String,
      default: ""
    },
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  status: {
    type: String,
    enum: ["active", "inactive", "coming-soon"],
    default: "active"
  },
  featured: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    default: 0
  },
  metadata: {
    views: {
      type: Number,
      default: 0
    },
    inquiries: {
      type: Number,
      default: 0
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  seo: {
    metaTitle: {
      type: String,
      maxLength: [60, "Meta title cannot exceed 60 characters"]
    },
    metaDescription: {
      type: String,
      maxLength: [160, "Meta description cannot exceed 160 characters"]
    },
    keywords: [{
      type: String,
      trim: true
    }]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
serviceSchema.index({ category: 1, status: 1 });
serviceSchema.index({ featured: 1, order: 1 });
serviceSchema.index({ status: 1, featured: -1, order: 1 }); // Optimized for public listing query
serviceSchema.index({ title: "text", description: "text" });

// Virtual for primary image
serviceSchema.virtual("primaryImage").get(function() {
  if (!this.images || !Array.isArray(this.images) || this.images.length === 0) {
    return null;
  }
  const primary = this.images.find(img => img.isPrimary);
  return primary || this.images[0] || null;
});

// Pre-save middleware
serviceSchema.pre("save", function(next) {
  this.metadata.lastUpdated = Date.now();
  next();
});

// Static methods
serviceSchema.statics.getFeaturedServices = function() {
  return this.find({ featured: true, status: "active" })
    .sort({ order: 1, createdAt: -1 })
    .limit(6);
};

serviceSchema.statics.getServicesByCategory = function(category) {
  return this.find({ category, status: "active" })
    .sort({ order: 1, createdAt: -1 });
};

// Instance methods
serviceSchema.methods.incrementViews = function() {
  this.metadata.views += 1;
  return this.save();
};

serviceSchema.methods.incrementInquiries = function() {
  this.metadata.inquiries += 1;
  return this.save();
};

const Service = mongoose.model("Service", serviceSchema);

module.exports = Service;