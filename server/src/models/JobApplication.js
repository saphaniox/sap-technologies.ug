const mongoose = require("mongoose");

const applicationFileSchema = new mongoose.Schema({
  url: {
    type: String,
    trim: true
  },
  originalName: {
    type: String,
    trim: true,
    maxlength: [255, "File name cannot exceed 255 characters"]
  },
  mimeType: {
    type: String,
    trim: true,
    maxlength: [120, "File type cannot exceed 120 characters"]
  },
  size: {
    type: Number,
    min: 0
  },
  cloudinaryId: {
    type: String,
    trim: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const jobApplicationSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Job",
    required: [true, "Job reference is required"]
  },
  fullName: {
    type: String,
    required: [true, "Full name is required"],
    trim: true,
    maxlength: [100, "Full name cannot exceed 100 characters"]
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    trim: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please provide a valid email"]
  },
  phone: {
    type: String,
    trim: true,
    maxlength: [20, "Phone number cannot exceed 20 characters"]
  },
  coverLetter: {
    type: String,
    trim: true,
    maxlength: [2000, "Cover letter cannot exceed 2000 characters"]
  },
  resumeUrl: {
    type: String,
    trim: true
  },
  resumeFile: applicationFileSchema,
  coverLetterFile: applicationFileSchema,
  status: {
    type: String,
    enum: {
      values: ["pending", "reviewed", "interviewed", "accepted", "rejected"],
      message: "Invalid application status"
    },
    default: "pending"
  },
  adminNotes: {
    type: String,
    trim: true,
    maxlength: [500, "Admin notes cannot exceed 500 characters"]
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  reviewedAt: {
    type: Date
  }
}, {
  timestamps: true
});

jobApplicationSchema.index({ job: 1, status: 1 });
jobApplicationSchema.index({ email: 1 });
jobApplicationSchema.index({ createdAt: -1 });

module.exports = mongoose.model("JobApplication", jobApplicationSchema);
