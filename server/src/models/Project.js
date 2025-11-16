const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Project title is required"],
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
    maxLength: [5000, "Long description cannot exceed 5000 characters"],
    default: ""
  },
  category: {
    type: String,
    required: false,
    enum: [
      "E-commerce Platform",
      "Learning Management System",
      "Mobile Application",
      "IoT Solution",
      "Web Application",
      "Portfolio Website",
      "Business Platform",
      "Graphics Design",
      "Electrical Project",
      "Other"
    ],
    default: "Web Application"
  },
  client: {
    name: {
      type: String,
      required: false,
      trim: true,
      default: ""
    },
    company: {
      type: String,
      required: false,
      trim: true,
      default: ""
    },
    industry: {
      type: String,
      required: false,
      trim: true,
      default: ""
    },
    location: {
      type: String,
      required: false,
      trim: true,
      default: ""
    },
    testimonial: {
      content: {
        type: String,
        required: false,
        maxLength: [1000, "Testimonial cannot exceed 1000 characters"],
        default: ""
      },
      rating: {
        type: Number,
        required: false,
        min: 1,
        max: 5,
        default: null
      }
    }
  },
  technologies: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      enum: ["Frontend", "Backend", "Database", "Mobile", "IoT", "Design", "DevOps", "Other"],
      default: "Other"
    },
    version: {
      type: String,
      trim: true
    }
  }],
  features: [{
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    }
  }],
  // Main project image (single field for primary image)
  image: {
    type: String,
    trim: true
  },
  // Project image gallery (array for multiple images)
  images: [{
    url: {
      type: String,
      required: true
    },
    alt: {
      type: String,
      default: ""
    },
    caption: {
      type: String,
      trim: true
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
  links: {
    liveDemo: {
      type: String,
      trim: true
    },
    github: {
      type: String,
      trim: true
    },
    documentation: {
      type: String,
      trim: true
    },
    video: {
      type: String,
      trim: true
    }
  },
  timeline: {
    startDate: {
      type: Date,
      required: false,
      default: null
    },
    endDate: {
      type: Date,
      required: false,
      default: null
    },
    duration: {
      type: Number, // in days
      required: false,
      min: [1, "Duration must be at least 1 day"],
      default: null
    },
    milestones: [{
      title: {
        type: String,
        required: true,
        trim: true
      },
      description: {
        type: String,
        trim: true
      },
      date: {
        type: Date,
        required: true
      },
      completed: {
        type: Boolean,
        default: false
      }
    }]
  },
  status: {
    type: String,
    enum: ["completed", "in-progress", "planned", "on-hold", "cancelled"],
    default: "completed"
  },
  featured: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ["high", "medium", "low"],
    default: "medium"
  },
  order: {
    type: Number,
    default: 0
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  metrics: {
    views: {
      type: Number,
      default: 0
    },
    likes: {
      type: Number,
      default: 0
    },
    shares: {
      type: Number,
      default: 0
    },
    inquiries: {
      type: Number,
      default: 0
    }
  },
  visibility: {
    type: String,
    enum: ["public", "private", "client-only"],
    default: "public"
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
    }],
    slug: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
projectSchema.index({ category: 1, status: 1, visibility: 1 });
projectSchema.index({ featured: 1, order: 1 });
projectSchema.index({ title: "text", description: "text", tags: "text" });

// Virtual for primary image
projectSchema.virtual("primaryImage").get(function() {
  const primary = this.images.find(img => img.isPrimary);
  return primary || this.images[0] || null;
});

// Virtual for project duration in human readable format
projectSchema.virtual("durationText").get(function() {
  if (!this.timeline.duration) return null;
  
  const days = this.timeline.duration;
  if (days < 7) return `${days} day${days > 1 ? "s" : ""}`;
  if (days < 30) return `${Math.ceil(days / 7)} week${Math.ceil(days / 7) > 1 ? "s" : ""}`;
  return `${Math.ceil(days / 30)} month${Math.ceil(days / 30) > 1 ? "s" : ""}`;
});

// Pre-save middleware for slug generation
projectSchema.pre("save", function(next) {
  if (this.isModified("title") && !this.seo.slug) {
    this.seo.slug = this.title
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }
  
  // Calculate duration if start and end dates are provided
  if (this.timeline.startDate && this.timeline.endDate && !this.timeline.duration) {
    const timeDiff = this.timeline.endDate - this.timeline.startDate;
    this.timeline.duration = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  }
  
  next();
});

// Static methods
projectSchema.statics.getFeaturedProjects = function(limit = 6) {
  return this.find({ 
    featured: true, 
    status: "completed", 
    visibility: "public" 
  })
    .sort({ order: 1, createdAt: -1 })
    .limit(limit);
};

projectSchema.statics.getProjectsByCategory = function(category) {
  return this.find({ 
    category, 
    visibility: "public",
    status: { $in: ["completed", "in-progress"] }
  })
    .sort({ order: 1, createdAt: -1 });
};

projectSchema.statics.getRecentProjects = function(limit = 10) {
  return this.find({ 
    visibility: "public",
    status: "completed"
  })
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Instance methods
projectSchema.methods.incrementViews = function() {
  this.metrics.views += 1;
  return this.save();
};

projectSchema.methods.incrementLikes = function() {
  this.metrics.likes += 1;
  return this.save();
};

projectSchema.methods.incrementShares = function() {
  this.metrics.shares += 1;
  return this.save();
};

projectSchema.methods.incrementInquiries = function() {
  this.metrics.inquiries += 1;
  return this.save();
};

projectSchema.methods.getCompletedMilestones = function() {
  return this.timeline.milestones.filter(milestone => milestone.completed);
};

projectSchema.methods.getProjectProgress = function() {
  if (!this.timeline.milestones.length) return 0;
  const completed = this.getCompletedMilestones().length;
  return Math.round((completed / this.timeline.milestones.length) * 100);
};

// Indexes for performance optimization
projectSchema.index({ category: 1, status: 1 }); // Category + status filtering
projectSchema.index({ status: 1, visibility: 1 }); // Public/private filtering
projectSchema.index({ featured: -1, order: 1 }); // Featured projects display
projectSchema.index({ createdAt: -1 }); // Recent projects
projectSchema.index({ "timeline.startDate": -1 }); // Sort by start date
projectSchema.index({ "metrics.views": -1 }); // Popular projects
projectSchema.index({ title: "text", shortDescription: "text", longDescription: "text" }); // Text search

const Project = mongoose.model("Project", projectSchema);

module.exports = Project;