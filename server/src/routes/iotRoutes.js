const express = require("express");
const multer = require("multer");
const router = express.Router();
const {
  getAllIoTProjects,
  getIoTProjectById,
  createIoTProject,
  updateIoTProject,
  deleteIoTProject,
  getCategories,
  likeProject,
  getAdminStats
} = require("../controllers/iotController");
const { adminAuth } = require("../middleware/adminAuth");
const { iotUpload } = require("../config/fileUpload");
const { compressionPresets } = require("../middleware/imageCompression");

// Multer error handling middleware
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                status: "error",
                message: `File size exceeds limit (max 200MB)`,
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

// Public routes
router.get("/", getAllIoTProjects);
router.get("/categories", getCategories);

// Admin routes (must come before /:id to avoid route conflicts)
router.get("/admin/stats", adminAuth, getAdminStats);
router.post("/", adminAuth, iotUpload.fields([{name: 'images', maxCount: 10}, {name: 'videos', maxCount: 3}]), handleMulterError, compressionPresets.highQualityWatermarked, createIoTProject);
router.put("/:id", adminAuth, iotUpload.fields([{name: 'images', maxCount: 10}, {name: 'videos', maxCount: 3}]), handleMulterError, compressionPresets.highQualityWatermarked, updateIoTProject);
router.delete("/:id", adminAuth, deleteIoTProject);

// Public dynamic routes (must come after specific routes)
router.get("/:id", getIoTProjectById);
router.post("/:id/like", likeProject);

module.exports = router;
