const express = require("express");
const multer = require("multer");
const router = express.Router();
const softwareController = require("../controllers/softwareController");
const { adminAuth } = require("../middleware/adminAuth");
const { softwareUpload } = require("../config/fileUpload");
const { compressionPresets } = require("../middleware/imageCompression");

// Multer error handling middleware
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                status: "error",
                message: `File size exceeds limit (max 10MB)`,
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

// Admin routes (must come before dynamic :id routes)
router.post("/", adminAuth, softwareUpload.array("images", 5), handleMulterError, compressionPresets.web, softwareController.createSoftware);
router.get("/admin/stats", adminAuth, softwareController.getStats);

// Public routes
router.get("/", softwareController.getAllSoftware);
router.get("/categories", softwareController.getCategories);
router.get("/:id", softwareController.getSoftwareById);
router.post("/:id/click", softwareController.trackClick);

// Admin routes for specific software
router.put("/:id", adminAuth, softwareUpload.array("images", 5), handleMulterError, compressionPresets.web, softwareController.updateSoftware);
router.delete("/:id", adminAuth, softwareController.deleteSoftware);

module.exports = router;
