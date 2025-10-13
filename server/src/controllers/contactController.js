/**
 * Contact Controller
 * 
 * Manages contact form submissions and notifications.
 * Features:
 * - Process contact form submissions
 * - Store contact data with metadata (IP, user agent)
 * - Send email notifications to admin and user
 * - Send WhatsApp alerts for urgent contacts
 * - Retrieve and manage contact submissions
 * 
 * @module controllers/contactController
 */

const { Contact } = require("../models");
const { AppError } = require("../middleware/errorHandler");
const emailService = require("../services/emailService");
const whatsappService = require("../services/whatsappBaileysService"); // FREE WhatsApp

/**
 * Contact Controller Class
 * Handles all contact form operations
 */
class ContactController {
    // Submit contact form
    async submitContact(req, res, next) {
        try {
            let { name, email, message } = req.body;

            // Auto-fill user data if logged in
            if (req.user) {
                // If user is logged in, use their info (they can still override)
                name = name || `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email;
                email = email || req.user.email;
                
                // Add user reference
                req.body.user = req.user._id;
            }

            // Validation
            if (!name || !email || !message) {
                return next(new AppError("All fields are required", 400));
            }

            // Create contact record
            const contact = new Contact({
                name,
                email,
                message,
                user: req.body.user, // Link to user if logged in
                ipAddress: req.ip || req.connection.remoteAddress,
                userAgent: req.get("User-Agent")
            });

            await contact.save();

            // Send notifications (don't wait for them to complete)
            const notificationPromises = [];

            // Send email notification to admin
            if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
                notificationPromises.push(
                    emailService.sendContactNotification({ name, email, message })
                        .catch(error => console.error("Admin email notification failed:", error))
                );
                
                // Send confirmation email to user
                notificationPromises.push(
                    emailService.sendContactConfirmation({ name, email, message })
                        .catch(error => console.error("User confirmation email failed:", error))
                );
            }

            // Send WhatsApp notification (FREE - Baileys)
            if (process.env.WHATSAPP_ENABLED === 'true') {
                notificationPromises.push(
                    whatsappService.sendContactNotification({ name, email, message })
                        .catch(error => console.error("WhatsApp notification failed:", error))
                );
            }

            // Execute notifications in background
            Promise.all(notificationPromises);

            res.status(201).json({
                status: "success",
                message: "Contact form submitted successfully",
                data: {
                    contact: {
                        id: contact._id,
                        submittedAt: contact.submittedAt
                    }
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Get all contacts (admin only)
    async getAllContacts(req, res, next) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const status = req.query.status;

            const query = {};
            if (status) {
                query.status = status;
            }

            const contacts = await Contact.find(query)
                .sort({ submittedAt: -1 })
                .limit(limit * 1)
                .skip((page - 1) * limit);

            const total = await Contact.countDocuments(query);

            res.status(200).json({
                status: "success",
                data: {
                    contacts,
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

    // Get single contact (admin only)
    async getContact(req, res, next) {
        try {
            const contact = await Contact.findById(req.params.id);
            if (!contact) {
                return next(new AppError("Contact not found", 404));
            }

            res.status(200).json({
                status: "success",
                data: {
                    contact
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Update contact status (admin only)
    async updateContactStatus(req, res, next) {
        try {
            const { status } = req.body;
            const validStatuses = ["pending", "read", "replied", "archived"];

            if (!validStatuses.includes(status)) {
                return next(new AppError("Invalid status", 400));
            }

            const contact = await Contact.findByIdAndUpdate(
                req.params.id,
                { status },
                { new: true, runValidators: true }
            );

            if (!contact) {
                return next(new AppError("Contact not found", 404));
            }

            res.status(200).json({
                status: "success",
                message: "Contact status updated successfully",
                data: {
                    contact
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Delete contact (admin only)
    async deleteContact(req, res, next) {
        try {
            const contact = await Contact.findByIdAndDelete(req.params.id);
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
}

module.exports = new ContactController();
