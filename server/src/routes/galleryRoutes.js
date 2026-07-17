const express = require("express");
const multer = require("multer");
const {
  getPublicGallery,
  getAllGallery,
  getGalleryById,
  createGalleryItem,
  updateGalleryItem,
  deleteGalleryItem
} = require("../controllers/galleryController");
const { adminAuth } = require("../middleware/adminAuth");
const { galleryUpload } = require("../config/fileUpload");
const { compressionPresets } = require("../middleware/imageCompression");

const router = express.Router();

const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        status: "error",
        message: "File size exceeds limit (max 50MB per file)",
        error: err.message
      });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        status: "error",
        message: "Too many files selected. Please upload up to 12 gallery files at once.",
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

const validateGallery = [
  require("express-validator").body("title")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Title cannot exceed 100 characters"),
  require("express-validator").body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),
  require("express-validator").body("category")
    .optional()
    .trim()
    .isIn(["services", "projects", "events", "team", "office", "other"])
    .withMessage("Invalid gallery category"),
  require("express-validator").body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),
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

// Public routes
router.get("/public", getPublicGallery);

// Admin routes
router.use(adminAuth);

router.get("/", getAllGallery);
router.get("/:id", getGalleryById);
router.post(
  "/",
  galleryUpload.fields([
    { name: "media", maxCount: 12 },
    { name: "image", maxCount: 1 }
  ]),
  handleMulterError,
  compressionPresets.gallery,
  validateGallery,
  createGalleryItem
);
router.put(
  "/:id",
  galleryUpload.fields([
    { name: "media", maxCount: 12 },
    { name: "image", maxCount: 1 }
  ]),
  handleMulterError,
  compressionPresets.gallery,
  validateGallery,
  updateGalleryItem
);
router.delete("/:id", deleteGalleryItem);

module.exports = router;
