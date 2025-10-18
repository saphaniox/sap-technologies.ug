const express = require("express");
const router = express.Router();
const multer = require("multer");
const { body, param, query } = require("express-validator");
const productController = require("../controllers/productController");
const { adminAuth } = require("../middleware/adminAuth");
const { productUpload } = require("../config/fileUpload");

// Validation middleware
const validateProduct = [
    body("name")
        .trim()
        .notEmpty()
        .withMessage("Product name is required")
        .isLength({ min: 2, max: 100 })
        .withMessage("Product name must be between 2 and 100 characters"),
    
    body("shortDescription")
        .trim()
        .notEmpty()
        .withMessage("Short description is required")
        .isLength({ min: 10, max: 200 })
        .withMessage("Short description must be between 10 and 200 characters"),
    
    body("technicalDescription")
        .trim()
        .notEmpty()
        .withMessage("Technical description is required")
        .isLength({ min: 20, max: 1000 })
        .withMessage("Technical description must be between 20 and 1000 characters"),
    
    body("category")
        .notEmpty()
        .withMessage("Category is required")
        .isIn([
            // Software & Digital
            "Software Solutions",
            "Web Applications", 
            "Mobile Apps",
            "Desktop Applications",
            "Enterprise Software",
            "SaaS Products",
            
            // Hardware & Electronics
            "IoT Devices",
            "Hardware",
            "Electronics", 
            "Electricals",
            "Networking Equipment",
            "Computer Hardware",
            "Smart Home Devices",
            
            // Emerging Tech
            "AI/ML Products",
            "Automation Solutions",
            "Robotics",
            "Blockchain Solutions",
            "Cloud Services",
            
            // Industry Specific
            "Security Solutions",
            "POS Systems",
            "Medical Devices",
            "Agricultural Tech",
            "Educational Tech",
            "Financial Tech",
            
            // General
            "Accessories",
            "Components",
            "Tools & Equipment",
            "Other"
        ])
        .withMessage("Invalid category"),
    
    body("displayOrder")
        .optional()
        .isInt({ min: 0 })
        .withMessage("Display order must be a non-negative integer"),
    
    body("isActive")
        .optional()
        .isBoolean()
        .withMessage("isActive must be a boolean"),
    
    body("isFeatured")
        .optional()
        .isBoolean()
        .withMessage("isFeatured must be a boolean")
];

const validateProductUpdate = [
    body("name")
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage("Product name must be between 2 and 100 characters"),
    
    body("shortDescription")
        .optional()
        .trim()
        .isLength({ min: 10, max: 200 })
        .withMessage("Short description must be between 10 and 200 characters"),
    
    body("technicalDescription")
        .optional()
        .trim()
        .isLength({ min: 20, max: 1000 })
        .withMessage("Technical description must be between 20 and 1000 characters"),
    
    body("category")
        .optional()
        .isIn([
            // Software & Digital
            "Software Solutions",
            "Web Applications", 
            "Mobile Apps",
            "Desktop Applications",
            "Enterprise Software",
            "SaaS Products",
            
            // Hardware & Electronics
            "IoT Devices",
            "Hardware",
            "Electronics", 
            "Electricals",
            "Networking Equipment",
            "Computer Hardware",
            "Smart Home Devices",
            
            // Emerging Tech
            "AI/ML Products",
            "Automation Solutions",
            "Robotics",
            "Blockchain Solutions",
            "Cloud Services",
            
            // Industry Specific
            "Security Solutions",
            "POS Systems",
            "Medical Devices",
            "Agricultural Tech",
            "Educational Tech",
            "Financial Tech",
            
            // General
            "Accessories",
            "Components",
            "Tools & Equipment",
            "Other"
        ])
        .withMessage("Invalid category"),
    
    body("displayOrder")
        .optional()
        .isInt({ min: 0 })
        .withMessage("Display order must be a non-negative integer"),
    
    body("isActive")
        .optional()
        .isBoolean()
        .withMessage("isActive must be a boolean"),
    
    body("isFeatured")
        .optional()
        .isBoolean()
        .withMessage("isFeatured must be a boolean")
];

// =====================
// PUBLIC ROUTES
// =====================

// Get all active products
router.get(
    "/",
    [
        query("category").optional().trim(),
        query("featured").optional().isIn(["true", "false"]),
        query("limit").optional().isInt({ min: 1, max: 100 }),
        query("sort").optional().isIn(["displayOrder", "name", "category", "newest"])
    ],
    productController.getProducts
);

// Get product categories
router.get(
    "/categories",
    productController.getCategories
);

// Get single product by ID
router.get(
    "/:id",
    param("id").isMongoId().withMessage("Invalid product ID"),
    productController.getProduct
);

// =====================
// ADMIN ROUTES
// =====================

// Get all products for admin (includes inactive)
router.get(
    "/admin/products",
    adminAuth,
    [
        query("page").optional().isInt({ min: 1 }),
        query("limit").optional().isInt({ min: 1, max: 100 }),
        query("search").optional().trim(),
        query("category").optional().trim(),
        query("status").optional().isIn(["all", "active", "inactive"])
    ],
    productController.getProductsAdmin
);

// Get product analytics
router.get(
    "/admin/analytics",
    adminAuth,
    productController.getProductAnalytics
);

// Multer error handling middleware
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                status: "error",
                message: "File size too large. Maximum size is 10MB."
            });
        }
        return res.status(400).json({
            status: "error",
            message: `File upload error: ${err.message}`
        });
    } else if (err) {
        return res.status(400).json({
            status: "error",
            message: err.message || "File upload failed"
        });
    }
    next();
};

// Create new product
router.post(
    "/admin/products",
    adminAuth,
    productUpload.single("productImage"),
    handleMulterError,
    validateProduct,
    productController.createProduct
);

// Update product
router.put(
    "/admin/products/:id",
    adminAuth,
    param("id").isMongoId().withMessage("Invalid product ID"),
    productUpload.single("productImage"),
    handleMulterError,
    validateProductUpdate,
    productController.updateProduct
);

// Update product display order
router.put(
    "/admin/products-order",
    adminAuth,
    [
        body("products")
            .isArray()
            .withMessage("Products must be an array")
            .notEmpty()
            .withMessage("Products array cannot be empty"),
        body("products.*.id")
            .isMongoId()
            .withMessage("Invalid product ID"),
        body("products.*.displayOrder")
            .isInt({ min: 0 })
            .withMessage("Display order must be a non-negative integer")
    ],
    productController.updateProductOrder
);

// Delete product
router.delete(
    "/admin/products/:id",
    adminAuth,
    param("id").isMongoId().withMessage("Invalid product ID"),
    productController.deleteProduct
);

module.exports = router;