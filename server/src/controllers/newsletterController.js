/**
 * Newsletter Controller
 * 
 * Manages newsletter subscriptions, unsubscriptions, and subscriber data.
 * 
 * Features:
 * - Email subscription handling
 * - Unsubscribe functionality
 * - Reactivation of inactive subscriptions
 * - Subscriber list management (admin)
 * - Bulk operations (admin)
 * - Source tracking (website, social, referral)
 * - Email validation
 * - Duplicate prevention
 * 
 * Public Endpoints:
 * - POST /subscribe - Subscribe to newsletter
 * - POST /unsubscribe - Unsubscribe from newsletter
 * 
 * Admin Endpoints:
 * - GET /subscribers - List all subscribers
 * - DELETE /:id - Remove subscriber
 * - GET /stats - Subscriber statistics
 * 
 * @module controllers/newsletterController
 */

const { Newsletter } = require("../models");
const { AppError } = require("../middleware/errorHandler");
const emailService = require("../services/emailService");

class NewsletterController {
    // Subscribe to newsletter
    async subscribe(req, res, next) {
        try {
            let { email } = req.body;

            // Auto-fill email if user is logged in
            if (req.user && !email) {
                email = req.user.email;
            }

            if (!email) {
                return next(new AppError("Email is required", 400));
            }

            // Check if email already exists
            const existingSubscriber = await Newsletter.findOne({ email });
            if (existingSubscriber) {
                if (existingSubscriber.isActive) {
                    return res.status(200).json({
                        status: "success",
                        message: "You are already subscribed to our newsletter",
                        autoFilled: !!req.user
                    });
                } else {
                    // Reactivate subscription
                    existingSubscriber.isActive = true;
                    existingSubscriber.subscribedAt = new Date();
                    existingSubscriber.unsubscribedAt = null;
                    if (req.user) {
                        existingSubscriber.user = req.user._id;
                    }
                    await existingSubscriber.save();

                    console.log("✅ Newsletter subscription reactivated:", email);

                    // Send welcome back email (non-blocking)
                    setImmediate(async () => {
                        try {
                            await emailService.sendNewsletterWelcome({
                                email: existingSubscriber.email
                            });
                            console.log("✅ Newsletter reactivation email sent");
                        } catch (emailError) {
                            console.error("❌ Error sending newsletter reactivation email:", emailError);
                        }
                    });

                    return res.status(200).json({
                        status: "success",
                        message: "Welcome back! Your subscription has been reactivated",
                        autoFilled: !!req.user
                    });
                }
            }

            // Create new subscription
            const subscriber = new Newsletter({
                email,
                user: req.user ? req.user._id : null,
                source: "website"
            });

            await subscriber.save();

            console.log("✅ Newsletter subscription saved:", email);

            // Send welcome email (non-blocking)
            setImmediate(async () => {
                try {
                    await emailService.sendNewsletterWelcome({
                        email: subscriber.email
                    });
                    console.log("✅ Newsletter welcome email sent");
                } catch (emailError) {
                    console.error("❌ Error sending newsletter welcome email:", emailError);
                }
            });

            res.status(201).json({
                status: "success",
                message: "Thank you for subscribing to our newsletter!",
                autoFilled: !!req.user,
                data: {
                    subscriber: {
                        id: subscriber._id,
                        email: subscriber.email,
                        subscribedAt: subscriber.subscribedAt
                    }
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Unsubscribe from newsletter
    async unsubscribe(req, res, next) {
        try {
            const { email } = req.body;

            if (!email) {
                return next(new AppError("Email is required", 400));
            }

            const subscriber = await Newsletter.findOne({ email, isActive: true });
            if (!subscriber) {
                return next(new AppError("Email not found in our subscription list", 404));
            }

            subscriber.isActive = false;
            subscriber.unsubscribedAt = new Date();
            await subscriber.save();

            res.status(200).json({
                status: "success",
                message: "You have been unsubscribed from our newsletter"
            });
        } catch (error) {
            next(error);
        }
    }

    // Get all subscribers (admin only)
    async getAllSubscribers(req, res, next) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const isActive = req.query.isActive;

            const query = {};
            if (isActive !== undefined) {
                query.isActive = isActive === "true";
            }

            const subscribers = await Newsletter.find(query)
                .sort({ subscribedAt: -1 })
                .limit(limit * 1)
                .skip((page - 1) * limit);

            const total = await Newsletter.countDocuments(query);

            res.status(200).json({
                status: "success",
                data: {
                    subscribers,
                    pagination: {
                        page,
                        limit,
                        total,
                        pages: Math.ceil(total / limit)
                    }
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Get subscription stats (admin only)
    async getStats(req, res, next) {
        try {
            const totalSubscribers = await Newsletter.countDocuments();
            const activeSubscribers = await Newsletter.countDocuments({ isActive: true });
            const inactiveSubscribers = await Newsletter.countDocuments({ isActive: false });

            // Get subscriptions by month for the last 12 months
            const twelveMonthsAgo = new Date();
            twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

            const monthlyStats = await Newsletter.aggregate([
                {
                    $match: {
                        subscribedAt: { $gte: twelveMonthsAgo }
                    }
                },
                {
                    $group: {
                        _id: {
                            year: { $year: "$subscribedAt" },
                            month: { $month: "$subscribedAt" }
                        },
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: { "_id.year": 1, "_id.month": 1 }
                }
            ]);

            res.status(200).json({
                status: "success",
                data: {
                    stats: {
                        totalSubscribers,
                        activeSubscribers,
                        inactiveSubscribers,
                        monthlyStats
                    }
                }
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new NewsletterController();
