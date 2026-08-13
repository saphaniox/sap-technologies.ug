// Admin panel controller - handles all administrative functions
// This is where admins manage users, content, and get system insights
const os = require("os");
const { User, Contact, Newsletter, Service, Project, Partner, PartnershipRequest, Product, ProductInquiry, ServiceQuote, Nomination, AppSetting } = require("../models");
const { AppError } = require("../middleware/errorHandler");
const Gallery = require("../models/Gallery");
const Job = require("../models/Job");
const JobApplication = require("../models/JobApplication");
const { VisitorSession, PageView } = require("../models/Visitor");
const emailService = require("../services/emailService");

const EMAIL_PROVIDER_SETTING_KEY = "email.providerMode";
const EMAIL_PUBLIC_CONFIG_SETTING_KEY = "email.publicConfig";
const EMAIL_PROVIDER_MODES = ["auto", "mailjet", "gmail"];

const normalizeEmailProviderMode = (mode) => {
    const normalized = String(mode || "auto").trim().toLowerCase();
    return EMAIL_PROVIDER_MODES.includes(normalized) ? normalized : "auto";
};

const cleanSettingText = (value, fallback = "") => {
    if (value === undefined || value === null) return fallback;
    const cleaned = String(value).trim();
    return cleaned || fallback;
};

const cleanSettingNumber = (value, fallback) => {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
};

const cleanSettingBoolean = (value, fallback = false) => {
    if (value === undefined || value === null || value === "") return fallback;
    if (typeof value === "boolean") return value;
    return ["true", "1", "yes", "on"].includes(String(value).toLowerCase());
};

const isEmailLike = (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const compactObject = (object = {}) => Object.fromEntries(
    Object.entries(object).filter(([, value]) => value !== undefined && value !== null && value !== "")
);

const buildPublicEmailConfig = (input = {}, current = {}) => {
    const providerMode = normalizeEmailProviderMode(input.providerMode || current.providerMode || "auto");
    const brandInput = input.brand || {};
    const senderInput = input.sender || {};
    const mailjetInput = input.mailjet || {};
    const gmailInput = input.gmail || {};

    return {
        providerMode,
        brand: compactObject({
            name: cleanSettingText(brandInput.name, current.brand?.name),
            legalName: cleanSettingText(brandInput.legalName, current.brand?.legalName),
            awardsName: cleanSettingText(brandInput.awardsName, current.brand?.awardsName),
            websiteUrl: cleanSettingText(brandInput.websiteUrl, current.brand?.websiteUrl),
            logoUrl: cleanSettingText(brandInput.logoUrl, current.brand?.logoUrl),
            tagline: cleanSettingText(brandInput.tagline, current.brand?.tagline),
            phone: cleanSettingText(brandInput.phone, current.brand?.phone),
            address: cleanSettingText(brandInput.address, current.brand?.address),
            contactEmail: cleanSettingText(brandInput.contactEmail, current.brand?.contactEmail)
        }),
        sender: compactObject({
            fromName: cleanSettingText(senderInput.fromName, current.sender?.fromName),
            fromEmail: cleanSettingText(senderInput.fromEmail, current.sender?.fromEmail),
            replyTo: cleanSettingText(senderInput.replyTo, current.sender?.replyTo),
            notifyEmail: cleanSettingText(senderInput.notifyEmail, current.sender?.notifyEmail)
        }),
        mailjet: compactObject({
            fromEmail: cleanSettingText(mailjetInput.fromEmail, current.mailjet?.fromEmail),
            timeoutMs: cleanSettingNumber(mailjetInput.timeoutMs, current.mailjet?.timeoutMs || 15000),
            sandboxMode: cleanSettingBoolean(mailjetInput.sandboxMode, current.mailjet?.sandboxMode || false)
        }),
        gmail: compactObject({
            fromEmail: cleanSettingText(gmailInput.fromEmail, current.gmail?.fromEmail)
        })
    };
};

const validatePublicEmailConfig = (config) => {
    const emails = [
        ["Brand contact email", config.brand?.contactEmail],
        ["From email", config.sender?.fromEmail],
        ["Reply-to email", config.sender?.replyTo],
        ["Notification email", config.sender?.notifyEmail],
        ["Mailjet sender email", config.mailjet?.fromEmail],
        ["Gmail sender email", config.gmail?.fromEmail]
    ];

    const invalid = emails.find(([, value]) => !isEmailLike(value));
    if (invalid) return `${invalid[0]} is not a valid email address.`;
    return "";
};

const countByStatus = async (Model, match = {}) => {
    const rows = await Model.aggregate([
        { $match: match },
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
    ]);

    return rows.reduce((counts, row) => {
        counts[row._id || "unknown"] = row.count;
        return counts;
    }, {});
};

const toActivityItem = ({ type, title, subtitle, status, createdAt, tab }) => ({
    type,
    title: title || "Untitled activity",
    subtitle: subtitle || "",
    status: status || "new",
    createdAt,
    tab
});

const COLLECTION_HEALTH_MODELS = [
    ["users", User],
    ["contacts", Contact],
    ["newsletter", Newsletter],
    ["services", Service],
    ["projects", Project],
    ["partners", Partner],
    ["partnershipRequests", PartnershipRequest],
    ["products", Product],
    ["productInquiries", ProductInquiry],
    ["serviceQuotes", ServiceQuote],
    ["gallery", Gallery],
    ["jobs", Job],
    ["jobApplications", JobApplication],
    ["awardNominations", Nomination]
];

// Main admin controller for managing the application
class AdminController {
    // Get comprehensive dashboard statistics for admin overview
    // This gives admins a bird's eye view of what's happening in the app
    async getDashboardStats(req, res, next) {
        try {
            // Calculate date for 30 days ago for growth metrics
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            // Count all the important stuff in our database
            const totalUsers = await User.countDocuments();
            const totalAdmins = await User.countDocuments({ role: "admin" });
            const totalContacts = await Contact.countDocuments();
            const totalNewsletterSubscribers = await Newsletter.countDocuments();
            const totalServices = await Service.countDocuments();
            const totalProjects = await Project.countDocuments();
            const featuredServices = await Service.countDocuments({ featured: true });
            const completedProjects = await Project.countDocuments({ status: "completed" });
            
            // Partners statistics
            const totalPartners = await Partner.countDocuments();
            const activePartners = await Partner.countDocuments({ isActive: true });
            
            // Partnership requests statistics
            const totalPartnershipRequests = await PartnershipRequest.countDocuments();
            const pendingPartnershipRequests = await PartnershipRequest.countDocuments({ status: "pending" });
            
            // Products statistics
            const totalProducts = await Product.countDocuments();
            const featuredProducts = await Product.countDocuments({ isFeatured: true });

            // Gallery statistics
            const totalGalleryItems = await Gallery.countDocuments();
            const activeGalleryItems = await Gallery.countDocuments({ isActive: true });

            // Jobs statistics
            const totalJobs = await Job.countDocuments();
            const activeJobs = await Job.countDocuments({ isActive: true });
            const totalJobApplications = await JobApplication.countDocuments();
            const newJobApplicationsLast30Days = await JobApplication.countDocuments({
                createdAt: { $gte: thirtyDaysAgo }
            });
            
            // Product inquiries statistics
            const totalProductInquiries = await ProductInquiry.countDocuments();
            const newProductInquiriesLast30Days = await ProductInquiry.countDocuments({
                createdAt: { $gte: thirtyDaysAgo }
            });
            
            // Service quotes statistics
            const totalServiceQuotes = await ServiceQuote.countDocuments();
            const newServiceQuotesLast30Days = await ServiceQuote.countDocuments({
                createdAt: { $gte: thirtyDaysAgo }
            });
            
            // Awards statistics
            const totalAwards = await Nomination.countDocuments();
            const approvedAwards = await Nomination.countDocuments({ status: "approved" });
            
            // Get the 5 most recent users for the "Recent Activity" section
            const recentUsers = await User.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .select("name email createdAt role loginCount");
            
            const newUsersLast30Days = await User.countDocuments({
                createdAt: { $gte: thirtyDaysAgo }
            });

            const newContactsLast30Days = await Contact.countDocuments({
                createdAt: { $gte: thirtyDaysAgo }
            });

            const activeNewsletterSubscribers = await Newsletter.countDocuments({ isActive: true });
            const newNewsletterSubscribersLast30Days = await Newsletter.countDocuments({
                subscribedAt: { $gte: thirtyDaysAgo }
            });

            const pendingContacts = await Contact.countDocuments({ status: "pending" });
            const newProductInquiries = await ProductInquiry.countDocuments({ status: "new" });
            const newServiceQuotes = await ServiceQuote.countDocuments({ status: "new" });
            const pendingJobApplications = await JobApplication.countDocuments({ status: "pending" });
            const pendingAwards = await Nomination.countDocuments({ status: "pending" });

            const [
                contactStatusCounts,
                partnershipStatusCounts,
                productInquiryStatusCounts,
                serviceQuoteStatusCounts,
                jobApplicationStatusCounts,
                awardStatusCounts
            ] = await Promise.all([
                countByStatus(Contact),
                countByStatus(PartnershipRequest),
                countByStatus(ProductInquiry),
                countByStatus(ServiceQuote),
                countByStatus(JobApplication),
                countByStatus(Nomination)
            ]);

            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

            const [
                totalVisitors,
                visitorsToday,
                visitorsOnline,
                totalPageViews,
                pageViewsToday
            ] = await Promise.all([
                VisitorSession.countDocuments(),
                VisitorSession.countDocuments({ firstSeen: { $gte: todayStart } }),
                VisitorSession.countDocuments({ lastSeen: { $gte: fifteenMinutesAgo } }),
                PageView.countDocuments(),
                PageView.countDocuments({ timestamp: { $gte: todayStart } })
            ]);

            const [
                recentContacts,
                recentPartnershipRequests,
                recentProductInquiries,
                recentServiceQuotes,
                recentJobApplications,
                recentNominations
            ] = await Promise.all([
                Contact.find().sort({ createdAt: -1 }).limit(4).select("name email status createdAt submittedAt").lean(),
                PartnershipRequest.find().sort({ createdAt: -1 }).limit(4).select("companyName contactPerson status createdAt").lean(),
                ProductInquiry.find().sort({ createdAt: -1 }).limit(4).select("productName customerEmail status createdAt").lean(),
                ServiceQuote.find().sort({ createdAt: -1 }).limit(4).select("serviceName customerName status createdAt").lean(),
                JobApplication.find().sort({ createdAt: -1 }).limit(4).select("fullName email status createdAt").lean(),
                Nomination.find().sort({ createdAt: -1 }).limit(4).select("nomineeName nominatorName status createdAt").lean()
            ]);

            const recentActivity = [
                ...recentContacts.map((contact) => toActivityItem({
                    type: "Contact",
                    title: contact.name,
                    subtitle: contact.email,
                    status: contact.status,
                    createdAt: contact.createdAt || contact.submittedAt,
                    tab: "contacts"
                })),
                ...recentPartnershipRequests.map((request) => toActivityItem({
                    type: "Partnership",
                    title: request.companyName,
                    subtitle: request.contactPerson,
                    status: request.status,
                    createdAt: request.createdAt,
                    tab: "partnership-requests"
                })),
                ...recentProductInquiries.map((inquiry) => toActivityItem({
                    type: "Product inquiry",
                    title: inquiry.productName,
                    subtitle: inquiry.customerEmail,
                    status: inquiry.status,
                    createdAt: inquiry.createdAt,
                    tab: "product-inquiries"
                })),
                ...recentServiceQuotes.map((quote) => toActivityItem({
                    type: "Service quote",
                    title: quote.serviceName,
                    subtitle: quote.customerName,
                    status: quote.status,
                    createdAt: quote.createdAt,
                    tab: "service-quotes"
                })),
                ...recentJobApplications.map((application) => toActivityItem({
                    type: "Job application",
                    title: application.fullName,
                    subtitle: application.email,
                    status: application.status,
                    createdAt: application.createdAt,
                    tab: "job-applications"
                })),
                ...recentNominations.map((nomination) => toActivityItem({
                    type: "Award nomination",
                    title: nomination.nomineeName,
                    subtitle: nomination.nominatorName,
                    status: nomination.status,
                    createdAt: nomination.createdAt,
                    tab: "awards"
                }))
            ]
                .filter((item) => item.createdAt)
                .sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt))
                .slice(0, 10);

            const emailDelivery = await emailService.getDeliveryStatus();
            const totalOpenWork = pendingContacts
                + pendingPartnershipRequests
                + newProductInquiries
                + newServiceQuotes
                + pendingJobApplications
                + pendingAwards;

            res.status(200).json({
                status: "success",
                data: {
                    generatedAt: new Date().toISOString(),
                    stats: {
                        totalUsers,
                        totalAdmins,
                        totalContacts,
                        totalNewsletterSubscribers,
                        activeNewsletterSubscribers,
                        newNewsletterSubscribersLast30Days,
                        totalServices,
                        totalProjects,
                        featuredServices,
                        completedProjects,
                        totalPartners,
                        activePartners,
                        totalPartnershipRequests,
                        pendingPartnershipRequests,
                        totalProducts,
                        featuredProducts,
                        totalGalleryItems,
                        activeGalleryItems,
                        totalJobs,
                        activeJobs,
                        totalJobApplications,
                        newJobApplicationsLast30Days,
                        totalProductInquiries,
                        newProductInquiriesLast30Days,
                        totalServiceQuotes,
                        newServiceQuotesLast30Days,
                        totalAwards,
                        approvedAwards,
                        pendingAwards,
                        pendingContacts,
                        newProductInquiries,
                        newServiceQuotes,
                        pendingJobApplications,
                        totalOpenWork,
                        totalVisitors,
                        visitorsToday,
                        visitorsOnline,
                        totalPageViews,
                        pageViewsToday,
                        newUsersLast30Days,
                        newContactsLast30Days
                    },
                    audience: {
                        users: totalUsers,
                        admins: totalAdmins,
                        newsletterSubscribers: totalNewsletterSubscribers,
                        activeNewsletterSubscribers,
                        newUsersLast30Days,
                        newContactsLast30Days,
                        newNewsletterSubscribersLast30Days,
                        visitorsToday,
                        totalVisitors,
                        pageViewsToday,
                        totalPageViews
                    },
                    workQueue: [
                        { key: "contacts", label: "Unread contact messages", count: pendingContacts, tab: "contacts", tone: "warning" },
                        { key: "partnerships", label: "Partnership requests pending review", count: pendingPartnershipRequests, tab: "partnership-requests", tone: "warning" },
                        { key: "productInquiries", label: "New product inquiries", count: newProductInquiries, tab: "product-inquiries", tone: "info" },
                        { key: "serviceQuotes", label: "New service quotes", count: newServiceQuotes, tab: "service-quotes", tone: "info" },
                        { key: "jobApplications", label: "Job applications awaiting review", count: pendingJobApplications, tab: "job-applications", tone: "success" },
                        { key: "awards", label: "Award nominations awaiting review", count: pendingAwards, tab: "awards", tone: "success" }
                    ],
                    pipeline: {
                        contactStatusCounts,
                        partnershipStatusCounts,
                        productInquiryStatusCounts,
                        serviceQuoteStatusCounts,
                        jobApplicationStatusCounts,
                        awardStatusCounts
                    },
                    content: {
                        services: { total: totalServices, featured: featuredServices },
                        projects: { total: totalProjects, completed: completedProjects },
                        products: { total: totalProducts, featured: featuredProducts },
                        gallery: { total: totalGalleryItems, active: activeGalleryItems },
                        jobs: { total: totalJobs, active: activeJobs },
                        partners: { total: totalPartners, active: activePartners }
                    },
                    traffic: {
                        visitorsOnline,
                        visitorsToday,
                        totalVisitors,
                        pageViewsToday,
                        totalPageViews
                    },
                    emailDelivery,
                    recentUsers,
                    recentActivity
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
            const normalizedStatus = status === "responded" ? "replied" : status;

            // Allow: pending, read, replied, archived
            if (!["pending", "read", "replied", "responded", "archived"].includes(status)) {
                return next(new AppError("Invalid status", 400));
            }

            const contact = await Contact.findByIdAndUpdate(
                contactId,
                { status: normalizedStatus },
                { new: true, runValidators: true }
            );

            if (!contact) {
                return next(new AppError("Contact not found", 404));
            }

            if (emailService?.sendContactStatusUpdate) {
                setImmediate(() => {
                    emailService.sendContactStatusUpdate({
                        name: contact.name,
                        email: contact.email,
                        message: contact.message,
                        status: contact.status,
                        submittedAt: contact.submittedAt,
                        createdAt: contact.createdAt
                    }).catch((emailError) => {
                        console.error("Contact status email failed:", emailError);
                    });
                });
            }

            res.status(200).json({
                status: "success",
                message: `Contact status updated to ${normalizedStatus}`,
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

    async getEmailSettings(req, res, next) {
        try {
            const setting = await AppSetting.findOne({ key: EMAIL_PROVIDER_SETTING_KEY })
                .populate("updatedBy", "name email")
                .lean();
            const configSetting = await AppSetting.findOne({ key: EMAIL_PUBLIC_CONFIG_SETTING_KEY })
                .populate("updatedBy", "name email")
                .lean();
            const emailDelivery = await emailService.getDeliveryStatus();

            res.status(200).json({
                status: "success",
                data: {
                    emailDelivery,
                    publicConfig: configSetting?.value || {},
                    publicConfigUpdatedAt: configSetting?.updatedAt || null,
                    publicConfigUpdatedBy: configSetting?.updatedBy ? {
                        name: configSetting.updatedBy.name,
                        email: configSetting.updatedBy.email
                    } : null,
                    setting: setting ? {
                        key: setting.key,
                        value: setting.value,
                        updatedAt: setting.updatedAt,
                        updatedBy: setting.updatedBy ? {
                            name: setting.updatedBy.name,
                            email: setting.updatedBy.email
                        } : null
                    } : null
                }
            });
        } catch (error) {
            next(error);
        }
    }

    async updateEmailSettings(req, res, next) {
        try {
            const current = await AppSetting.getValue(EMAIL_PUBLIC_CONFIG_SETTING_KEY, {});
            const config = buildPublicEmailConfig(req.body || {}, current);
            const validationMessage = validatePublicEmailConfig(config);

            if (validationMessage) {
                return next(new AppError(validationMessage, 400));
            }

            if (!EMAIL_PROVIDER_MODES.includes(config.providerMode)) {
                return next(new AppError("Email provider must be auto, mailjet, or gmail.", 400));
            }

            const currentStatus = await emailService.getDeliveryStatus();
            if (config.providerMode === "mailjet" && !currentStatus.configured.mailjet) {
                return next(new AppError("Mailjet keys must stay in env and are not configured yet.", 400));
            }

            if (config.providerMode === "gmail" && !currentStatus.configured.gmail) {
                return next(new AppError("Gmail credentials must stay in env and are not configured yet.", 400));
            }

            const [configSetting, providerSetting] = await Promise.all([
                AppSetting.setValue(EMAIL_PUBLIC_CONFIG_SETTING_KEY, config, req.user?._id || null),
                AppSetting.setValue(EMAIL_PROVIDER_SETTING_KEY, config.providerMode, req.user?._id || null)
            ]);

            emailService.invalidateConfigCache?.();
            await emailService.loadRuntimeConfig?.(true);
            emailService.setRuntimeProviderMode(config.providerMode);
            const emailDelivery = await emailService.getDeliveryStatus();

            res.status(200).json({
                status: "success",
                message: "Email dashboard settings saved.",
                data: {
                    emailDelivery,
                    publicConfig: configSetting.value,
                    publicConfigUpdatedAt: configSetting.updatedAt,
                    setting: {
                        key: providerSetting.key,
                        value: providerSetting.value,
                        updatedAt: providerSetting.updatedAt
                    }
                }
            });
        } catch (error) {
            next(error);
        }
    }

    async updateEmailProvider(req, res, next) {
        try {
            const requestedMode = String(req.body?.providerMode || req.body?.mode || req.body?.provider || "").trim().toLowerCase();

            if (!EMAIL_PROVIDER_MODES.includes(requestedMode)) {
                return next(new AppError("Email provider must be auto, mailjet, or gmail.", 400));
            }

            const currentStatus = await emailService.getDeliveryStatus();
            if (requestedMode === "mailjet" && !currentStatus.configured.mailjet) {
                return next(new AppError("Mailjet is not configured yet. Add Mailjet API keys before forcing Mailjet.", 400));
            }

            if (requestedMode === "gmail" && !currentStatus.configured.gmail) {
                return next(new AppError("Gmail SMTP is not configured yet. Add Gmail SMTP credentials before forcing Gmail.", 400));
            }

            const mode = normalizeEmailProviderMode(requestedMode);
            const currentConfig = await AppSetting.getValue(EMAIL_PUBLIC_CONFIG_SETTING_KEY, {});
            const [setting] = await Promise.all([
                AppSetting.setValue(EMAIL_PROVIDER_SETTING_KEY, mode, req.user?._id || null),
                AppSetting.setValue(EMAIL_PUBLIC_CONFIG_SETTING_KEY, { ...currentConfig, providerMode: mode }, req.user?._id || null)
            ]);
            emailService.invalidateConfigCache?.();
            await emailService.loadRuntimeConfig?.(true);
            emailService.setRuntimeProviderMode(mode);
            const emailDelivery = await emailService.getDeliveryStatus();

            res.status(200).json({
                status: "success",
                message: `Email provider changed to ${mode}.`,
                data: {
                    emailDelivery,
                    setting: {
                        key: setting.key,
                        value: setting.value,
                        updatedAt: setting.updatedAt
                    }
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // System health check
    async getSystemHealth(req, res, next) {
        try {
            const mongoose = require("mongoose");
            const dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
            const uptime = process.uptime();
            const memoryUsage = process.memoryUsage();
            const totalMemory = os.totalmem();
            const freeMemory = os.freemem();
            const loadAverage = os.loadavg();
            const collectionCounts = await Promise.all(
                COLLECTION_HEALTH_MODELS.map(async ([name, Model]) => ({
                    name,
                    count: await Model.countDocuments()
                }))
            );
            const emailDelivery = await emailService.getDeliveryStatus();

            res.status(200).json({
                status: "success",
                data: {
                    system: {
                        status: "online",
                        uptime: Math.floor(uptime),
                        server: {
                            status: "online",
                            host: os.hostname(),
                            latency: `${Date.now() - req._startTime || 0} ms`
                        },
                        database: {
                            status: dbStatus,
                            name: mongoose.connection.name || "Not reported",
                            host: mongoose.connection.host || "Not reported",
                            collections: collectionCounts
                        },
                        process: {
                            pid: process.pid,
                            uptime: Math.floor(uptime),
                            memory: {
                                used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
                                total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
                                rss: Math.round(memoryUsage.rss / 1024 / 1024)
                            }
                        },
                        system: {
                            platform: `${os.type()} ${os.release()}`,
                            memory: {
                                usedBytes: totalMemory - freeMemory,
                                totalBytes: totalMemory
                            },
                            cpu: {
                                cores: os.cpus().length,
                                load: loadAverage[0]
                            }
                        },
                        nodeVersion: process.version,
                        platform: process.platform,
                        email: emailDelivery
                    }
                }
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AdminController();
