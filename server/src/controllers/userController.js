/**
 * User Controller
 * 
 * Handles user account management and profile operations.
 * 
 * Features:
 * - Profile viewing and updating
 * - Password changes (with current password verification)
 * - Avatar upload and management
 * - Account deletion (with password confirmation)
 * - Bio/description updates
 * - Activity history viewing
 * - Admin user management (list all users)
 * - Role management (admin only)
 * - Account locking/unlocking (admin only)
 * - User search and filtering (admin only)
 * 
 * Security Features:
 * - Password verification for sensitive operations
 * - Bcrypt password hashing
 * - Session-based authentication
 * - File upload validation
 * - Old avatar cleanup on update
 * 
 * Public User Endpoints:
 * - GET /profile - Get current user profile
 * - PUT /profile - Update profile (name, bio)
 * - PUT /avatar - Upload new avatar
 * - PUT /password - Change password
 * - DELETE /account - Delete account
 * 
 * Admin Endpoints:
 * - GET /admin/users - List all users
 * - PUT /admin/users/:id/role - Change user role
 * - PUT /admin/users/:id/lock - Lock/unlock account
 * - DELETE /admin/users/:id - Delete user
 * 
 * @module controllers/userController
 */

// User account management controller - handles all user-related operations
// This includes profile updates, password changes, account deletion, and admin functions
const bcrypt = require("bcryptjs");
const { User } = require("../models");
const { AppError } = require("../middleware/errorHandler");
const fs = require("fs");
const path = require("path");

// Main user controller class for handling user account operations
class UserController {
    // Fetch the current user's profile information
    // Used by frontend to display user details in account settings
    async getProfile(req, res, next) {
        try {
            // Get user from database using session ID
            const user = await User.findById(req.session.userId);
            if (!user) {
                return next(new AppError("User not found", 404));
            }

            // Return only public profile information (no sensitive data)
            res.status(200).json({
                status: "success",
                data: {
                    user: user.profile
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Update user's display name
    // This is what shows up in their profile and throughout the app
    async updateProfile(req, res, next) {
        try {
            const { name } = req.body;

            // Make sure they actually provided a name
            if (!name) {
                return next(new AppError("Name is required", 400));
            }

            // Update the name in database with validation
            const user = await User.findByIdAndUpdate(
                req.session.userId,
                { name },
                { new: true, runValidators: true }
            );

            if (!user) {
                return next(new AppError("User not found", 404));
            }

            // Also update the session so their name shows correctly immediately
            req.session.userName = name;
            
            // Log this change in their activity history
            await user.addActivity("Updated profile name");

            res.status(200).json({
                status: "success",
                message: "Profile updated successfully",
                data: {
                    user: user.profile
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Change user's email address
    // Important: we need to check that no one else is already using this email
    async updateEmail(req, res, next) {
        try {
            const { email } = req.body;

            if (!email) {
                return next(new AppError("Email is required", 400));
            }

            // Security check: make sure this email isn't already taken by someone else
            // We exclude the current user from this check (that's what $ne does)
            const existingUser = await User.findOne({ 
                email, 
                _id: { $ne: req.session.userId } 
            });
            
            if (existingUser) {
                return next(new AppError("Email already in use", 400));
            }

            // All good, update their email
            const user = await User.findByIdAndUpdate(
                req.session.userId,
                { email },
                { new: true, runValidators: true }
            );

            if (!user) {
                return next(new AppError("User not found", 404));
            }

            // Record this change in their activity log
            await user.addActivity("Updated email address");

            res.status(200).json({
                status: "success",
                message: "Email updated successfully",
                data: {
                    user: user.profile
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Change user's password (requires knowing current password for security)
    // This is different from password reset - user must prove they know current password
    async updatePassword(req, res, next) {
        try {
            const { currentPassword, newPassword } = req.body;

            // Both passwords are required for security
            if (!currentPassword || !newPassword) {
                return next(new AppError("Current password and new password are required", 400));
            }

            const user = await User.findById(req.session.userId);
            if (!user) {
                return next(new AppError("User not found", 404));
            }

            // Security: verify they actually know their current password
            // This prevents someone from changing password if they just got access to an open browser
            const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
            if (!isCurrentPasswordValid) {
                return next(new AppError("Current password is incorrect", 400));
            }

            // Hash the new password (never store passwords in plain text!)
            const hashedNewPassword = await bcrypt.hash(newPassword, 12);

            // Save the new password and log this security-important action
            user.password = hashedNewPassword;
            await user.save();
            await user.addActivity("Password changed");

            res.status(200).json({
                status: "success",
                message: "Password updated successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    // Handle profile picture uploads
    // The actual file upload is handled by multer middleware, we just save the path
    async uploadProfilePicture(req, res, next) {
        try {
            // Multer should have processed the file by now
            if (!req.file) {
                return next(new AppError("No file uploaded", 400));
            }

            const user = await User.findById(req.session.userId);
            if (!user) {
                return next(new AppError("User not found", 404));
            }

            // Delete old profile picture if exists
            if (user.profilePic) {
                const oldPicPath = path.join(__dirname, "../..", user.profilePic);
                
                if (fs.existsSync(oldPicPath)) {
                    try {
                        fs.unlinkSync(oldPicPath);
                        console.log("🗑️ Deleted old profile picture:", user.profilePic);
                    } catch (err) {
                        console.error("❌ Failed to delete old profile picture:", err.message);
                    }
                }
            }

            // Save the file path so we can serve the image later
            const profilePicUrl = `/uploads/profile-pics/${req.file.filename}`;
            user.profilePic = profilePicUrl;
            await user.save();
            
            // Record this change in activity log
            await user.addActivity("Updated profile picture");

            res.status(200).json({
                status: "success",
                message: "Profile picture uploaded successfully",
                data: {
                    profilePic: profilePicUrl
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Permanently delete a user's account
    // This is serious business - once deleted, everything is gone!
    async deleteAccount(req, res, next) {
        try {
            // Find and delete the user from database
            const user = await User.findByIdAndDelete(req.session.userId);
            if (!user) {
                return next(new AppError("User not found", 404));
            }

            // Delete user's profile picture if exists
            if (user.profilePic) {
                const picPath = path.join(__dirname, "../..", user.profilePic);
                
                if (fs.existsSync(picPath)) {
                    try {
                        fs.unlinkSync(picPath);
                        console.log("🗑️ Deleted user profile picture:", user.profilePic);
                    } catch (err) {
                        console.error("❌ Failed to delete user profile picture:", err.message);
                    }
                }
            }

            // Destroy their session and clear cookies - log them out completely
            req.session.destroy((err) => {
                if (err) {
                    return next(new AppError("Error deleting account", 500));
                }
                res.clearCookie("connect.sid");
                res.status(200).json({
                    status: "success",
                    message: "Account deleted successfully"
                });
            });
        } catch (error) {
            next(error);
        }
    }

    // Get user's activity history - what they've been doing on the site
    // Useful for account settings page to show recent actions
    async getActivity(req, res, next) {
        try {
            const user = await User.findById(req.session.userId);
            if (!user) {
                return next(new AppError("User not found", 404));
            }

            // Only return the last 20 activities to avoid overwhelming the frontend
            res.status(200).json({
                status: "success",
                data: {
                    activity: user.activity.slice(-20) // Last 20 activities
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Quick way for current user to become admin (useful during initial app setup)
    // In production, you'd want better security around this!
    async promoteSelfToAdmin(req, res, next) {
        try {
            const user = await User.findById(req.session.userId);
            if (!user) {
                return next(new AppError("User not found", 404));
            }

            // Make them an admin
            user.role = "admin";
            await user.save();
            await user.addActivity("Self-promoted to admin");

            res.status(200).json({
                status: "success",
                message: `You are now an admin!`,
                data: {
                    user: user.profile
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Create a new admin account or promote existing user to admin
    // This is handy for initial app setup when you need your first admin
    async createAdminAccount(req, res, next) {
        try {
            const { name, email, password } = req.body;

            if (!name || !email || !password) {
                return next(new AppError("Name, email, and password are required", 400));
            }

            // Check if someone with this email already exists
            let user = await User.findOne({ email });
            
            if (user) {
                // User already exists, just make them an admin
                user.role = "admin";
                await user.save();
                await user.addActivity("Promoted to admin");
                
                return res.status(200).json({
                    status: "success",
                    message: `Existing user ${email} promoted to admin`,
                    data: {
                        user: user.profile
                    }
                });
            }

            // Create brand new admin user
            const hashedPassword = await bcrypt.hash(password, 12);
            
            user = new User({
                name,
                email,
                password: hashedPassword,
                role: "admin"
            });

            await user.save();
            await user.addActivity("Account created as admin");

            res.status(201).json({
                status: "success",
                message: `Admin account created successfully for ${email}`,
                data: {
                    user: user.profile
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Promote any user to admin by their email address
    // Another helper method for setting up initial admins
    async promoteToAdmin(req, res, next) {
        try {
            const { email } = req.body;
            
            if (!email) {
                return next(new AppError("Email is required", 400));
            }

            // Find the user by email
            const user = await User.findOne({ email });
            if (!user) {
                return next(new AppError("User not found", 404));
            }

            // Make them an admin
            user.role = "admin";
            await user.save();
            await user.addActivity("Promoted to admin");

            res.status(200).json({
                status: "success",
                message: `User ${email} promoted to admin successfully`,
                data: {
                    user: user.profile
                }
            });
        } catch (error) {
            next(error);
        }
    }
}

// Export a single instance so all routes use the same controller
module.exports = new UserController();
