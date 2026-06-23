const express = require("express");
const {
  getPublicJobs,
  getAllJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  applyForJob,
  getJobApplications,
  updateApplicationStatus
} = require("../controllers/jobController");
const { adminAuth } = require("../middleware/adminAuth");
const { resumeUpload } = require("../config/fileUpload");
const multer = require("multer");

const router = express.Router();

const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        status: "error",
        message: "File size exceeds limit (max 5MB)",
        error: err.message
      });
    }
    return res.status(400).json({
      status: "error",
      message: `File upload error: ${err.message}`,
      error: err.message
    });
  } else if (err) {
    return res.status(400).json({
      status: "error",
      message: err.message || "File upload failed"
    });
  }
  next();
};

const validateJob = [
  require("express-validator").body("title")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Job title must be between 2 and 100 characters"),
  require("express-validator").body("description")
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage("Job description must be between 10 and 2000 characters"),
  require("express-validator").body("requirements")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Requirements cannot exceed 2000 characters"),
  require("express-validator").body("responsibilities")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Responsibilities cannot exceed 2000 characters"),
  require("express-validator").body("benefits")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Benefits cannot exceed 1000 characters"),
  require("express-validator").body("salaryRange")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Salary range cannot exceed 100 characters"),
  require("express-validator").body("department")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Department cannot exceed 50 characters"),
  require("express-validator").body("location")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Location cannot exceed 50 characters"),
  require("express-validator").body("employmentType")
    .optional()
    .isIn(["Full-time", "Part-time", "Contract", "Internship", "Remote", "Freelance"])
    .withMessage("Invalid employment type"),
  require("express-validator").body("applicationDeadline")
    .optional()
    .isISO8601()
    .withMessage("Invalid deadline date"),
  require("express-validator").body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),
  require("express-validator").body("isFeatured")
    .optional()
    .isBoolean()
    .withMessage("isFeatured must be a boolean"),
  require("express-validator").body("displayOrder")
    .optional()
    .isInt({ min: 0, max: 9999 })
    .withMessage("Display order must be between 0 and 9999"),
  (req, res, next) => {
    const errors = require("express-validator").validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "error",
        message: "Validation failed",
        errors: errors.array()
      });
    }
    next();
  }
];

const validateApplication = [
  require("express-validator").body("fullName")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Full name must be between 2 and 100 characters"),
  require("express-validator").body("email")
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),
  require("express-validator").body("phone")
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage("Phone number cannot exceed 20 characters"),
  require("express-validator").body("coverLetter")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Cover letter cannot exceed 2000 characters"),
  require("express-validator").body("resumeUrl")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Resume URL cannot exceed 500 characters"),
  (req, res, next) => {
    const errors = require("express-validator").validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "error",
        message: "Validation failed",
        errors: errors.array()
      });
    }
    next();
  }
];

// Public routes
router.get("/public", getPublicJobs);
router.get("/:id", getJobById);
router.post("/:id/apply", validateApplication, applyForJob);

// Admin routes
router.use(adminAuth);

router.get("/", getAllJobs);
router.post("/", validateJob, createJob);
router.put("/:id", validateJob, updateJob);
router.delete("/:id", deleteJob);
router.get("/:id/applications", getJobApplications);
router.patch("/:id/applications/:applicationId/status", updateApplicationStatus);

module.exports = router;
