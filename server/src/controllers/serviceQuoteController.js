/**
 * Service Quote Controller
 * 
 * Manages customer quote requests for services offered by the company.
 * 
 * Features:
 * - Quote request submission
 * - Service reference (optional for default services)
 * - Customer information collection
 * - Project details capture
 * - Budget and timeline preferences
 * - Contact preference handling (email, phone, both)
 * - Email notifications (customer and admin)
 * - Status tracking (new, contacted, quoted, accepted, rejected, expired)
 * - Admin notes and follow-up
 * - Metadata tracking (IP, user agent, timestamps)
 * 
 * Budget Options:
 * - < $5,000 | $5,000-$10,000 | $10,000-$25,000
 * - $25,000-$50,000 | > $50,000 | Not sure
 * 
 * Timeline Options:
 * - ASAP | 1-2 weeks | 1 month | 2-3 months | 3+ months | Flexible
 * 
 * Notification System:
 * - Confirmation email to customer with quote details
 * - Alert email to admin with full request information
 * 
 * @module controllers/serviceQuoteController
 */

const { ServiceQuote, Service } = require("../models");
const emailService = require("../services/emailService");

class ServiceQuoteController {
  // Create a new service quote request
  static async createQuote(req, res) {
    try {
      let { 
        serviceId, 
        serviceName,
        customerName,
        customerEmail, 
        customerPhone, 
        companyName,
        preferredContact, 
        projectDetails,
        budget,
        timeline
      } = req.body;

      // Auto-fill user data if logged in
      if (req.user) {
        customerName = customerName || `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email;
        customerEmail = customerEmail || req.user.email;
        customerPhone = customerPhone || req.user.phone || "";
      }

      console.log("📬 New service quote request received");
      console.log("Service ID:", serviceId);
      console.log("Service Name:", serviceName);
      console.log("Customer Email:", customerEmail);
      console.log("Auto-filled:", !!req.user);

      // Validate required fields
      if (!serviceId || !serviceName || !customerName || !customerEmail) {
        return res.status(400).json({
          success: false,
          message: "Service ID, name, and email are required"
        });
      }

      // Try to get service details from database (for API services)
      // If not found, use the provided serviceName (for frontend default services)
      let service = null;
      let serviceCategory = "General";
      
      // Check if serviceId is a valid MongoDB ObjectId before querying
      const mongoose = require('mongoose');
      if (mongoose.Types.ObjectId.isValid(serviceId) && serviceId.length === 24) {
        try {
          service = await Service.findById(serviceId);
          if (service) {
            serviceCategory = service.category || "General";
          }
        } catch (err) {
          console.log("ℹ️ Error finding service in database:", err.message);
        }
      } else {
        console.log("ℹ️ Service ID is not a MongoDB ObjectId, treating as frontend service");
      }

      // Create quote request
      const quote = new ServiceQuote({
        service: service ? serviceId : null,
        serviceName: serviceName,
        customerName: customerName.trim(),
        customerEmail: customerEmail.toLowerCase().trim(),
        customerPhone: customerPhone?.trim() || "",
        companyName: companyName?.trim() || "",
        preferredContact: preferredContact || "email",
        projectDetails: projectDetails?.trim() || "",
        budget: budget || "Not sure",
        timeline: timeline || "Flexible",
        user: req.user ? req.user._id : null,
        metadata: {
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.headers["user-agent"],
          createdAt: new Date()
        }
      });

      await quote.save();

      console.log("✅ Quote request saved to database:", quote._id);

      // Send email notifications (non-blocking)
      setImmediate(async () => {
        try {
          // 1. Send notification to admin
          await emailService.sendServiceQuoteToAdmin({
            serviceName: serviceName,
            serviceCategory: serviceCategory,
            customerName: quote.customerName,
            customerEmail: quote.customerEmail,
            customerPhone: quote.customerPhone || "Not provided",
            companyName: quote.companyName || "Not provided",
            preferredContact: quote.preferredContact,
            projectDetails: quote.projectDetails || "No details provided",
            budget: quote.budget,
            timeline: quote.timeline,
            quoteDate: quote.createdAt
          });

          console.log("✅ Admin notification email sent");

          // 2. Send confirmation to customer
          await emailService.sendServiceQuoteConfirmation({
            customerName: quote.customerName,
            customerEmail: quote.customerEmail,
            serviceName: serviceName,
            projectDetails: quote.projectDetails
          });

          console.log("✅ Customer confirmation email sent");
        } catch (emailError) {
          console.error("❌ Error sending quote emails:", emailError);
        }
      });

      res.status(201).json({
        success: true,
        message: "Quote request submitted successfully! We'll get back to you soon.",
        autoFilled: !!req.user,
        data: {
          quoteId: quote._id,
          serviceName: serviceName
        }
      });
    } catch (error) {
      console.error("❌ Create quote error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to submit quote request. Please try again.",
        error: error.message
      });
    }
  }

  // Get all quote requests (admin)
  static async getAllQuotes(req, res) {
    try {
      const { status, serviceId, page = 1, limit = 20 } = req.query;

      let query = {};
      if (status) query.status = status;
      if (serviceId) query.service = serviceId;

      const quotes = await ServiceQuote.find(query)
        .populate("service", "name category")
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));

      const total = await ServiceQuote.countDocuments(query);

      res.status(200).json({
        success: true,
        data: {
          quotes,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });
    } catch (error) {
      console.error("❌ Get quotes error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch quotes",
        error: error.message
      });
    }
  }

  // Update quote status (admin)
  static async updateQuoteStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, adminNotes } = req.body;

      const quote = await ServiceQuote.findById(id);
      if (!quote) {
        return res.status(404).json({
          success: false,
          message: "Quote not found"
        });
      }

      if (status) quote.status = status;
      if (adminNotes !== undefined) quote.adminNotes = adminNotes;
      
      if (status === "contacted" && !quote.metadata.respondedAt) {
        quote.metadata.respondedAt = new Date();
      }

      await quote.save();

      res.status(200).json({
        success: true,
        message: "Quote updated successfully",
        data: quote
      });
    } catch (error) {
      console.error("❌ Update quote error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update quote",
        error: error.message
      });
    }
  }

  // Delete quote (admin)
  static async deleteQuote(req, res) {
    try {
      const { id } = req.params;

      const quote = await ServiceQuote.findByIdAndDelete(id);
      if (!quote) {
        return res.status(404).json({
          success: false,
          message: "Quote not found"
        });
      }

      res.status(200).json({
        success: true,
        message: "Quote deleted successfully"
      });
    } catch (error) {
      console.error("❌ Delete quote error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete quote",
        error: error.message
      });
    }
  }

  // Get quote statistics (admin)
  static async getQuoteStats(req, res) {
    try {
      const stats = await ServiceQuote.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 }
          }
        }
      ]);

      const totalQuotes = await ServiceQuote.countDocuments();
      const recentQuotes = await ServiceQuote.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select("customerName serviceName status createdAt");

      res.status(200).json({
        success: true,
        data: {
          totalQuotes,
          byStatus: stats,
          recent: recentQuotes
        }
      });
    } catch (error) {
      console.error("❌ Get quote stats error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch statistics",
        error: error.message
      });
    }
  }
}

module.exports = ServiceQuoteController;
