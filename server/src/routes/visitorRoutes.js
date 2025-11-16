const express = require("express");
const router = express.Router();
const VisitorController = require("../controllers/visitorController");
const { authMiddleware, adminMiddleware } = require("../middleware/auth");

// POST /api/visitor/track - Update page view data (public endpoint)
router.post("/visitor/track", VisitorController.updatePageView);

// GET /api/admin/visitor-analytics - Get overall analytics (admin only)
router.get("/admin/visitor-analytics", authMiddleware, adminMiddleware, VisitorController.getAnalytics);

// GET /api/admin/visitor-analytics/live - Get live visitor count and sessions (admin only)
router.get("/admin/visitor-analytics/live", authMiddleware, adminMiddleware, VisitorController.getLiveVisitors);

// GET /api/admin/visitor-analytics/session/:sessionId - Get specific session details (admin only)
router.get("/admin/visitor-analytics/session/:sessionId", authMiddleware, adminMiddleware, VisitorController.getSessionDetails);

// GET /api/admin/visitor-analytics/export - Export analytics data as CSV (admin only)
router.get("/admin/visitor-analytics/export", authMiddleware, adminMiddleware, VisitorController.exportAnalytics);

module.exports = router;
