/**
 * Authentication Controller
 * 
 * Handles all user authentication operations including:
 * - User registration with email verification
 * - Login with password verification
 * - Logout and session management
 * - Activity logging for security
 * - Email notifications for auth events
 * 
 * @module controllers/authController
 */

const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const emailService = require('../services/emailService');

/**
 * Authentication Controller Class
 * Contains methods for user authentication operations
 */
class AuthController {
    // Handle new user registration
    async register(req, res, next) {
        try {
            // Extract user details from request
            const { name, email, password } = req.body;
            
            // Basic validation - make sure we have all required fields
            if (!name || !email || !password) {
                return next(new AppError('All fields are required', 400));
            }
            
            // Check if someone already registered with this email
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return next(new AppError('Email already registered', 400));
            }
            
            // Hash the password for security (never store plain text passwords!)
            const hashedPassword = await bcrypt.hash(password, 12);
            
            // Create and save the new user
            const user = new User({ name, email, password: hashedPassword });
            await user.save();
            
            // Log this registration in user's activity history
            // We wrap this in try-catch so registration doesn't fail if activity logging fails
            try {
                await user.addActivity('Account created');
            } catch (activityError) {
                console.error('Failed to log activity:', activityError);
                // Don't fail the whole registration just because activity logging failed
            }
            
            // Send signup notifications (don't wait for them to complete)
            const notificationPromises = [];
            
            // Send welcome email to the new user (works with Resend, SendGrid, or Gmail)
            if (emailService.isConfigured) {
                notificationPromises.push(
                    emailService.sendUserSignupNotification({ 
                        name, 
                        email, 
                        id: user._id 
                    })
                    .catch(error => console.error("User signup notification failed:", error))
                );
                
                // Send alert to admin about new user
                notificationPromises.push(
                    emailService.sendAdminUserSignupAlert({ 
                        name, 
                        email, 
                        id: user._id 
                    })
                    .catch(error => console.error("Admin signup alert failed:", error))
                );
            }
            
            // Execute notifications in background
            Promise.all(notificationPromises);
            
            // Send success response with user profile info
            res.status(201).json({
                status: 'success',
                message: 'User registered successfully',
                data: { user: user.profile }
            });
        } catch (error) {
            next(error);
        }
    }

    // Handle user login
    async login(req, res, next) {
        try {
            // Get login credentials from request
            const { email, password } = req.body;
            
            // Make sure both email and password were provided
            if (!email || !password) {
                return next(new AppError('Email and password are required', 400));
            }
            
            // Find user by email (only active users can login)
            const user = await User.findOne({ email, isActive: true });
            if (!user) {
                return next(new AppError('Invalid credentials', 401));
            }
            
            // Verify the password matches what we have stored
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return next(new AppError('Invalid credentials', 401));
            }
            
            // Update user's login tracking info
            user.lastLogin = new Date();
            user.loginCount = (user.loginCount || 0) + 1;
            
            // Create user session - this is what keeps them logged in
            req.session.userId = user._id;
            req.session.userName = user.name;
            
            // Explicitly save session before sending response
            await new Promise((resolve, reject) => {
                req.session.save((err) => {
                    if (err) {
                        console.error('Session save error:', err);
                        reject(err);
                    } else {
                        console.log('✅ Session saved successfully. userId:', req.session.userId);
                        resolve();
                    }
                });
            });
            
            // Save the updated user info to database
            await user.save();
            
            // Record this login in their activity log
            // Again, we don't want login to fail just because activity logging fails
            try {
                await user.addActivity('Logged in');
            } catch (activityError) {
                console.error('Failed to log login activity:', activityError);
            }
            
            // Send success response with user info
            res.status(200).json({
                status: 'success',
                message: 'Login successful',
                data: { user: user.profile, name: user.name }
            });
        } catch (error) {
            next(error);
        }
    }

    // Handle user logout
    async logout(req, res, next) {
        try {
            // If user has an active session, log their logout activity
            if (req.session.userId) {
                const user = await User.findById(req.session.userId);
                if (user) {
                    await user.addActivity('Logged out');
                }
            }
            
            // Destroy the session - this logs them out
            req.session.destroy((err) => {
                if (err) {
                    return next(new AppError('Could not log out, please try again', 500));
                }
                
                // Clear the session cookie from their browser
                res.clearCookie('connect.sid');
                
                // Send success response
                res.status(200).json({
                    status: 'success',
                    message: 'Logged out successfully'
                });
            });
        } catch (error) {
            next(error);
        }
    }

    // Get current logged-in user's info
    async getCurrentUser(req, res, next) {
        try {
            // Find the user based on session
            const user = await User.findById(req.session.userId);
            if (!user) {
                return next(new AppError('User not found', 404));
            }
            
            // Return user profile information
            res.status(200).json({
                status: 'success',
                data: { user: user.profile }
            });
        } catch (error) {
            next(error);
        }
    }

    // Check if user is authenticated (used by frontend to verify login status)
    async checkAuth(req, res, next) {
        try {
            // No session = not logged in
            if (!req.session.userId) {
                return res.status(401).json({
                    status: 'fail',
                    message: 'Not authenticated'
                });
            }
            
            // Check if user still exists and is active
            const user = await User.findById(req.session.userId);
            if (!user || !user.isActive) {
                return res.status(401).json({
                    status: 'fail',
                    message: 'User not found or inactive'
                });
            }
            
            // All good - user is authenticated
            res.status(200).json({
                status: 'success',
                data: { user: user.profile }
            });
        } catch (error) {
            next(error);
        }
    }
}

// Export a single instance of the controller
// This way all routes use the same controller instance
module.exports = new AuthController();
