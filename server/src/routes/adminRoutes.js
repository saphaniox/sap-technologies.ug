const express = require("express");
const adminController = require("../controllers/adminController");
const { adminAuth } = require("../middleware/adminAuth");

const router = express.Router();

// All admin routes require admin authentication
router.use(adminAuth);

// Dashboard and statistics
router.get("/dashboard/stats", adminController.getDashboardStats);
router.get("/system/health", adminController.getSystemHealth);

// User management
router.get("/users", adminController.getAllUsers);
router.put("/users/:userId/role", adminController.updateUserRole);
router.delete("/users/:userId", adminController.deleteUser);

// Contact management
router.get("/contacts", adminController.getAllContacts);
router.put("/contacts/:contactId/status", adminController.updateContactStatus);
router.delete("/contacts/:contactId", adminController.deleteContact);

// Newsletter management
router.get("/newsletter/subscribers", adminController.getAllNewsletterSubscribers);
router.delete("/newsletter/subscribers/:subscriberId", adminController.deleteNewsletterSubscriber);

module.exports = router;