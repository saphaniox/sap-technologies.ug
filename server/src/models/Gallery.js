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
    type: String,
    required: [true, "Gallery image is required"]
  },
  cloudinaryId: {
    type: String,
    default: null
  },
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

gallerySchema.index({ category: 1, isActive: 1, displayOrder: 1 });
gallerySchema.index({ createdAt: -1 });

module.exports = mongoose.model("Gallery", gallerySchema);
