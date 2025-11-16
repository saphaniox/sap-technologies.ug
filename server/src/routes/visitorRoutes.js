const express = require("express");
const router = express.Router();
const VisitorController = require("../controllers/visitorController");
const { authMiddleware, adminMiddleware } = require("../middleware/auth");

// POST /api/visitor/track - Update page view data (public endpoint)
router.post("/visitor/track", VisitorController.updatePageView);

// All admin visitor analytics routes require admin authentication
router.use(authMiddleware);
router.use(adminMiddleware);

// GET /api/admin/visitor-analytics - Get overall analytics
router.get("/visitor-analytics", VisitorController.getAnalytics);

// GET /api/admin/visitor-analytics/live - Get live visitor count and sessions
router.get("/visitor-analytics/live", VisitorController.getLiveVisitors);

// GET /api/admin/visitor-analytics/session/:sessionId - Get specific session details
router.get("/visitor-analytics/session/:sessionId", VisitorController.getSessionDetails);

// GET /api/admin/visitor-analytics/export - Export analytics data as CSV
router.get("/visitor-analytics/export", VisitorController.exportAnalytics);

module.exports = router;
