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

// Debug middleware to log file object structure after upload
const logFileStructure = (req, res, next) => {
    if (req.files && req.files.length > 0) {
        console.log('\n🔍 === FILE OBJECT STRUCTURE AFTER UPLOAD ===');
        console.log(`📦 Number of files: ${req.files.length}`);
        req.files.forEach((file, index) => {
            console.log(`\n📄 File ${index + 1}:`);
            console.log('  Keys:', Object.keys(file));
            console.log('  Full object:', JSON.stringify(file, null, 2).substring(0, 500));
        });
        console.log('=== END FILE STRUCTURE ===\n');
    }
    next();
};

// Admin routes (must come before dynamic :id routes)
router.post("/", adminAuth, softwareUpload.array("images", 5), handleMulterError, compressionPresets.webWatermarked, logFileStructure, softwareController.createSoftware);
router.get("/admin/stats", adminAuth, softwareController.getStats);

// Public routes
router.get("/", softwareController.getAllSoftware);
router.get("/categories", softwareController.getCategories);
router.get("/:id", softwareController.getSoftwareById);
router.post("/:id/click", softwareController.trackClick);

// Admin routes for specific software
router.put("/:id", adminAuth, softwareUpload.array("images", 5), handleMulterError, compressionPresets.webWatermarked, logFileStructure, softwareController.updateSoftware);
router.delete("/:id", adminAuth, softwareController.deleteSoftware);

module.exports = router;
