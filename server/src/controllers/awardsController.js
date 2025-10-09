/**
 * Awards Controller
 * 
 * Manages the complete awards system including categories,
 * nominations, winners, and certificate generation.
 * 
 * Features:
 * - Award category CRUD operations
 * - Nomination submission and management
 * - Winner and finalist selection
 * - Vote counting and statistics
 * - Status updates (pending, approved, rejected, winner, finalist)
 * - Photo upload handling for nominees
 * - Email notifications for winners and nominees
 * - Certificate generation for winners
 * - Public and admin endpoints
 * 
 * Category Management:
 * - Create, read, update, delete categories
 * - Track nominations per category
 * - Activation/deactivation control
 * 
 * Nomination Workflow:
 * 1. User submits nomination
 * 2. Admin reviews (approve/reject)
 * 3. Admin selects winners/finalists
 * 4. System generates certificates
 * 5. Email notifications sent
 * 
 * @module controllers/awardsController
 */

const { AwardCategory, Nomination } = require("../models");
const { validationResult } = require("express-validator");
const path = require("path");
const fs = require("fs").promises;
const emailService = require("../services/emailService");
const certificateService = require("../services/certificateService");

class AwardsController {
    // =====================
    // CATEGORY MANAGEMENT
    // =====================
    
    // Get all award categories
    async getCategories(req, res, next) {
        try {
            const categories = await AwardCategory.find({ isActive: true })
                .sort({ name: 1 });
            
            // Get nomination counts for each category
            const categoriesWithCounts = await Promise.all(
                categories.map(async (category) => {
                    const totalNominations = await Nomination.countDocuments({ 
                        category: category._id 
                    });
                    const approvedNominations = await Nomination.countDocuments({ 
                        category: category._id, 
                        status: "approved" 
                    });
                    
                    return {
                        ...category.toObject(),
                        totalNominations,
                        approvedNominations
                    };
                })
            );

            res.status(200).json({
                status: "success",
                data: {
                    categories: categoriesWithCounts
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Create new award category (admin only)
    async createCategory(req, res, next) {
        try {
            console.log("🏷️ Creating category with data:", req.body);
            
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                console.log("❌ Validation errors:", errors.array());
                return res.status(400).json({
                    status: "error",
                    message: "Validation failed",
                    errors: errors.array()
                });
            }

            const { name, description, icon, isActive } = req.body;
            
            const category = await AwardCategory.create({
                name: name.trim(),
                description: description.trim(),
                icon: icon || "🏆",
                isActive: isActive !== undefined ? isActive : true,
                createdAt: new Date()
            });

            console.log("✅ Category created successfully:", category);

            res.status(201).json({
                status: "success",
                message: "Award category created successfully",
                data: { category }
            });
        } catch (error) {
            console.error("❌ Error in createCategory:", error);
            if (error.code === 11000) {
                return res.status(400).json({
                    status: "error",
                    message: "Category with this name already exists"
                });
            }
            next(error);
        }
    }

    // Update award category (admin only)
    async updateCategory(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    status: "error",
                    message: "Validation failed",
                    errors: errors.array()
                });
            }

            const { name, description, icon, isActive } = req.body;
            const categoryId = req.params.id;

            const category = await AwardCategory.findByIdAndUpdate(
                categoryId,
                {
                    name,
                    description,
                    icon,
                    isActive: isActive !== undefined ? isActive : true,
                    updatedAt: new Date()
                },
                { new: true }
            );

            if (!category) {
                return res.status(404).json({
                    status: "error",
                    message: "Category not found"
                });
            }

            res.status(200).json({
                status: "success",
                message: "Award category updated successfully",
                data: { category }
            });
        } catch (error) {
            if (error.code === 11000) {
                return res.status(400).json({
                    status: "error",
                    message: "Category with this name already exists"
                });
            }
            next(error);
        }
    }

    // Delete award category (admin only)
    async deleteCategory(req, res, next) {
        try {
            const categoryId = req.params.id;

            // Check if category has any nominations
            const nominationCount = await Nomination.countDocuments({ category: categoryId });
            
            if (nominationCount > 0) {
                return res.status(400).json({
                    status: "error",
                    message: `Cannot delete category. It has ${nominationCount} nomination(s). Please reassign or delete the nominations first.`
                });
            }

            const category = await AwardCategory.findByIdAndDelete(categoryId);

            if (!category) {
                return res.status(404).json({
                    status: "error",
                    message: "Category not found"
                });
            }

            res.status(200).json({
                status: "success",
                message: "Award category deleted successfully",
                data: { category }
            });
        } catch (error) {
            next(error);
        }
    }

    // =====================
    // NOMINATION MANAGEMENT
    // =====================
    
    // Submit new nomination
    async submitNomination(req, res, next) {
        try {
            console.log("🎯 Nomination submission started");
            console.log("📋 Request body:", req.body);
            console.log("📎 File upload:", req.file);
            
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                console.log("❌ Validation errors:", errors.array());
                return res.status(400).json({
                    status: "error",
                    message: "Validation failed",
                    errors: errors.array()
                });
            }

            const {
                nomineeName,
                nomineeTitle,
                nomineeCompany,
                nomineeCountry,
                category,
                nominationReason,
                achievements,
                impactDescription,
                nominatorName,
                nominatorEmail,
                nominatorPhone,
                nominatorOrganization
            } = req.body;

            // Handle photo upload
            let nomineePhotoPath = "";
            if (req.file) {
                // Store relative path for serving static files
                nomineePhotoPath = `/uploads/awards/${req.file.filename}`;
                console.log("📸 Photo uploaded successfully:", nomineePhotoPath);
            } else {
                console.log("❌ No photo uploaded");
                return res.status(400).json({
                    status: "error",
                    message: "Nominee photo is required"
                });
            }

            const nomination = await Nomination.create({
                nomineeName: nomineeName.trim(),
                nomineeTitle: nomineeTitle?.trim(),
                nomineeCompany: nomineeCompany?.trim(),
                nomineeCountry: nomineeCountry?.trim() || "Uganda",
                nomineePhoto: nomineePhotoPath,
                category,
                nominationReason: nominationReason.trim(),
                achievements: achievements?.trim(),
                impactDescription: impactDescription?.trim(),
                nominatorName: nominatorName.trim(),
                nominatorEmail: nominatorEmail.toLowerCase().trim(),
                nominatorPhone: nominatorPhone?.trim(),
                nominatorOrganization: nominatorOrganization?.trim()
            });

            // Populate category information
            await nomination.populate("category");

            console.log("✅ Nomination created successfully, sending email notifications...");

            // Send email notifications (non-blocking)
            Promise.all([
                emailService.sendNominationSubmittedUser({
                    nominatorName: nomination.nominatorName,
                    nominatorEmail: nomination.nominatorEmail,
                    nomineeName: nomination.nomineeName,
                    categoryName: nomination.category.name,
                    nomineeCompany: nomination.nomineeCompany,
                    nomineeCountry: nomination.nomineeCountry
                }),
                emailService.sendNominationSubmittedAdmin({
                    nomineeName: nomination.nomineeName,
                    nomineeTitle: nomination.nomineeTitle,
                    nomineeCompany: nomination.nomineeCompany,
                    nomineeCountry: nomination.nomineeCountry,
                    categoryName: nomination.category.name,
                    nominationReason: nomination.nominationReason,
                    achievements: nomination.achievements,
                    impactDescription: nomination.impactDescription,
                    nominatorName: nomination.nominatorName,
                    nominatorEmail: nomination.nominatorEmail,
                    nominatorPhone: nomination.nominatorPhone,
                    nominatorOrganization: nomination.nominatorOrganization,
                    createdAt: nomination.createdAt
                })
            ]).catch(emailError => {
                console.error("⚠️ Error sending nomination emails:", emailError);
                // Don't fail the request if emails fail
            });

            res.status(201).json({
                status: "success",
                message: "Nomination submitted successfully! It will be reviewed before being published.",
                data: { nomination }
            });
        } catch (error) {
            // Clean up uploaded file if database save fails
            if (req.file) {
                try {
                    await fs.unlink(req.file.path);
                } catch (unlinkError) {
                    console.error("Error deleting file:", unlinkError);
                }
            }
            next(error);
        }
    }

    // Get all nominations with filters
    async getNominations(req, res, next) {
        try {
            const { 
                category, 
                status = "approved", 
                country, 
                page = 1, 
                limit = 20, 
                sortBy = "votes",
                sortOrder = "desc",
                search
            } = req.query;

            // Build filter object
            const filter = {};
            if (category) filter.category = category;
            if (status) filter.status = status;
            if (country) filter.nomineeCountry = new RegExp(country, "i");
            if (search) {
                filter.$or = [
                    { nomineeName: new RegExp(search, "i") },
                    { nomineeTitle: new RegExp(search, "i") },
                    { nomineeCompany: new RegExp(search, "i") },
                    { nominationReason: new RegExp(search, "i") }
                ];
            }

            // Build sort object
            const sort = {};
            sort[sortBy] = sortOrder === "desc" ? -1 : 1;
            if (sortBy !== "createdAt") {
                sort.createdAt = -1; // Secondary sort
            }

            const skip = (parseInt(page) - 1) * parseInt(limit);

            const nominations = await Nomination.find(filter)
                .populate("category", "name description icon")
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit));

            const total = await Nomination.countDocuments(filter);
            const totalPages = Math.ceil(total / parseInt(limit));

            res.status(200).json({
                status: "success",
                data: {
                    nominations,
                    pagination: {
                        currentPage: parseInt(page),
                        totalPages,
                        totalItems: total,
                        hasNextPage: parseInt(page) < totalPages,
                        hasPrevPage: parseInt(page) > 1
                    }
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Get single nomination by ID or slug
    async getNomination(req, res, next) {
        try {
            const { id } = req.params;
            
            let nomination;
            if (id.match(/^[0-9a-fA-F]{24}$/)) {
                // ObjectId
                nomination = await Nomination.findById(id)
                    .populate("category", "name description icon");
            } else {
                // Slug
                nomination = await Nomination.findOne({ slug: id })
                    .populate("category", "name description icon");
            }

            if (!nomination) {
                return res.status(404).json({
                    status: "error",
                    message: "Nomination not found"
                });
            }

            res.status(200).json({
                status: "success",
                data: { nomination }
            });
        } catch (error) {
            next(error);
        }
    }

    // =====================
    // VOTING SYSTEM
    // =====================
    
    // Vote for a nomination
    async voteForNomination(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    status: "error",
                    message: "Validation failed",
                    errors: errors.array()
                });
            }

            const { id } = req.params;
            const { voterEmail, voterName } = req.body;
            const ipAddress = req.ip || req.connection.remoteAddress;

            const nomination = await Nomination.findById(id);
            if (!nomination) {
                return res.status(404).json({
                    status: "error",
                    message: "Nomination not found"
                });
            }

            // Check if nomination is approved for voting
            if (nomination.status !== "approved") {
                return res.status(400).json({
                    status: "error",
                    message: "This nomination is not available for voting"
                });
            }

            // Check if email already voted
            if (nomination.hasVoted(voterEmail)) {
                return res.status(400).json({
                    status: "error",
                    message: "You have already voted for this nomination"
                });
            }

            // Add vote
            await nomination.addVote({
                voterEmail: voterEmail.toLowerCase().trim(),
                voterName: voterName?.trim(),
                ipAddress
            });

            res.status(200).json({
                status: "success",
                message: "Vote submitted successfully!",
                data: {
                    nomination: {
                        _id: nomination._id,
                        nomineeName: nomination.nomineeName,
                        totalVotes: nomination.totalVotes
                    }
                }
            });
        } catch (error) {
            if (error.message.includes("already voted")) {
                return res.status(400).json({
                    status: "error",
                    message: error.message
                });
            }
            next(error);
        }
    }

    // Check if email has voted for nomination
    async checkVoteStatus(req, res, next) {
        try {
            const { id } = req.params;
            const { email } = req.query;

            if (!email) {
                return res.status(400).json({
                    status: "error",
                    message: "Email is required"
                });
            }

            const nomination = await Nomination.findById(id);
            if (!nomination) {
                return res.status(404).json({
                    status: "error",
                    message: "Nomination not found"
                });
            }

            const hasVoted = nomination.hasVoted(email);

            res.status(200).json({
                status: "success",
                data: {
                    hasVoted,
                    totalVotes: nomination.totalVotes
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // =====================
    // ADMIN FUNCTIONS
    // =====================
    
    // Get all nominations for admin (including pending)
    async getAdminNominations(req, res, next) {
        try {
            const { 
                status, 
                category, 
                page = 1, 
                limit = 50,
                sortBy = "createdAt",
                sortOrder = "desc" 
            } = req.query;

            const filter = {};
            if (status) filter.status = status;
            if (category) filter.category = category;

            const sort = {};
            sort[sortBy] = sortOrder === "desc" ? -1 : 1;

            const skip = (parseInt(page) - 1) * parseInt(limit);

            const nominations = await Nomination.find(filter)
                .populate("category", "name description icon")
                .populate("reviewedBy", "name email")
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit));

            const total = await Nomination.countDocuments(filter);

            // Get status summary
            const statusSummary = await Nomination.aggregate([
                { $group: { _id: "$status", count: { $sum: 1 } } }
            ]);

            res.status(200).json({
                status: "success",
                data: {
                    nominations,
                    pagination: {
                        currentPage: parseInt(page),
                        totalPages: Math.ceil(total / parseInt(limit)),
                        totalItems: total
                    },
                    statusSummary
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Update nomination status (admin only)
    async updateNominationStatus(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    status: "error",
                    message: "Validation failed",
                    errors: errors.array()
                });
            }

            const { id } = req.params;
            const { status, adminNotes } = req.body;

            const nomination = await Nomination.findByIdAndUpdate(
                id,
                {
                    status,
                    adminNotes: adminNotes?.trim(),
                    reviewedBy: req.user._id,
                    reviewedAt: new Date()
                },
                { new: true, runValidators: true }
            ).populate("category");

            if (!nomination) {
                return res.status(404).json({
                    status: "error",
                    message: "Nomination not found"
                });
            }

            console.log(`✅ Nomination status updated to ${status}, sending email notification...`);

            // Auto-generate certificate for winners, finalists, and approved participants (non-blocking)
            if (['winner', 'finalist', 'approved'].includes(status) && !nomination.certificateFile) {
                (async () => {
                    try {
                        console.log(`🏆 Auto-generating certificate for ${nomination.nomineeName}...`);
                        
                        // Check if category exists
                        if (!nomination.category) {
                            console.error('⚠️ Cannot generate certificate: Category not found for nomination');
                            return;
                        }
                        
                        // Generate certificate ID if not exists
                        if (!nomination.certificateId) {
                            nomination.certificateId = certificateService.generateCertificateId(
                                nomination._id.toString(),
                                status
                            );
                        }

                        const certificateData = {
                            nomineeName: nomination.nomineeName,
                            categoryName: nomination.category.name,
                            awardYear: '2025',
                            issueDate: new Date(),
                            certificateId: nomination.certificateId
                        };

                        let certificatePath;
                        if (status === 'winner') {
                            certificatePath = await certificateService.generateWinnerCertificate(certificateData);
                        } else if (status === 'finalist') {
                            certificatePath = await certificateService.generateFinalistCertificate(certificateData);
                        } else {
                            certificatePath = await certificateService.generateParticipationCertificate(certificateData);
                        }

                        // Save certificate info to nomination
                        const filename = certificatePath.split('\\').pop();
                        nomination.certificateFile = filename;
                        nomination.certificateGeneratedAt = new Date();
                        await nomination.save();

                        console.log(`✅ Certificate auto-generated: ${filename}`);
                    } catch (certError) {
                        console.error('⚠️ Error auto-generating certificate:', certError);
                    }
                })();
            }

            // Send email notification to nominator (non-blocking)
            if (nomination.category) {
                emailService.sendNominationStatusUpdate({
                    nominatorName: nomination.nominatorName,
                    nominatorEmail: nomination.nominatorEmail,
                    nomineeName: nomination.nomineeName,
                    categoryName: nomination.category.name,
                    status: nomination.status,
                    adminNotes: nomination.adminNotes,
                    certificateFile: nomination.certificateFile
                }).catch(emailError => {
                    console.error("⚠️ Error sending status update email:", emailError);
                    // Don't fail the request if email fails
                });
            } else {
                console.warn('⚠️ Skipping email notification: Category not found for nomination');
            }

            res.status(200).json({
                status: "success",
                message: `Nomination status updated to ${status}`,
                data: { nomination }
            });
        } catch (error) {
            next(error);
        }
    }

    // Delete nomination (admin only)
    async deleteNomination(req, res, next) {
        try {
            const { id } = req.params;

            const nomination = await Nomination.findById(id).populate("category");
            if (!nomination) {
                return res.status(404).json({
                    status: "error",
                    message: "Nomination not found"
                });
            }

            // Store nomination data for email before deletion
            const nominationData = {
                nominatorName: nomination.nominatorName,
                nominatorEmail: nomination.nominatorEmail,
                nomineeName: nomination.nomineeName,
                categoryName: nomination.category ? nomination.category.name : "Unknown Category",
                adminNotes: nomination.adminNotes || "No specific reason provided"
            };

            // Delete photo file if exists
            if (nomination.nomineePhoto) {
                try {
                    const photoPath = path.join(process.cwd(), "uploads", nomination.nomineePhoto.replace("/uploads/", ""));
                    await fs.unlink(photoPath);
                } catch (unlinkError) {
                    console.error("Error deleting photo:", unlinkError);
                }
            }

            await Nomination.findByIdAndDelete(id);

            console.log("✅ Nomination deleted, sending email notification...");

            // Send email notification to nominator (non-blocking)
            emailService.sendNominationDeletedNotification(nominationData).catch(emailError => {
                console.error("⚠️ Error sending deletion notification email:", emailError);
                // Don't fail the request if email fails
            });

            res.status(200).json({
                status: "success",
                message: "Nomination deleted successfully"
            });
        } catch (error) {
            next(error);
        }
    }

    // Get awards statistics
    async getAwardsStats(req, res, next) {
        try {
            const stats = await Nomination.aggregate([
                {
                    $group: {
                        _id: null,
                        totalNominations: { $sum: 1 },
                        approvedNominations: {
                            $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] }
                        },
                        pendingNominations: {
                            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] }
                        },
                        totalVotes: { $sum: "$votes" },
                        ugandanNominees: {
                            $sum: { $cond: [{ $eq: ["$nomineeCountry", "Uganda"] }, 1, 0] }
                        },
                        internationalNominees: {
                            $sum: { $cond: [{ $ne: ["$nomineeCountry", "Uganda"] }, 1, 0] }
                        }
                    }
                }
            ]);

            const categoryStats = await Nomination.aggregate([
                {
                    $group: {
                        _id: "$category",
                        count: { $sum: 1 },
                        totalVotes: { $sum: "$votes" }
                    }
                },
                {
                    $lookup: {
                        from: "awardcategories",
                        localField: "_id",
                        foreignField: "_id",
                        as: "category"
                    }
                },
                {
                    $unwind: "$category"
                },
                {
                    $project: {
                        categoryName: "$category.name",
                        count: 1,
                        totalVotes: 1
                    }
                }
            ]);

            const topNominations = await Nomination.find({ status: "approved" })
                .sort({ votes: -1 })
                .limit(10)
                .populate("category", "name")
                .select("nomineeName nomineePhoto votes category");

            res.status(200).json({
                status: "success",
                data: {
                    generalStats: stats[0] || {
                        totalNominations: 0,
                        approvedNominations: 0,
                        pendingNominations: 0,
                        totalVotes: 0,
                        ugandanNominees: 0,
                        internationalNominees: 0
                    },
                    categoryStats,
                    topNominations
                }
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AwardsController();