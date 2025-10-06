const express = require("express");
const partnershipRequestController = require("../controllers/partnershipRequestController");
const { validatePartnershipRequest } = require("../middleware/validation");
const { contactLimiter } = require("../middleware/rateLimiter");
const { authMiddleware, adminMiddleware } = require("../middleware/auth");

const router = express.Router();

// Public routes
router.post("/", contactLimiter, validatePartnershipRequest, partnershipRequestController.submitPartnershipRequest);

// Admin routes (protected)
router.get("/", authMiddleware, adminMiddleware, partnershipRequestController.getAllPartnershipRequests);
router.get("/:id", authMiddleware, adminMiddleware, partnershipRequestController.getPartnershipRequest);
router.put("/:id/status", authMiddleware, adminMiddleware, partnershipRequestController.updatePartnershipRequestStatus);
router.delete("/:id", authMiddleware, adminMiddleware, partnershipRequestController.deletePartnershipRequest);

module.exports = router;