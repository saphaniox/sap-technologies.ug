const express = require("express");
const authController = require("../controllers/authController");
const { authMiddleware } = require("../middleware/auth");
const { validateRegistration, validateLogin } = require("../middleware/validation");
const { authLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

// Auth routes
router.post("/signup", authLimiter, validateRegistration, authController.register);
router.post("/login", authLimiter, validateLogin, authController.login);
router.post("/logout", authController.logout);
router.get("/account", authMiddleware, authController.getCurrentUser);
router.get("/check", authController.checkAuth);

module.exports = router;