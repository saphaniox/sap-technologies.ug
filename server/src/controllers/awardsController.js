const { AwardCategory, Nomination } = require("../models");
const { validationResult } = require("express-validator");
const path = require("path");
const fs = require("fs").promises;
const emailService = require("../services/emailService");
const certificateService = require("../services/certificateService");
const { useCloudinary } = require("../config/fileUpload");
const cache = require("../services/cacheService");
const logger = require("../utils/logger");

// Helper function to get correct file URL (Cloudinary or local)
const getFileUrl = (file, folder = 'awards') => {
  if (!file) return null;
  
  if (useCloudinary && file.path) {
    // Cloudinary returns full URL in file.path
    return file.path;
  }
  
  // Local storage - construct relative path
  return file ? `/uploads/${folder}/${file.filename}` : null;
};

class AwardsController {
    // =====================
    // CATEGORY MANAGEMENT
    // =====================
    
    // Get all award categories
    async getCategories(req, res, next) {
        try {
            // Try to get from cache
            const cachedCategories = cache.getCachedAwardCategories();
            if (cachedCategories) {
                logger.logDebug('AwardsController', 'Serving cached award categories');
                return res.status(200).json({
                    status: "success",
                    data: {
                        categories: cachedCategories
                    },
                    cached: true
                });
            }
            
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

            // Cache for 1 hour
            cache.cacheAwardCategories(categoriesWithCounts);
            logger.logDebug('AwardsController', 'Award categories cached', { count: categoriesWithCounts.length });

            res.status(200).json({
                status: "success",
                data: {
                    categories: categoriesWithCounts
                }
            });
        } catch (error) {
            logger.logError('AwardsController', error, { context: 'getCategories' });
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

            // Invalidate award categories cache
            cache.invalidateAwardCategories();
            logger.logInfo('AwardsController', 'Category created, cache invalidated', { categoryId: category._id });

            res.status(201).json({
                status: "success",
                message: "Award category created successfully",
                data: { category }
            });
        } catch (error) {
            console.error("❌ Error in createCategory:", error);
            logger.logError('AwardsController', error, { context: 'createCategory' });
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

            // Invalidate award categories cache
            cache.invalidateAwardCategories();
            logger.logInfo('AwardsController', 'Category updated, cache invalidated', { categoryId });

            res.status(200).json({
                status: "success",
                message: "Award category updated successfully",
                data: { category }
            });
        } catch (error) {
            logger.logError('AwardsController', error, { context: 'updateCategory', categoryId: req.params.id });
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

            // Invalidate award categories cache
            cache.invalidateAwardCategories();
            logger.logInfo('AwardsController', 'Category deleted, cache invalidated', { categoryId });

            res.status(200).json({
                status: "success",
                message: "Award category deleted successfully",
                data: { category }
            });
        } catch (error) {
            logger.logError('AwardsController', error, { context: 'deleteCategory', categoryId: req.params.id });
            next(error);
        }
    }

    // =====================
    // NOMINATION MANAGEMENT
    // =====================
    
    // Submit new nomination
    async submitNomination(req, res, next) {
        try {
            logger.logInfo('AwardsController', 'Nomination submission started', {
                body: req.body,
                file: req.file ? { 
                    originalname: req.file.originalname,
                    size: req.file.size,
                    mimetype: req.file.mimetype
                } : null
            });

            // Validate request body
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                logger.logWarning('AwardsController', 'Validation errors in nomination submission', { errors: errors.array() });
                return res.status(400).json({
                    status: "error",
                    message: "Please check the form and fix any validation errors",
                    errors: errors.array()
                });
            }

            // Validate required fields are present and not empty
            const {
                nomineeName,
                category,
                nominationReason,
                nominatorName,
                nominatorEmail,
                nomineeTitle,
                nomineeCompany,
                nomineeCountry,
                achievements,
                impactDescription,
                nominatorPhone,
                nominatorOrganization
            } = req.body;

            const requiredFields = {
                nomineeName,
                category,
                nominatorName,
                nominatorEmail
            };

            const missingFields = Object.entries(requiredFields)
                .filter(([_, value]) => !value || value.trim().length === 0)
                .map(([field]) => field);

            if (missingFields.length > 0) {
                logger.logWarning('AwardsController', 'Missing required fields', { missingFields });
                return res.status(400).json({
                    status: "error",
                    message: "Missing required fields",
                    errors: missingFields.map(field => ({
                        param: field,
                        msg: `${field} is required`
                    }))
                });
            }

            // Handle photo upload with enhanced error handling
            let nomineePhotoPath = "";
            if (req.file) {
                try {
                    if (!useCloudinary && !req.file.path) {
                        throw new Error('File path is missing');
                    }
                    nomineePhotoPath = getFileUrl(req.file, 'awards');
                    logger.logInfo('AwardsController', 'Photo upload successful', { 
                        path: nomineePhotoPath,
                        storage: useCloudinary ? 'cloudinary' : 'local'
                    });
                } catch (fileError) {
                    logger.logError('AwardsController', 'File processing error', { 
                        error: fileError.message,
                        file: req.file 
                    });
                    return res.status(400).json({
                        status: "error",
                        message: "Failed to process the uploaded photo",
                        error: fileError.message
                    });
                }
            } else {
                logger.logInfo('AwardsController', 'No photo uploaded, using default');
                nomineePhotoPath = "/uploads/awards/default-nominee.png";
            }

            // Create nomination with strict error handling
            let nomination;
            try {
                nomination = await Nomination.create({
                    nomineeName: nomineeName.trim(),
                    nomineeTitle: nomineeTitle?.trim(),
                    nomineeCompany: nomineeCompany?.trim(),
                    nomineeCountry: nomineeCountry?.trim() || "Uganda",
                    nomineePhoto: nomineePhotoPath,
                    category,
                    nominationReason: nominationReason?.trim() || "",
                    achievements: achievements?.trim(),
                    impactDescription: impactDescription?.trim(),
                    nominatorName: nominatorName.trim(),
                    nominatorEmail: nominatorEmail.toLowerCase().trim(),
                    nominatorPhone: nominatorPhone?.trim(),
                    nominatorOrganization: nominatorOrganization?.trim()
                });

                logger.logInfo('AwardsController', 'Nomination created in database', { 
                    nominationId: nomination._id 
                });
            } catch (dbError) {
                logger.logError('AwardsController', 'Database error creating nomination', {
                    error: dbError.message,
                    code: dbError.code
                });

                // Clean up uploaded file if database save fails
                if (req.file && req.file.path && !useCloudinary) {
                    try {
                        await fs.unlink(req.file.path);
                        logger.logInfo('AwardsController', 'Cleaned up uploaded file after db error', {
                            path: req.file.path
                        });
                    } catch (unlinkError) {
                        logger.logError('AwardsController', 'Error deleting uploaded file', { 
                            error: unlinkError.message 
                        });
                    }
                }

                return res.status(500).json({
                    status: "error",
                    message: "Failed to save nomination to database",
                    error: dbError.code === 11000 
                        ? "A nomination with this information already exists"
                        : "Database error occurred"
                });
            }

            // Populate category information
            try {
                await nomination.populate("category");
                logger.logInfo('AwardsController', 'Category populated', {
                    nominationId: nomination._id,
                    categoryId: nomination.category?._id
                });
            } catch (populateError) {
                logger.logWarning('AwardsController', 'Error populating category', {
                    error: populateError.message,
                    nominationId: nomination._id
                });
                // Don't fail if populate fails
                nomination.category = null;
            }

            // Queue email notification for async processing
            try {
                await emailService.queueNominationSubmissionEmail({
                    nominatorName: nomination.nominatorName,
                    nominatorEmail: nomination.nominatorEmail,
                    nomineeName: nomination.nomineeName,
                    categoryName: nomination.category?.name || 'Unknown Category'
                });
                logger.logInfo('AwardsController', 'Nomination email queued', {
                    nominationId: nomination._id,
                    nominatorEmail: nomination.nominatorEmail
                });
            } catch (emailError) {
                logger.logWarning('AwardsController', 'Error queueing email notification', {
                    error: emailError.message,
                    nominationId: nomination._id
                });
                // Continue without failing the request
            }

            // Invalidate cache
            cache.invalidateNominations();
            logger.logInfo('AwardsController', 'Cache invalidated after nomination', {
                nominationId: nomination._id
            });

            res.status(201).json({
                status: "success",
                message: "Your nomination has been submitted successfully! It will be reviewed before being published.",
                data: { 
                    nomination: {
                        _id: nomination._id,
                        nomineeName: nomination.nomineeName,
                        category: nomination.category,
                        status: nomination.status
                    }
                }
            });
        } catch (error) {
            logger.logError('AwardsController', 'Unhandled error in submitNomination', {
                error: error.message,
                stack: error.stack,
                body: req.body
            });

            // Clean up uploaded file on unhandled errors
            if (req.file && req.file.path && !useCloudinary) {
                try {
                    await fs.unlink(req.file.path);
                    logger.logInfo('AwardsController', 'Cleaned up file after unhandled error');
                } catch (unlinkError) {
                    logger.logError('AwardsController', 'Error deleting file after unhandled error', {
                        error: unlinkError.message
                    });
                }
            }

            // Send appropriate error response
            res.status(500).json({
                status: "error",
                message: "An unexpected error occurred while processing your nomination",
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
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

            // Create cache key based on query params
            const cacheKey = `${category || 'all'}:${status}:${country || 'all'}:${page}:${limit}:${sortBy}:${sortOrder}:${search || 'all'}`;
            
            // Try to get from cache
            const cachedNominations = cache.getCachedNominations(cacheKey);
            if (cachedNominations) {
                logger.logDebug('AwardsController', 'Serving cached nominations', { cacheKey });
                return res.status(200).json({
                    status: "success",
                    data: cachedNominations,
                    cached: true
                });
            }

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
                .limit(parseInt(limit))
                .lean();

            const total = await Nomination.countDocuments(filter);
            const totalPages = Math.ceil(total / parseInt(limit));

            const responseData = {
                nominations,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalItems: total,
                    hasNextPage: parseInt(page) < totalPages,
                    hasPrevPage: parseInt(page) > 1
                }
            };

            // Cache for 5 minutes (voting updates frequently)
            cache.cacheNominations(responseData, cacheKey);
            logger.logDebug('AwardsController', 'Nominations cached', { count: nominations.length, cacheKey });

            res.status(200).json({
                status: "success",
                data: responseData
            });
        } catch (error) {
            logger.logError('AwardsController', error, { context: 'getNominations' });
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

            // Invalidate nominations cache after vote
            cache.invalidateNominations();
            logger.logInfo('AwardsController', 'Vote submitted, cache invalidated', { 
                nominationId: nomination._id,
                voterEmail 
            });

            // Build response with optional email suggestion
            const response = {
                status: "success",
                message: "Vote submitted successfully!",
                data: {
                    nomination: {
                        _id: nomination._id,
                        nomineeName: nomination.nomineeName,
                        totalVotes: nomination.totalVotes
                    }
                }
            };

            // Include email suggestion if available
            if (req.emailSuggestion) {
                response.suggestion = {
                    message: `Did you mean ${req.emailSuggestion}? Your vote was counted, but you might want to use the correct email next time.`,
                    suggestedEmail: req.emailSuggestion
                };
            }

            res.status(200).json(response);
        } catch (error) {
            logger.logError('AwardsController', 'Error submitting vote', { 
                error: error.message, 
                nominationId: req.params.id 
            });
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

            // Invalidate nominations cache after status update
            cache.invalidateNominations();
            logger.logInfo('AwardsController', 'Nomination status updated, cache invalidated', { 
                nominationId: nomination._id,
                newStatus: status 
            });

            res.status(200).json({
                status: "success",
                message: `Nomination status updated to ${status}`,
                data: { nomination }
            });
        } catch (error) {
            logger.logError('AwardsController', 'Error updating nomination status', { 
                error: error.message, 
                nominationId: req.params.id 
            });
            next(error);
        }
    }

    // Update nomination details including photo (admin only)
    async updateNomination(req, res, next) {
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
            const nomination = await Nomination.findById(id);

            if (!nomination) {
                return res.status(404).json({
                    status: "error",
                    message: "Nomination not found"
                });
            }

            // Handle photo upload if provided
            let photoPath = nomination.nomineePhoto;
            if (req.file) {
                // Delete old photo if exists and is local
                if (nomination.nomineePhoto && !nomination.nomineePhoto.startsWith('http')) {
                    const oldPhotoPath = path.join(__dirname, '../../uploads/awards', path.basename(nomination.nomineePhoto));
                    fs.unlink(oldPhotoPath, (err) => {
                        if (err) console.error('Error deleting old photo:', err);
                    });
                }

                // Use Cloudinary URL if available, otherwise use local path
                photoPath = req.file.path || `/uploads/awards/${req.file.filename}`;
            }

            // Update nomination fields
            const updateData = {
                nomineeName: req.body.nomineeName || nomination.nomineeName,
                nomineeTitle: req.body.nomineeTitle || nomination.nomineeTitle,
                nomineeCompany: req.body.nomineeCompany || nomination.nomineeCompany,
                nomineeCountry: req.body.nomineeCountry || nomination.nomineeCountry,
                category: req.body.category || nomination.category,
                nominationReason: req.body.nominationReason !== undefined ? req.body.nominationReason.trim() : nomination.nominationReason,
                achievements: req.body.achievements || nomination.achievements,
                impactDescription: req.body.impactDescription || nomination.impactDescription,
                nominatorName: req.body.nominatorName || nomination.nominatorName,
                nominatorEmail: req.body.nominatorEmail || nomination.nominatorEmail,
                nominatorPhone: req.body.nominatorPhone || nomination.nominatorPhone,
                nominatorOrganization: req.body.nominatorOrganization || nomination.nominatorOrganization,
                nomineePhoto: photoPath,
                updatedBy: req.user._id,
                updatedAt: new Date()
            };

            const updatedNomination = await Nomination.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true }
            ).populate("category");

            // Invalidate nominations cache after update
            cache.invalidateNominations();
            logger.logInfo('AwardsController', 'Nomination updated, cache invalidated', { 
                nominationId: updatedNomination._id 
            });

            res.status(200).json({
                status: "success",
                message: "Nomination updated successfully",
                data: { nomination: updatedNomination }
            });
        } catch (error) {
            logger.logError('AwardsController', 'Error updating nomination', { 
                error: error.message, 
                nominationId: req.params.id 
            });
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

            // Invalidate nominations cache after deletion
            cache.invalidateNominations();
            logger.logInfo('AwardsController', 'Nomination deleted, cache invalidated', { 
                nominationId: id 
            });

            res.status(200).json({
                status: "success",
                message: "Nomination deleted successfully"
            });
        } catch (error) {
            logger.logError('AwardsController', 'Error deleting nomination', { 
                error: error.message, 
                nominationId: req.params.id 
            });
            next(error);
        }
    }

    // Get awards statistics
    async getAwardsStats(req, res, next) {
        try {
            console.log("📊 Getting awards statistics...");
            
            // Check if Nomination model is available
            if (!Nomination) {
                console.error("❌ Nomination model is not defined!");
                return res.status(500).json({
                    status: "error",
                    message: "Failed to load statistics",
                    error: "Nomination model not available"
                });
            }
            
            // Get general stats with error handling
            let stats = [];
            try {
                // Try simple count first to test database connection
                const totalCount = await Nomination.countDocuments();
                console.log("✅ Total nominations count:", totalCount);
                
                // Now try the aggregation
                stats = await Nomination.aggregate([
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
                console.log("✅ General stats aggregation completed:", stats ? stats.length : 0);
            } catch (statsError) {
                console.error("❌ Error getting general stats:", statsError.message);
                console.error("❌ Stats error details:", statsError);
                stats = [];
            }

            // Get category stats with error handling
            let categoryStats = [];
            try {
                categoryStats = await Nomination.aggregate([
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
                        $unwind: {
                            path: "$category",
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $project: {
                            categoryName: "$category.name",
                            count: 1,
                            totalVotes: 1
                        }
                    }
                ]);
                console.log("✅ Category stats:", categoryStats ? categoryStats.length : 0, "categories");
            } catch (categoryError) {
                console.error("❌ Error getting category stats:", categoryError);
                categoryStats = [];
            }

            // Get top nominations with error handling
            let topNominations = [];
            try {
                topNominations = await Nomination.find({ status: "approved" })
                    .sort({ votes: -1 })
                    .limit(10)
                    .populate("category", "name")
                    .select("nomineeName nomineePhoto votes category")
                    .lean(); // Use lean for better performance
                
                console.log("✅ Top nominations:", topNominations ? topNominations.length : 0);
            } catch (topError) {
                console.error("❌ Error getting top nominations:", topError);
                topNominations = [];
            }

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
                    categoryStats: categoryStats || [],
                    topNominations: topNominations || []
                }
            });
        } catch (error) {
            console.error("❌ Error getting awards stats (outer catch):", error);
            console.error("❌ Error stack:", error.stack);
            console.error("❌ Error name:", error.name);
            console.error("❌ Error message:", error.message);
            
            res.status(500).json({
                status: "error",
                message: "Failed to load statistics",
                error: error.message,
                errorType: error.name,
                details: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }
}

module.exports = new AwardsController();