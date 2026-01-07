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
    required: false,
    trim: true,
    default: ""
  },
  technicalDescription: {
    type: String,
    required: false,
    trim: true,
    default: ""
  },
  technicalSpecs: [{
    name: {
      type: String,
      required: false,
      trim: true
    },
    value: {
      type: String,
      required: false,
      trim: true
    }
  }],
  features: [{
    type: String,
    trim: true
  }],
  image: {
    type: String,
    required: false,
    trim: true,
    default: null // Primary image - backward compatibility
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
    },
    order: {
      type: Number,
      default: 0
    }
  }],
  category: {
    type: String,
    required: false,
    enum: [
      // Software & Digital
      "Software Solutions",
      "Web Applications", 
      "Mobile Apps",
      "Desktop Applications",
      "Enterprise Software",
      "SaaS Products",
      
      // Hardware & Electronics
      "IoT Devices",
      "Hardware",
      "Electronics", 
      "Electricals",
      "Networking Equipment",
      "Computer Hardware",
      "Smart Home Devices",
      
      // Emerging Tech
      "AI/ML Products",
      "Automation Solutions",
      "Robotics",
      "Blockchain Solutions",
      "Cloud Services",
      
      // Industry Specific
      "Security Solutions",
      "POS Systems",
      "Medical Devices",
      "Agricultural Tech",
      "Educational Tech",
      "Financial Tech",
      
      // General
      "Accessories",
      "Components",
      "Tools & Equipment",
      "Other"
    ],
    default: "Other"
  },
  price: {
    amount: {
      type: Number,
      required: false,
      min: [0, "Price cannot be negative"],
      default: null
    },
    currency: {
      type: String,
      required: false,
      default: "UGX",
      enum: [
        // Popular Currencies
        "UGX", "USD", "EUR", "GBP",
        // African Currencies
        "KES", "TZS", "RWF", "ZAR", "NGN", "GHS",
        // Other Major Currencies
        "CAD", "AUD", "JPY", "CNY", "INR", "AED", "SAR"
      ]
    },
    type: {
      type: String,
      enum: ["fixed", "negotiable", "contact-for-price"],
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
    trim: true
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

// Virtual for primary image
productSchema.virtual("primaryImage").get(function() {
  if (!this.images || !Array.isArray(this.images) || this.images.length === 0) {
    return this.image || null; // Fallback to single image field
  }
  const primary = this.images.find(img => img.isPrimary);
  return primary || this.images[0] || this.image || null;
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
productSchema.index({ isActive: 1, isFeatured: -1, displayOrder: 1 }); // Optimized for public listing query
productSchema.index({ isFeatured: -1, displayOrder: 1 }); // Featured products display
productSchema.index({ isActive: 1, createdAt: -1 }); // Active products by date
productSchema.index({ name: "text", shortDescription: "text", technicalDescription: "text" }); // Text search
productSchema.index({ "price.amount": 1 }); // Price range queries
productSchema.index({ "metadata.views": -1 }); // Popular products

// Virtual for primary image
productSchema.virtual("primaryImage").get(function() {
  if (!this.images || !Array.isArray(this.images) || this.images.length === 0) {
    return this.image || null; // Fallback to single image field
  }
  const primary = this.images.find(img => img.isPrimary);
  return primary ? primary.url : (this.images[0] ? this.images[0].url : this.image);
});

// Enable virtuals in JSON
productSchema.set("toJSON", { virtuals: true });
productSchema.set("toObject", { virtuals: true });

const Product = mongoose.model("Product", productSchema);

module.exports = Product;