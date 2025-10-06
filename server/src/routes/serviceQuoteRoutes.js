const express = require("express");
const router = express.Router();
const ServiceQuoteController = require("../controllers/serviceQuoteController");
const { authMiddleware, adminMiddleware } = require("../middleware/auth");
const { rateLimits } = require("../config/security");

// Public route - Create quote request (with rate limiting)
router.post("/quotes", rateLimits.contact, (req, res) => ServiceQuoteController.createQuote(req, res));

// Admin routes - Manage quotes
router.get("/admin/quotes", authMiddleware, adminMiddleware, (req, res) => ServiceQuoteController.getAllQuotes(req, res));
router.get("/admin/quotes/stats", authMiddleware, adminMiddleware, (req, res) => ServiceQuoteController.getQuoteStats(req, res));
router.patch("/admin/quotes/:id", authMiddleware, adminMiddleware, (req, res) => ServiceQuoteController.updateQuoteStatus(req, res));
router.delete("/admin/quotes/:id", authMiddleware, adminMiddleware, (req, res) => ServiceQuoteController.deleteQuote(req, res));

module.exports = router;
