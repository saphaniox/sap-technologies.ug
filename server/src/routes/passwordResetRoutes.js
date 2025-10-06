// Password Reset Routes
const express = require('express');
const router = express.Router();
const passwordResetController = require('../controllers/passwordResetController');
const { authLimiter } = require('../middleware/rateLimiter');

// Apply rate limiting to prevent abuse
router.post('/forgot-password', authLimiter, passwordResetController.requestPasswordReset);
router.post('/reset-password', authLimiter, passwordResetController.resetPassword);
router.post('/resend-reset-code', authLimiter, passwordResetController.resendVerificationCode);

module.exports = router;
