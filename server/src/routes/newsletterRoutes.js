const express = require("express");
const newsletterController = require("../controllers/newsletterController");
const { validateNewsletter } = require("../middleware/validation");
const { newsletterLimiter } = require("../middleware/rateLimiter");
const { authMiddleware, adminMiddleware, optionalAuthMiddleware } = require("../middleware/auth");

const router = express.Router();

// Public routes
router.post("/subscribe", optionalAuthMiddleware, newsletterLimiter, validateNewsletter, newsletterController.subscribe);
router.post("/unsubscribe", newsletterLimiter, validateNewsletter, newsletterController.unsubscribe);

// Admin routes (protected)
router.get("/subscribers", authMiddleware, adminMiddleware, newsletterController.getAllSubscribers);
router.get("/stats", authMiddleware, adminMiddleware, newsletterController.getStats);

module.exports = router;