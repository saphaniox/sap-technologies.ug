const mongoose = require("mongoose");

const gallerySchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
    maxlength: [100, "Title cannot exceed 100 characters"]
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, "Description cannot exceed 500 characters"]
  },
  category: {
    type: String,
    required: [true, "Category is required"],
    trim: true,
    enum: {
      values: ["services", "projects", "events", "team", "office", "other"],
      message: "Invalid gallery category"
    },
    default: "other"
  },
  image: {
    type: String
  },
  cloudinaryId: {
    type: String,
    default: null
  },
  media: [{
    url: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ["image", "video"],
      default: "image"
    },
    mimeType: {
      type: String,
      default: ""
    },
    size: {
      type: Number,
      default: 0
    },
    cloudinaryId: {
      type: String,
      default: null
    },
    originalName: {
      type: String,
      default: ""
    },
    isCompressed: {
      type: Boolean,
      default: false
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  displayOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

gallerySchema.pre("validate", function requireGalleryMedia(next) {
  if (!this.image && (!this.media || this.media.length === 0)) {
    this.invalidate("media", "At least one gallery photo or video is required");
  }

  if (!this.image && this.media?.length > 0) {
    const primaryMedia = this.media.find((item) => item.type === "image") || this.media[0];
    this.image = primaryMedia.url;
    this.cloudinaryId = primaryMedia.cloudinaryId || null;
  }

  next();
});

gallerySchema.index({ category: 1, isActive: 1, displayOrder: 1 });
gallerySchema.index({ createdAt: -1 });

module.exports = mongoose.model("Gallery", gallerySchema);
