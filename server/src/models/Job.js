const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Job title is required"],
    trim: true,
    maxlength: [100, "Job title cannot exceed 100 characters"]
  },
  department: {
    type: String,
    trim: true,
    maxlength: [50, "Department cannot exceed 50 characters"],
    default: "General"
  },
  location: {
    type: String,
    trim: true,
    maxlength: [50, "Location cannot exceed 50 characters"],
    default: "Ndejje, Kampala, Uganda"
  },
  employmentType: {
    type: String,
    trim: true,
    enum: {
      values: ["Full-time", "Part-time", "Contract", "Internship", "Remote", "Freelance"],
      message: "Invalid employment type"
    },
    default: "Full-time"
  },
  description: {
    type: String,
    required: [true, "Job description is required"],
    trim: true,
    maxlength: [2000, "Job description cannot exceed 2000 characters"]
  },
  requirements: {
    type: String,
    trim: true,
    maxlength: [2000, "Requirements cannot exceed 2000 characters"]
  },
  responsibilities: {
    type: String,
    trim: true,
    maxlength: [2000, "Responsibilities cannot exceed 2000 characters"]
  },
  benefits: {
    type: String,
    trim: true,
    maxlength: [1000, "Benefits cannot exceed 1000 characters"]
  },
  salaryRange: {
    type: String,
    trim: true,
    maxlength: [100, "Salary range cannot exceed 100 characters"]
  },
  applicationDeadline: {
    type: Date
  },
  poster: {
    type: String,
    trim: true,
    maxlength: [500, "Poster URL cannot exceed 500 characters"]
  },
  posterAlt: {
    type: String,
    trim: true,
    maxlength: [160, "Poster alt text cannot exceed 160 characters"]
  },
  posterCloudinaryId: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  displayOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

jobSchema.index({ isActive: 1, isFeatured: -1, displayOrder: 1 });
jobSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Job", jobSchema);
