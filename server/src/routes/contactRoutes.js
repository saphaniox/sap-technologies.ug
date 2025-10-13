const express = require("express");
const contactController = require("../controllers/contactController");
const { validateContact } = require("../middleware/validation");
const { contactLimiter } = require("../middleware/rateLimiter");
const { authMiddleware, adminMiddleware, optionalAuthMiddleware } = require("../middleware/auth");

const router = express.Router();

// Public routes
router.post("/", optionalAuthMiddleware, contactLimiter, validateContact, contactController.submitContact);

// Admin routes (protected)
router.get("/", authMiddleware, adminMiddleware, contactController.getAllContacts);
router.get("/:id", authMiddleware, adminMiddleware, contactController.getContact);
router.put("/:id/status", authMiddleware, adminMiddleware, contactController.updateContactStatus);
router.delete("/:id", authMiddleware, adminMiddleware, contactController.deleteContact);

module.exports = router;