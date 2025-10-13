const express = require("express");
const router = express.Router();
const ProductInquiryController = require("../controllers/productInquiryController");
const { authMiddleware, adminMiddleware, optionalAuthMiddleware } = require("../middleware/auth");
const { rateLimits } = require("../config/security");

// Public route - Create inquiry (with rate limiting)
router.post("/inquiries", optionalAuthMiddleware, rateLimits.inquiry, (req, res) => ProductInquiryController.createInquiry(req, res));

// Admin routes - Manage inquiries
router.get("/admin/inquiries", authMiddleware, adminMiddleware, (req, res) => ProductInquiryController.getAllInquiries(req, res));
router.get("/admin/inquiries/stats", authMiddleware, adminMiddleware, (req, res) => ProductInquiryController.getInquiryStats(req, res));
router.patch("/admin/inquiries/:id", authMiddleware, adminMiddleware, (req, res) => ProductInquiryController.updateInquiryStatus(req, res));
router.delete("/admin/inquiries/:id", authMiddleware, adminMiddleware, (req, res) => ProductInquiryController.deleteInquiry(req, res));

module.exports = router;
