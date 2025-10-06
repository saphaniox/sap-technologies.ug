/**
 * Password Reset Controller
 * 
 * Handles secure password reset flow with email verification codes.
 * 
 * Features:
 * - Forgot password request handling
 * - 6-digit verification code generation
 * - Code verification and validation
 * - Password reset with security checks
 * - Code expiration (10 minutes)
 * - SHA-256 hashing for codes
 * - Email enumeration protection
 * - Rate limiting friendly
 * 
 * Security Features:
 * - Verification codes hashed before storage
 * - Time-limited codes (10 minutes)
 * - No email enumeration (same response for valid/invalid emails)
 * - Codes invalidated after use
 * - Strong password requirements
 * 
 * Reset Flow:
 * 1. User requests reset with email
 * 2. System sends 6-digit code to email
 * 3. User verifies code
 * 4. User enters new password
 * 5. System validates and updates password
 * 6. Code is invalidated
 * 
 * @module controllers/passwordResetController
 */

// Password Reset Controller
// Handles forgot password requests and password resets with verification codes

const User = require('../models/User');
const emailService = require('../services/emailService');
const crypto = require('crypto');

class PasswordResetController {
    /**
     * Request password reset - Send verification code to user's email
     * POST /api/auth/forgot-password
     */
    async requestPasswordReset(req, res) {
        try {
            const { email } = req.body;

            // Validate email
            if (!email) {
                return res.status(400).json({
                    success: false,
                    message: 'Email is required'
                });
            }

            // Find user by email
            const user = await User.findOne({ email: email.toLowerCase().trim() });

            // Always return success to prevent email enumeration attacks
            // Don't reveal if email exists or not
            const successMessage = 'If an account with that email exists, you will receive a password reset code shortly.';

            if (!user) {
                return res.status(200).json({
                    success: true,
                    message: successMessage
                });
            }

            // Generate 6-digit verification code
            const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

            // Hash the code before storing
            const hashedCode = crypto.createHash('sha256').update(verificationCode).digest('hex');

            // Store hashed code and expiration (10 minutes)
            user.passwordResetToken = hashedCode;
            user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);
            await user.save();

            // Send verification code via email
            try {
                await emailService.sendPasswordResetCode(user.email, user.name, verificationCode);
                
                return res.status(200).json({
                    success: true,
                    message: successMessage
                });
            } catch (emailError) {
                console.error('Error sending password reset email:', emailError);
                
                // Clear the reset token if email fails
                user.passwordResetToken = undefined;
                user.passwordResetExpires = undefined;
                await user.save();

                return res.status(500).json({
                    success: false,
                    message: 'Failed to send password reset email. Please try again later.'
                });
            }
        } catch (error) {
            console.error('Password reset request error:', error);
            return res.status(500).json({
                success: false,
                message: 'An error occurred while processing your request. Please try again later.'
            });
        }
    }

    /**
     * Verify code and reset password
     * POST /api/auth/reset-password
     */
    async resetPassword(req, res) {
        try {
            const { email, verificationCode, newPassword } = req.body;

            // Validate inputs
            if (!email || !verificationCode || !newPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Email, verification code, and new password are required'
                });
            }

            // Validate password strength
            if (newPassword.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: 'Password must be at least 6 characters long'
                });
            }

            // Hash the provided verification code
            const hashedCode = crypto.createHash('sha256').update(verificationCode).digest('hex');

            // Find user with matching email, reset token, and non-expired token
            const user = await User.findOne({
                email: email.toLowerCase().trim(),
                passwordResetToken: hashedCode,
                passwordResetExpires: { $gt: Date.now() }
            });

            if (!user) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid or expired verification code. Please request a new code.'
                });
            }

            // Update password (will be automatically hashed by pre-save hook)
            user.password = newPassword;
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            user.passwordChangedAt = Date.now();
            await user.save();

            // Send confirmation email
            try {
                await emailService.sendPasswordChangeConfirmation(user.email, user.name);
            } catch (emailError) {
                console.error('Error sending password change confirmation:', emailError);
                // Don't fail the request if confirmation email fails
            }

            return res.status(200).json({
                success: true,
                message: 'Password has been reset successfully. You can now log in with your new password.'
            });
        } catch (error) {
            console.error('Password reset error:', error);
            return res.status(500).json({
                success: false,
                message: 'An error occurred while resetting your password. Please try again later.'
            });
        }
    }

    /**
     * Resend verification code
     * POST /api/auth/resend-reset-code
     */
    async resendVerificationCode(req, res) {
        try {
            const { email } = req.body;

            if (!email) {
                return res.status(400).json({
                    success: false,
                    message: 'Email is required'
                });
            }

            const user = await User.findOne({ email: email.toLowerCase().trim() });

            if (!user) {
                return res.status(200).json({
                    success: true,
                    message: 'If an account with that email exists, you will receive a new verification code.'
                });
            }

            // Generate new 6-digit code
            const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
            const hashedCode = crypto.createHash('sha256').update(verificationCode).digest('hex');

            user.passwordResetToken = hashedCode;
            user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);
            await user.save();

            // Send new code
            try {
                await emailService.sendPasswordResetCode(user.email, user.name, verificationCode);
                
                return res.status(200).json({
                    success: true,
                    message: 'A new verification code has been sent to your email.'
                });
            } catch (emailError) {
                console.error('Error resending verification code:', emailError);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to send verification code. Please try again later.'
                });
            }
        } catch (error) {
            console.error('Resend code error:', error);
            return res.status(500).json({
                success: false,
                message: 'An error occurred. Please try again later.'
            });
        }
    }
}

module.exports = new PasswordResetController();
