const express = require("express");
const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const contactRoutes = require("./contactRoutes");
const newsletterRoutes = require("./newsletterRoutes");
const adminRoutes = require("./adminRoutes");
const serviceProjectRoutes = require("./serviceProjectRoutes");
const publicRoutes = require("./publicRoutes");
const partnerRoutes = require("./partnerRoutes");
const partnershipRequestRoutes = require("./partnershipRequestRoutes");
const awardsRoutes = require("./awardsRoutes");
const productRoutes = require("./productRoutes");
const productInquiryRoutes = require("./productInquiryRoutes");
const serviceQuoteRoutes = require("./serviceQuoteRoutes");
const certificateRoutes = require("./certificates");
const passwordResetRoutes = require("./passwordResetRoutes");
const searchRoutes = require("./searchRoutes");
const visitorRoutes = require("./visitorRoutes");

const router = express.Router();

// Mount all routes
router.use("/", authRoutes);                    // /api/login, /api/signup, /api/logout, /api/account
router.use("/auth", passwordResetRoutes);       // /api/auth/forgot-password, /api/auth/reset-password
router.use("/users", userRoutes);               // /api/users/*
router.use("/contact", contactRoutes);          // /api/contact/*
router.use("/newsletter", newsletterRoutes);    // /api/newsletter/*
router.use("/admin", adminRoutes);              // /api/admin/*
router.use("/admin", serviceProjectRoutes);     // /api/admin/services/*, /api/admin/projects/*
router.use("/public", publicRoutes);            // /api/public/services/*, /api/public/projects/*
router.use("/partners", partnerRoutes);         // /api/partners/*
router.use("/partnership-requests", partnershipRequestRoutes); // /api/partnership-requests/*
router.use("/awards", awardsRoutes);            // /api/awards/*
router.use("/products", productRoutes);         // /api/products/*
router.use("/products", productInquiryRoutes);  // /api/products/inquiries/* (public & admin)
router.use("/services", serviceQuoteRoutes);    // /api/services/quotes/* (public & admin)
router.use("/certificates", certificateRoutes); // /api/certificates/*
router.use("/search", searchRoutes);            // /api/search/* (universal search)
router.use("/", visitorRoutes);                 // /api/admin/visitor-analytics/*, /api/visitor/track

module.exports = router;