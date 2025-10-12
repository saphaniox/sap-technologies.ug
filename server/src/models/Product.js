/**
 * Product Model
 * 
 * Defines the database schema for product catalog items including
 * technical specifications, features, and categorization.
 * 
 * Features:
 * - Product information (name, descriptions, images)
 * - Technical specifications array
 * - Feature lists
 * - Category management
 * - Pricing information
 * - Stock tracking
 * - View counter
 * - Active/inactive status
 * - Timestamps (created/updated dates)
 * 
 * Categories:
 * - Electronics
 * - Vehicles
 * - Services
 * - Spare Parts
 * - Other
 * 
 * @module models/Product
 */

const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Product name is required"],
    trim: true,
    maxLength: [100, "Product name cannot exceed 100 characters"]
  },
  shortDescription: {
    type: String,
    required: [true, "Product short description is required"],
    trim: true,
    maxLength: [200, "Short description cannot exceed 200 characters"]
  },
  technicalDescription: {
    type: String,
    required: [true, "Technical description is required"],
    trim: true,
    maxLength: [1000, "Technical description cannot exceed 1000 characters"]
  },
  technicalSpecs: [{
    name: {
      type: String,
      required: true,
      trim: true,
      maxLength: [100, "Spec name cannot exceed 100 characters"]
    },
    value: {
      type: String,
      required: true,
      trim: true,
      maxLength: [200, "Spec value cannot exceed 200 characters"]
    }
  }],
  features: [{
    type: String,
    trim: true,
    maxLength: [200, "Feature cannot exceed 200 characters"]
  }],
  image: {
    type: String,
    required: false,
    trim: true,
    default: null // No default image - products must have individual images
  },
  category: {
    type: String,
    required: [true, "Product category is required"],
    enum: [
      "IoT Devices", 
      "Software Solutions", 
      "Web Applications", 
      "Mobile Apps", 
      "Hardware",
      "Electricals",
      "Electronics", 
      "Automation",
      "AI/ML Products",
      "Other"
    ],
    default: "Other"
  },
  price: {
    amount: {
      type: Number,
      min: [0, "Price cannot be negative"]
    },
    currency: {
      type: String,
      default: "USD",
      enum: ["USD", "EUR", "GBP", "UGX"]
    },
    type: {
      type: String,
      enum: ["fixed", "starting-from", "contact-for-price"],
      default: "contact-for-price"
    }
  },
  availability: {
    type: String,
    enum: ["in-stock", "pre-order", "custom-order", "discontinued"],
    default: "custom-order"
  },
  tags: [{
    type: String,
    trim: true,
    maxLength: [50, "Tag cannot exceed 50 characters"]
  }],
  displayOrder: {
    type: Number,
    default: 0,
    min: [0, "Display order cannot be negative"]
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  metadata: {
    views: {
      type: Number,
      default: 0
    },
    inquiries: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for performance
productSchema.index({ isActive: 1, displayOrder: 1 });
productSchema.index({ category: 1 });
productSchema.index({ isFeatured: 1, isActive: 1 });

// Virtual for formatted price
productSchema.virtual("formattedPrice").get(function() {
  if (this.price.type === "contact-for-price") {
    return "Contact for Price";
  }
  
  if (this.price.amount) {
    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: this.price.currency || "USD"
    });
    
    return this.price.type === "starting-from" 
      ? `Starting from ${formatter.format(this.price.amount)}`
      : formatter.format(this.price.amount);
  }
  
  return "Price TBD";
});

// Static method to get active products
productSchema.statics.getActiveProducts = function() {
  return this.find({ isActive: true })
    .sort({ displayOrder: 1, createdAt: -1 });
};

// Static method to get featured products
productSchema.statics.getFeaturedProducts = function() {
  return this.find({ isActive: true, isFeatured: true })
    .sort({ displayOrder: 1, createdAt: -1 });
};

// Instance method to increment views
productSchema.methods.incrementViews = function() {
  this.metadata.views += 1;
  return this.save();
};

// Instance method to increment inquiries
productSchema.methods.incrementInquiries = function() {
  this.metadata.inquiries += 1;
  return this.save();
};

// Pre-save middleware for validation
productSchema.pre("save", function(next) {
  // Ensure at least one technical spec exists
  if (this.technicalSpecs && this.technicalSpecs.length === 0) {
    this.technicalSpecs = [{ name: "Type", value: this.category }];
  }
  
  next();
});

// Indexes for performance optimization
productSchema.index({ category: 1, isActive: 1 }); // Category filtering
productSchema.index({ isFeatured: -1, displayOrder: 1 }); // Featured products display
productSchema.index({ isActive: 1, createdAt: -1 }); // Active products by date
productSchema.index({ name: "text", shortDescription: "text", technicalDescription: "text" }); // Text search
productSchema.index({ "price.amount": 1 }); // Price range queries
productSchema.index({ "metadata.views": -1 }); // Popular products

const Product = mongoose.model("Product", productSchema);

module.exports = Product;