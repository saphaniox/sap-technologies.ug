/**
 * Partnership Request Controller
 * 
 * Manages partnership and sponsorship requests from companies
 * interested in collaborating.
 * 
 * Features:
 * - Partnership request submission
 * - Status management (pending, reviewed, approved, rejected)
 * - Email notifications (admin and requester)
 * - WhatsApp notifications (optional)
 * - Admin notes and internal comments
 * - Request history tracking
 * - Batch operations (admin)
 * 
 * Notification System:
 * - Sends confirmation email to company contact
 * - Notifies admin of new partnership request
 * - Optional WhatsApp alerts to admin
 * 
 * Public Endpoints:
 * - POST /partnership-requests - Submit new request
 * 
 * Admin Endpoints:
 * - GET /admin/partnership-requests - List all requests
 * - GET /admin/partnership-requests/:id - Get single request
 * - PUT /admin/partnership-requests/:id - Update status
 * - DELETE /admin/partnership-requests/:id - Delete request
 * 
 * @module controllers/partnershipRequestController
 */

const { PartnershipRequest } = require("../models");
const { AppError } = require("../middleware/errorHandler");
const emailService = require("../services/emailService");
const whatsappService = require("../services/whatsappBaileysService"); // FREE WhatsApp

class PartnershipRequestController {
    // Submit partnership request
    async submitPartnershipRequest(req, res, next) {
        try {
            let { companyName, contactEmail, website, description, contactPerson } = req.body;

            // Auto-fill user data if logged in
            if (req.user) {
                contactEmail = contactEmail || req.user.email;
                contactPerson = contactPerson || `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email;
            }

            // Validation
            if (!companyName || !contactEmail || !description || !contactPerson) {
                return next(new AppError("Company name, contact email, description, and contact person are required", 400));
            }

            // Create partnership request record
            const partnershipRequest = new PartnershipRequest({
                companyName,
                contactEmail,
                website,
                description,
                contactPerson,
                user: req.user ? req.user._id : null,
                status: "pending"
            });

            await partnershipRequest.save();

            // Send notifications (don't wait for them to complete)
            const notificationPromises = [];

            // Send email notification to admin (works with Resend, SendGrid, or Gmail)
            if (emailService.isConfigured) {
                notificationPromises.push(
                    emailService.sendPartnershipNotification({
                        companyName,
                        contactEmail,
                        website,
                        description,
                        contactPerson
                    })
                    .catch(error => console.error("Admin partnership notification failed:", error))
                );
                
                // Send confirmation email to user
                notificationPromises.push(
                    emailService.sendPartnershipConfirmation({
                        companyName,
                        contactEmail,
                        website,
                        description,
                        contactPerson
                    })
                    .catch(error => console.error("User partnership confirmation failed:", error))
                );
            }

            // Send WhatsApp notification (FREE - Baileys)
            if (process.env.WHATSAPP_ENABLED === 'true') {
                notificationPromises.push(
                    whatsappService.sendPartnershipNotification({
                        companyName,
                        contactEmail,
                        website,
                        description,
                        contactPerson
                    })
                    .catch(error => console.error("WhatsApp notification failed:", error))
                );
            }

            // Execute notifications in background
            Promise.all(notificationPromises);

            res.status(201).json({
                status: "success",
                message: "Partnership request submitted successfully",
                autoFilled: !!req.user,
                data: {
                    partnershipRequest: {
                        id: partnershipRequest._id,
                        submittedAt: partnershipRequest.createdAt
                    }
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Get all partnership requests (admin only)
    async getAllPartnershipRequests(req, res, next) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const status = req.query.status;

            const query = {};
            if (status) {
                query.status = status;
            }

            const partnershipRequests = await PartnershipRequest.find(query)
                .sort({ createdAt: -1 })
                .limit(limit * 1)
                .skip((page - 1) * limit);

            const total = await PartnershipRequest.countDocuments(query);

            res.status(200).json({
                status: "success",
                data: {
                    partnershipRequests,
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

    // Get single partnership request (admin only)
    async getPartnershipRequest(req, res, next) {
        try {
            const partnershipRequest = await PartnershipRequest.findById(req.params.id);
            if (!partnershipRequest) {
                return next(new AppError("Partnership request not found", 404));
            }

            res.status(200).json({
                status: "success",
                data: {
                    partnershipRequest
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Update partnership request status (admin only)
    async updatePartnershipRequestStatus(req, res, next) {
        try {
            const { status, adminNotes } = req.body;
            const validStatuses = ["pending", "reviewed", "approved", "rejected"];

            if (!validStatuses.includes(status)) {
                return next(new AppError("Invalid status. Must be one of: pending, reviewed, approved, rejected", 400));
            }

            const updateData = { status };
            if (adminNotes !== undefined) {
                updateData.adminNotes = adminNotes;
            }

            const partnershipRequest = await PartnershipRequest.findByIdAndUpdate(
                req.params.id,
                updateData,
                { new: true, runValidators: true }
            );

            if (!partnershipRequest) {
                return next(new AppError("Partnership request not found", 404));
            }

            res.status(200).json({
                status: "success",
                message: "Partnership request status updated successfully",
                data: {
                    partnershipRequest
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Delete partnership request (admin only)
    async deletePartnershipRequest(req, res, next) {
        try {
            const partnershipRequest = await PartnershipRequest.findByIdAndDelete(req.params.id);
            if (!partnershipRequest) {
                return next(new AppError("Partnership request not found", 404));
            }

            res.status(200).json({
                status: "success",
                message: "Partnership request deleted successfully"
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new PartnershipRequestController();