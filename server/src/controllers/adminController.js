/**
 * Admin Controller
 * 
 * Handles all administrative functions including dashboard statistics,
 * user management, content management, and system monitoring.
 * 
 * Features:
 * - Dashboard statistics (users, contacts, newsletters, services, projects)
 * - User management (list, create, update, delete, role changes)
 * - Growth metrics (30-day activity tracking)
 * - Recent activity monitoring
 * - Content overview (featured services, completed projects)
 * - Administrative reports and insights
 * 
 * Access Control:
 * - All methods require admin or superadmin role
 * - Protected by authentication middleware
 * - Role-based permission checks
 * 
 * @module controllers/adminController
 */

// Admin panel controller - handles all administrative functions
// This is where admins manage users, content, and get system insights
const { User, Contact, Newsletter, Service, Project } = require("../models");
const { AppError } = require("../middleware/errorHandler");

// Main admin controller for managing the application
class AdminController {
    // Get comprehensive dashboard statistics for admin overview
    // This gives admins a bird's eye view of what's happening in the app
    async getDashboardStats(req, res, next) {
        try {
            // Count all the important stuff in our database
            const totalUsers = await User.countDocuments();
            const totalAdmins = await User.countDocuments({ role: "admin" });
            const totalContacts = await Contact.countDocuments();
            const totalNewsletterSubscribers = await Newsletter.countDocuments();
            const totalServices = await Service.countDocuments();
            const totalProjects = await Project.countDocuments();
            const featuredServices = await Service.countDocuments({ featured: true });
            const completedProjects = await Project.countDocuments({ status: "completed" });
            
            // Get the 5 most recent users for the "Recent Activity" section
            const recentUsers = await User.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .select("name email createdAt role loginCount");

            // Calculate growth metrics - how many new users/contacts in last 30 days
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            const newUsersLast30Days = await User.countDocuments({
                createdAt: { $gte: thirtyDaysAgo }
            });

            const newContactsLast30Days = await Contact.countDocuments({
                createdAt: { $gte: thirtyDaysAgo }
            });

            res.status(200).json({
                status: "success",
                data: {
                    stats: {
                        totalUsers,
                        totalAdmins,
                        totalContacts,
                        totalNewsletterSubscribers,
                        totalServices,
                        totalProjects,
                        featuredServices,
                        completedProjects,
                        newUsersLast30Days,
                        newContactsLast30Days
                    },
                    recentUsers
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Get all users with pagination
    async getAllUsers(req, res, next) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const search = req.query.search || "";
            const role = req.query.role || "";

            const query = {};
            if (search) {
                query.$or = [
                    { name: { $regex: search, $options: "i" } },
                    { email: { $regex: search, $options: "i" } }
                ];
            }
            if (role) {
                query.role = role;
            }

            const total = await User.countDocuments(query);
            const users = await User.find(query)
                .select("-password")
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip((page - 1) * limit);

            res.status(200).json({
                status: "success",
                data: {
                    users,
                    pagination: {
                        currentPage: page,
                        totalPages: Math.ceil(total / limit),
                        totalUsers: total,
                        hasNextPage: page < Math.ceil(total / limit),
                        hasPrevPage: page > 1
                    }
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Update user role
    async updateUserRole(req, res, next) {
        try {
            const { userId } = req.params;
            const { role } = req.body;

            if (!["user", "admin"].includes(role)) {
                return next(new AppError('Invalid role. Must be "user" or "admin"', 400));
            }

            const user = await User.findByIdAndUpdate(
                userId,
                { role },
                { new: true, runValidators: true }
            ).select("-password");

            if (!user) {
                return next(new AppError("User not found", 404));
            }

            await user.addActivity(`Role changed to ${role} by admin`);

            res.status(200).json({
                status: "success",
                message: `User role updated to ${role}`,
                data: { user }
            });
        } catch (error) {
            next(error);
        }
    }

    // Delete user
    async deleteUser(req, res, next) {
        try {
            const { userId } = req.params;

            // Prevent admin from deleting themselves
            if (userId === req.session.userId) {
                return next(new AppError("You cannot delete your own account", 400));
            }

            const user = await User.findByIdAndDelete(userId);
            if (!user) {
                return next(new AppError("User not found", 404));
            }

            res.status(200).json({
                status: "success",
                message: "User deleted successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    // Get all contacts with pagination
    async getAllContacts(req, res, next) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const search = req.query.search || "";
            const status = req.query.status || "";

            const query = {};
            if (search) {
                query.$or = [
                    { name: { $regex: search, $options: "i" } },
                    { email: { $regex: search, $options: "i" } },
                    { message: { $regex: search, $options: "i" } }
                ];
            }
            if (status) {
                query.status = status;
            }

            const total = await Contact.countDocuments(query);
            const contacts = await Contact.find(query)
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip((page - 1) * limit);

            res.status(200).json({
                status: "success",
                data: {
                    contacts,
                    pagination: {
                        currentPage: page,
                        totalPages: Math.ceil(total / limit),
                        totalContacts: total,
                        hasNextPage: page < Math.ceil(total / limit),
                        hasPrevPage: page > 1
                    }
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Update contact status
    async updateContactStatus(req, res, next) {
        try {
            const { contactId } = req.params;
            const { status } = req.body;

            // Allow: pending, read, replied, archived
            if (!["pending", "read", "replied", "responded", "archived"].includes(status)) {
                return next(new AppError("Invalid status", 400));
            }

            const contact = await Contact.findByIdAndUpdate(
                contactId,
                { status },
                { new: true, runValidators: true }
            );

            if (!contact) {
                return next(new AppError("Contact not found", 404));
            }

            res.status(200).json({
                status: "success",
                message: `Contact status updated to ${status}`,
                data: { contact }
            });
        } catch (error) {
            next(error);
        }
    }

    // Delete contact
    async deleteContact(req, res, next) {
        try {
            const { contactId } = req.params;

            const contact = await Contact.findByIdAndDelete(contactId);
            if (!contact) {
                return next(new AppError("Contact not found", 404));
            }

            res.status(200).json({
                status: "success",
                message: "Contact deleted successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    // Get all newsletter subscribers
    async getAllNewsletterSubscribers(req, res, next) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const search = req.query.search || "";

            const query = {};
            if (search) {
                query.email = { $regex: search, $options: "i" };
            }

            const total = await Newsletter.countDocuments(query);
            const subscribers = await Newsletter.find(query)
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip((page - 1) * limit);

            res.status(200).json({
                status: "success",
                data: {
                    subscribers,
                    pagination: {
                        currentPage: page,
                        totalPages: Math.ceil(total / limit),
                        totalSubscribers: total,
                        hasNextPage: page < Math.ceil(total / limit),
                        hasPrevPage: page > 1
                    }
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Delete newsletter subscriber
    async deleteNewsletterSubscriber(req, res, next) {
        try {
            const { subscriberId } = req.params;

            const subscriber = await Newsletter.findByIdAndDelete(subscriberId);
            if (!subscriber) {
                return next(new AppError("Subscriber not found", 404));
            }

            res.status(200).json({
                status: "success",
                message: "Newsletter subscriber deleted successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    // System health check
    async getSystemHealth(req, res, next) {
        try {
            const dbStatus = require("mongoose").connection.readyState === 1 ? "connected" : "disconnected";
            const uptime = process.uptime();
            const memoryUsage = process.memoryUsage();

            res.status(200).json({
                status: "success",
                data: {
                    system: {
                        uptime: Math.floor(uptime),
                        database: dbStatus,
                        memory: {
                            used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
                            total: Math.round(memoryUsage.heapTotal / 1024 / 1024)
                        },
                        nodeVersion: process.version,
                        platform: process.platform
                    }
                }
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AdminController();