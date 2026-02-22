const mongoose = require("mongoose");

const iotSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please provide a project title"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"]
    },
    description: {
      type: String,
      required: false,
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
      default: ""
    },
    category: {
      type: String,
      default: "General",
      trim: true
    },
    technologies: [
      {
        type: String,
        trim: true
      }
    ],
    hardware: [
      {
        type: String,
        trim: true
      }
    ],
    features: [
      {
        type: String,
        trim: true
      }
    ],
    images: [
      {
        url: {
          type: String,
          required: false
        },
        caption: {
          type: String,
          default: ""
        },
        isCompressed: {
          type: Boolean,
          default: false
        }
      }
    ],
    projectUrl: {
      type: String,
      trim: true
    },
    githubUrl: {
      type: String,
      trim: true
    },
    videoUrl: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ["completed", "in-progress", "prototype", "planning"],
      default: "completed"
    },
    isPublic: {
      type: Boolean,
      default: true
    },
    isFeatured: {
      type: Boolean,
      default: false
    },
    completionDate: {
      type: Date
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
      likes: {
        type: Number,
        default: 0
      }
    }
  },
  {
    timestamps: true
  }
);

// Virtual for primary image
iotSchema.virtual("primaryImage").get(function () {
  if (this.images && this.images.length > 0) {
    return this.images[0].url;
  }
  return null;
});

// Ensure virtuals are included in JSON output
iotSchema.set("toJSON", { virtuals: true });
iotSchema.set("toObject", { virtuals: true });

// Index for better query performance
iotSchema.index({ title: "text", description: "text" });
iotSchema.index({ category: 1, status: 1 });
iotSchema.index({ isFeatured: 1, isPublic: 1 });

// Static method to get all categories
iotSchema.statics.getCategories = async function () {
  const categories = await this.distinct("category");
  return categories.filter(cat => cat && cat.trim() !== "");
};

// Instance method to increment views
iotSchema.methods.incrementViews = async function () {
  this.stats.views += 1;
  return await this.save();
};

// Instance method to increment likes
iotSchema.methods.incrementLikes = async function () {
  this.stats.likes += 1;
  return await this.save();
};

const IoT = mongoose.model("IoT", iotSchema);

module.exports = IoT;
