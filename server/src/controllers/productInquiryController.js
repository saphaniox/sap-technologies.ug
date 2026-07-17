const { ProductInquiry, Product } = require("../models");
const emailService = require("../services/emailService");

class ProductInquiryController {
  // Create a new product inquiry
  static async createInquiry(req, res) {
    try {
      let { productId, customerEmail, customerPhone, preferredContact, message } = req.body;

      // Auto-fill user data if logged in
      if (req.user) {
        customerEmail = customerEmail || req.user.email;
        customerPhone = customerPhone || req.user.phone || "";
      }

      console.log("📬 New product inquiry received");
      console.log("Product ID:", productId);
      console.log("Customer Email:", customerEmail);
      console.log("Auto-filled:", !!req.user);

      // Validate required fields
      if (!productId || !customerEmail) {
        return res.status(400).json({
          success: false,
          message: "Product ID and email are required"
        });
      }

      // Get product details
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found"
        });
      }

      // Create inquiry
      const inquiry = new ProductInquiry({
        product: productId,
        productName: product.name,
        customerEmail: customerEmail.toLowerCase().trim(),
        customerPhone: customerPhone?.trim() || "",
        preferredContact: preferredContact || "email",
        message: message?.trim() || "",
        user: req.user ? req.user._id : null,
        metadata: {
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.headers["user-agent"],
          createdAt: new Date()
        }
      });

      await inquiry.save();

      console.log("✅ Inquiry saved to database:", inquiry._id);

      // Send email notifications (non-blocking)
      setImmediate(async () => {
        try {
          // 1. Send notification to admin
          await emailService.sendProductInquiryToAdmin({
            productName: product.name,
            productCategory: product.category,
            customerEmail: inquiry.customerEmail,
            customerPhone: inquiry.customerPhone || "Not provided",
            preferredContact: inquiry.preferredContact,
            message: inquiry.message || "No additional message",
            inquiryDate: inquiry.createdAt
          });

          console.log("✅ Admin notification email sent");

          // 2. Send confirmation to customer
          await emailService.sendProductInquiryConfirmation({
            customerEmail: inquiry.customerEmail,
            productName: product.name,
            message: inquiry.message
          });

          console.log("✅ Customer confirmation email sent");
        } catch (emailError) {
          console.error("❌ Error sending inquiry emails:", emailError);
        }
      });

      res.status(201).json({
        success: true,
        message: "Inquiry submitted successfully! We'll get back to you soon.",
        autoFilled: !!req.user,
        data: {
          inquiryId: inquiry._id,
          productName: product.name
        }
      });
    } catch (error) {
      console.error("❌ Create inquiry error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to submit inquiry. Please try again.",
        error: error.message
      });
    }
  }

  // Create cart inquiry (multiple products in one submission)
  static async createCartInquiry(req, res) {
    try {
      const {
        items,
        customerName,
        customerEmail,
        customerPhone,
        preferredContact,
        message
      } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, message: "Cart items are required." });
      }
      if (!customerEmail) {
        return res.status(400).json({ success: false, message: "Email is required." });
      }

      const normalizedEmail = customerEmail.toLowerCase().trim();
      const namePrefix = customerName ? `Name: ${customerName.trim()}\n` : "";

      // Create one ProductInquiry per cart item
      const savedInquiries = [];
      for (const item of items) {
        const { productId, productName, quantity, price } = item;
        if (!productId) continue;

        const combinedMessage = `${namePrefix}Quantity requested: ${quantity || 1}\n${message ? `\nCustomer message:\n${message.trim()}` : ""}`.trim();

        const inquiry = new ProductInquiry({
          product: productId,
          productName: productName || "Unknown Product",
          customerEmail: normalizedEmail,
          customerPhone: customerPhone?.trim() || "",
          preferredContact: preferredContact || "email",
          message: combinedMessage,
          user: req.user ? req.user._id : null,
          metadata: {
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.headers["user-agent"],
            source: "cart",
            createdAt: new Date()
          }
        });

        await inquiry.save();
        savedInquiries.push({ ...item, inquiryId: inquiry._id });
      }

      console.log(`✅ Cart inquiry saved — ${savedInquiries.length} item(s) for ${normalizedEmail}`);

      // Send combined emails (non-blocking)
      setImmediate(async () => {
        try {
          await emailService.sendCartInquiryToAdmin({
            items: savedInquiries,
            customerName: customerName || "Guest",
            customerEmail: normalizedEmail,
            customerPhone: customerPhone || "Not provided",
            preferredContact: preferredContact || "email",
            message: message || ""
          });
          console.log("✅ Admin cart inquiry email sent");

          await emailService.sendCartInquiryConfirmation({
            customerEmail: normalizedEmail,
            customerName: customerName || "Valued Customer",
            items: savedInquiries
          });
          console.log("✅ Customer cart confirmation email sent");
        } catch (emailError) {
          console.error("❌ Cart inquiry email error:", emailError);
        }
      });

      res.status(201).json({
        success: true,
        message: "Your enquiry has been submitted! We'll get back to you within 24–48 hours.",
        data: { count: savedInquiries.length }
      });
    } catch (error) {
      console.error("❌ Cart inquiry error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to submit enquiry. Please try again.",
        error: error.message
      });
    }
  }

  // Get all inquiries (Admin only)
  static async getAllInquiries(req, res) {
    try {
      const { page = 1, limit = 20, status, productId, search } = req.query;

      const filter = {};
      if (status && status !== "all") filter.status = status;
      if (productId) filter.product = productId;
      
      // Add search functionality
      if (search) {
        filter.$or = [
          { customerEmail: { $regex: search, $options: "i" } },
          { customerPhone: { $regex: search, $options: "i" } },
          { productName: { $regex: search, $options: "i" } },
          { message: { $regex: search, $options: "i" } }
        ];
      }

      const inquiries = await ProductInquiry.find(filter)
        .populate("product", "name category image")
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean();

      const count = await ProductInquiry.countDocuments(filter);

      console.log(`✅ Found ${inquiries.length} inquiries (total: ${count})`);

      res.json({
        success: true,
        data: {
          inquiries,
          totalPages: Math.ceil(count / limit),
          currentPage: parseInt(page),
          total: count
        }
      });
    } catch (error) {
      console.error("❌ Get inquiries error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch inquiries",
        error: error.message
      });
    }
  }

  // Update inquiry status (Admin only)
  static async updateInquiryStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, adminNotes } = req.body;

      // Validate MongoDB ObjectId
      if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({
          success: false,
          message: "Invalid inquiry ID format"
        });
      }

      // Validate status
      const validStatuses = ["new", "contacted", "resolved", "closed"];
      if (status && !validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`
        });
      }

      const inquiry = await ProductInquiry.findByIdAndUpdate(
        id,
        {
          status,
          adminNotes,
          "metadata.respondedAt": status === "contacted" ? new Date() : undefined
        },
        { new: true, runValidators: true }
      ).populate("product", "name category");

      if (!inquiry) {
        return res.status(404).json({
          success: false,
          message: "Inquiry not found"
        });
      }

      if (status && emailService?.sendProductInquiryStatusUpdate) {
        setImmediate(() => {
          emailService.sendProductInquiryStatusUpdate({
            productName: inquiry.productName || inquiry.product?.name || "Product inquiry",
            customerEmail: inquiry.customerEmail,
            status: inquiry.status,
            adminNotes: inquiry.adminNotes
          }).catch((emailError) => {
            console.error("Product inquiry status email failed:", emailError);
          });
        });
      }

      res.json({
        success: true,
        message: "Inquiry updated successfully",
        data: { inquiry }
      });
    } catch (error) {
      console.error("❌ Update inquiry error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update inquiry",
        error: error.message
      });
    }
  }

  // Delete inquiry (Admin only)
  static async deleteInquiry(req, res) {
    try {
      const { id } = req.params;

      // Validate MongoDB ObjectId
      if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({
          success: false,
          message: "Invalid inquiry ID format"
        });
      }

      const inquiry = await ProductInquiry.findByIdAndDelete(id);

      if (!inquiry) {
        return res.status(404).json({
          success: false,
          message: "Inquiry not found"
        });
      }

      res.json({
        success: true,
        message: "Inquiry deleted successfully"
      });
    } catch (error) {
      console.error("❌ Delete inquiry error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete inquiry",
        error: error.message
      });
    }
  }

  // Get inquiry statistics (Admin only)
  static async getInquiryStats(req, res) {
    try {
      const stats = await ProductInquiry.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 }
          }
        }
      ]);

      const totalInquiries = await ProductInquiry.countDocuments();
      const recentInquiries = await ProductInquiry.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("product", "name");

      res.json({
        success: true,
        data: {
          stats,
          totalInquiries,
          recentInquiries
        }
      });
    } catch (error) {
      console.error("Get inquiry stats error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch inquiry statistics",
        error: error.message
      });
    }
  }
}

module.exports = ProductInquiryController;
