const express = require("express");
const router = express.Router();
const { body, param, query } = require("express-validator");
const awardsController = require("../controllers/awardsController");
const { adminAuth } = require("../middleware/adminAuth");
const awardsUpload = require("../config/awardsUpload");
const path = require("path");

// Configure multer for awards photos (nominee photos)
const awardPhotoUpload = awardsUpload.single("nomineePhoto");

// Validation middleware
const validateNomination = [
    body("nomineeName")
        .trim()
        .notEmpty()
        .withMessage("Nominee name is required")
        .isLength({ min: 2, max: 100 })
        .withMessage("Nominee name must be between 2 and 100 characters"),
    
    body("nomineeTitle")
        .optional()
        .trim()
        .isLength({ max: 150 })
        .withMessage("Nominee title cannot exceed 150 characters"),
    
    body("nomineeCompany")
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage("Company name cannot exceed 100 characters"),
    
    body("nomineeCountry")
        .optional()
        .trim()
        .default("Uganda"),
    
    body("category")
        .notEmpty()
        .withMessage("Award category is required")
        .isMongoId()
        .withMessage("Invalid category ID"),
    
    body("nominationReason")
        .trim()
        .notEmpty()
        .withMessage("Nomination reason is required")
        .isLength({ min: 50, max: 1000 })
        .withMessage("Nomination reason must be between 50 and 1000 characters"),
    
    body("achievements")
        .optional()
        .trim()
        .isLength({ max: 1500 })
        .withMessage("Achievements cannot exceed 1500 characters"),
    
    body("impactDescription")
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage("Impact description cannot exceed 1000 characters"),
    
    body("nominatorName")
        .trim()
        .notEmpty()
        .withMessage("Nominator name is required")
        .isLength({ min: 2, max: 100 })
        .withMessage("Nominator name must be between 2 and 100 characters"),
    
    body("nominatorEmail")
        .trim()
        .notEmpty()
        .withMessage("Nominator email is required")
        .isEmail()
        .withMessage("Please provide a valid email address"),
    
    body("nominatorPhone")
        .optional()
        .trim()
        .matches(/^[\+]?[0-9\s\-\(\)]{10,15}$/)
        .withMessage("Please provide a valid phone number"),
    
    body("nominatorOrganization")
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage("Organization name cannot exceed 100 characters")
];

const validateCategory = [
    body("name")
        .trim()
        .notEmpty()
        .withMessage("Category name is required")
        .isLength({ min: 2, max: 100 })
        .withMessage("Category name must be between 2 and 100 characters"),
    
    body("description")
        .trim()
        .notEmpty()
        .withMessage("Category description is required")
        .isLength({ min: 10, max: 500 })
        .withMessage("Category description must be between 10 and 500 characters"),
    
    body("icon")
        .optional()
        .trim()
        .isLength({ max: 10 })
        .withMessage("Icon cannot exceed 10 characters")
];

const validateVote = [
    body("voterEmail")
        .trim()
        .notEmpty()
        .withMessage("Voter email is required")
        .isEmail()
        .withMessage("Please provide a valid email address"),
    
    body("voterName")
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage("Voter name cannot exceed 100 characters")
];

const validateStatusUpdate = [
    body("status")
        .notEmpty()
        .withMessage("Status is required")
        .isIn(["pending", "approved", "rejected", "winner", "finalist"])
        .withMessage("Invalid status value"),
    
    body("adminNotes")
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage("Admin notes cannot exceed 500 characters")
];

// =====================
// PUBLIC ROUTES
// =====================

// Get all award categories
router.get("/categories", awardsController.getCategories);

// Get all approved nominations (with filtering and pagination)
router.get("/nominations", awardsController.getNominations);

// Get single nomination by ID or slug
router.get("/nominations/:id", awardsController.getNomination);

// Submit new nomination
router.post(
    "/nominations",
    awardPhotoUpload,
    validateNomination,
    awardsController.submitNomination
);

// Vote for a nomination
router.post(
    "/nominations/:id/vote",
    param("id").isMongoId().withMessage("Invalid nomination ID"),
    validateVote,
    awardsController.voteForNomination
);

// Check vote status for email
router.get(
    "/nominations/:id/vote-status",
    param("id").isMongoId().withMessage("Invalid nomination ID"),
    query("email").isEmail().withMessage("Valid email is required"),
    awardsController.checkVoteStatus
);

// =====================
// ADMIN ROUTES
// =====================

// Get all nominations for admin (including pending)
router.get(
    "/admin/nominations",
    adminAuth,
    awardsController.getAdminNominations
);

// Update nomination status
router.patch(
    "/admin/nominations/:id/status",
    adminAuth,
    param("id").isMongoId().withMessage("Invalid nomination ID"),
    validateStatusUpdate,
    awardsController.updateNominationStatus
);

// Delete nomination
router.delete(
    "/admin/nominations/:id",
    adminAuth,
    param("id").isMongoId().withMessage("Invalid nomination ID"),
    awardsController.deleteNomination
);

// Create new award category
router.post(
    "/admin/categories",
    adminAuth,
    validateCategory,
    awardsController.createCategory
);

// Update award category
router.put(
    "/admin/categories/:id",
    adminAuth,
    param("id").isMongoId().withMessage("Invalid category ID"),
    validateCategory,
    awardsController.updateCategory
);

// Delete award category
router.delete(
    "/admin/categories/:id",
    adminAuth,
    param("id").isMongoId().withMessage("Invalid category ID"),
    awardsController.deleteCategory
);

// Get awards statistics
router.get(
    "/admin/stats",
    adminAuth,
    awardsController.getAwardsStats
);

module.exports = router;