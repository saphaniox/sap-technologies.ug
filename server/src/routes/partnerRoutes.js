const express = require("express");
const multer = require("multer");
const {
  getPartners,
  getAllPartners,
  getPartnerById,
  createPartner,
  updatePartner,
  deletePartner
} = require("../controllers/partnerController");
const { adminAuth } = require("../middleware/adminAuth");
const { validatePartner } = require("../middleware/validation");
const { partnerUpload } = require("../config/fileUpload"); // Use centralized upload config

const router = express.Router();

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

// Public routes
router.get("/public", getPartners);

// Admin routes (require authentication)
router.use(adminAuth); // Apply admin authentication to all routes below

router.get("/", getAllPartners);
router.get("/:id", getPartnerById);
router.post("/", partnerUpload.single("logo"), handleMulterError, validatePartner, createPartner);
router.put("/:id", partnerUpload.single("logo"), handleMulterError, validatePartner, updatePartner);
router.delete("/:id", deletePartner);

module.exports = router;