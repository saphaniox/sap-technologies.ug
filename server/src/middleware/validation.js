/**
 * Enhanced Input Validation and Sanitization Module
 * Comprehensive validation for all user inputs with security enhancements
 */

const { body, param, query, validationResult } = require("express-validator");
const validator = require("validator");
const { AppError } = require("./errorHandler");

// Security logging (will be enhanced with winston later)
const logSecurityEvent = (event, details) => {
  console.log(`[SECURITY] ${new Date().toISOString()} - ${event}:`, details);
};

// Custom sanitization functions
const sanitizeInput = (input) => {
  if (typeof input !== "string") return input;
  
  // Remove HTML tags and dangerous characters
  let sanitized = input
    .replace(/<script[^>]*>.*?<\/script>/gi, "") // Remove script tags
    .replace(/<[^>]+>/g, "") // Remove HTML tags
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/vbscript:/gi, "") // Remove vbscript: protocol
    .replace(/onload|onerror|onclick|onmouseover/gi, "") // Remove event handlers
    .trim();
  
  // Use validator.js to escape HTML entities
  sanitized = validator.escape(sanitized);
  
  return sanitized;
};

// Advanced password validation
const isStrongPassword = (password) => {
  return validator.isStrongPassword(password, {
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1
  });
};

// Email validation with domain checking
const isValidEmail = (email) => {
  if (!validator.isEmail(email)) return false;
  
  // Check against common disposable email domains
  const disposableDomains = [
    "10minutemail.com", "tempmail.org", "guerrillamail.com",
    "mailinator.com", "throwaway.email"
  ];
  
  const domain = email.split("@")[1];
  return !disposableDomains.includes(domain.toLowerCase());
};

// Enhanced validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    // Log validation failures for security monitoring
    logSecurityEvent("VALIDATION_FAILED", {
      ip: req.ip,
      url: req.url,
      errors: errors.array(),
      userAgent: req.get("User-Agent")
    });
    
    console.log("=== VALIDATION ERRORS ===");
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    console.log("Validation errors:", JSON.stringify(errors.array(), null, 2));
    console.log("=== END VALIDATION ERRORS ===");
    
    const errorMessages = errors.array().map(error => error.msg);
    return next(new AppError(`Validation error: ${errorMessages.join(", ")}`, 400));
  }
  next();
};

// Enhanced User registration validation with security
const validateRegistration = [
    body("name")
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage("Name must be between 2 and 50 characters")
        .matches(/^[a-zA-Z\s\-"\.]+$/)
        .withMessage("Name contains invalid characters")
        .customSanitizer(sanitizeInput),
    body("email")
        .trim()
        .normalizeEmail()
        .custom((value) => {
          if (!isValidEmail(value)) {
            throw new Error("Invalid email address or disposable email not allowed");
          }
          return true;
        }),
    body("password")
        .isLength({ min: 8, max: 128 })
        .withMessage("Password must be between 8 and 128 characters")
        .custom((value) => {
          if (!isStrongPassword(value)) {
            throw new Error("Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 symbol");
          }
          return true;
        }),
    body("phone")
        .optional()
        .isMobilePhone()
        .withMessage("Please provide a valid phone number"),
    handleValidationErrors
];

// Enhanced User login validation
const validateLogin = [
    body("email")
        .trim()
        .normalizeEmail()
        .isEmail()
        .withMessage("Please provide a valid email"),
    body("password")
        .notEmpty()
        .withMessage("Password is required")
        .isLength({ max: 128 })
        .withMessage("Password too long"),
    handleValidationErrors
];

// Enhanced Contact form validation
const validateContact = [
    body("name")
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage("Name must be between 2 and 100 characters")
        .matches(/^[a-zA-Z\s\-"\.]+$/)
        .withMessage("Name contains invalid characters")
        .customSanitizer(sanitizeInput),
    body("email")
        .trim()
        .normalizeEmail()
        .custom((value) => {
          if (!isValidEmail(value)) {
            throw new Error("Invalid email address");
          }
          return true;
        }),
    body("subject")
        .optional()
        .trim()
        .isLength({ min: 3, max: 200 })
        .withMessage("Subject must be between 3 and 200 characters")
        .customSanitizer(sanitizeInput),
    body("message")
        .trim()
        .isLength({ min: 10, max: 2000 })
        .withMessage("Message must be between 10 and 2000 characters")
        .customSanitizer(sanitizeInput),
    handleValidationErrors
];

// Enhanced Newsletter subscription validation
const validateNewsletter = [
    body("email")
        .trim()
        .isEmail()
        .withMessage("Invalid email format")
        .normalizeEmail()
        .custom((value) => {
          if (!isValidEmail(value)) {
            throw new Error("Invalid email address");
          }
          return true;
        }),
    handleValidationErrors
];

// Enhanced Password change validation
const validatePasswordChange = [
    body("currentPassword")
        .notEmpty()
        .withMessage("Current password is required")
        .isLength({ max: 128 })
        .withMessage("Password too long"),
    body("newPassword")
        .isLength({ min: 8, max: 128 })
        .withMessage("New password must be between 8 and 128 characters")
        .custom((value) => {
          if (!isStrongPassword(value)) {
            throw new Error("New password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 symbol");
          }
          return true;
        }),
    body("confirmPassword")
        .custom((value, { req }) => {
          if (value !== req.body.newPassword) {
            throw new Error("Password confirmation does not match");
          }
          return true;
        }),
    handleValidationErrors
];

// Enhanced Profile update validation
const validateProfileUpdate = [
    body("name")
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage("Name must be between 2 and 50 characters")
        .matches(/^[a-zA-Z\s\-"\.]+$/)
        .withMessage("Name contains invalid characters")
        .customSanitizer(sanitizeInput),
    body("phone")
        .optional()
        .isMobilePhone()
        .withMessage("Please provide a valid phone number"),
    body("bio")
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage("Bio must not exceed 1000 characters")
        .customSanitizer(sanitizeInput),
    handleValidationErrors
];

// Service validation
const validateService = [
    body("title")
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage("Service title must be between 2 and 100 characters"),
    body("description")
        .trim()
        .isLength({ min: 10, max: 500 })
        .withMessage("Service description must be between 10 and 500 characters"),
    body("longDescription")
        .optional()
        .trim()
        .custom((value) => {
            if (value && value.length > 0) {
                if (value.length < 50 || value.length > 2000) {
                    throw new Error("Service detailed description must be between 50 and 2000 characters");
                }
            }
            return true;
        }),
    body("deliveryTime")
        .optional()
        .trim()
        .custom((value) => {
            if (value && value.length > 0) {
                if (value.length < 3 || value.length > 50) {
                    throw new Error("Delivery time must be between 3 and 50 characters");
                }
            }
            return true;
        }),
    body("icon")
        .notEmpty()
        .isLength({ min: 1, max: 2 })
        .withMessage("Service icon is required and must be 1-2 characters"),
    body("category")
        .isIn(["Web Development", "Mobile Development", "IoT Solutions", "Graphics Design", "Electrical Engineering", "Other"])
        .withMessage("Invalid service category"),
    body("status")
        .optional()
        .isIn(["active", "inactive", "draft"])
        .withMessage("Invalid service status"),
    body("featured")
        .optional()
        .isBoolean()
        .withMessage("Featured must be a boolean value"),
    // Make pricing optional since it comes as JSON string
    body("price")
        .optional(),
    body("features")
        .optional(),
    body("technologies")
        .optional(),
    handleValidationErrors
];

// Project validation
const validateProject = [
    body("title")
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage("Project title must be between 2 and 100 characters"),
    body("description")
        .trim()
        .isLength({ min: 10, max: 500 })
        .withMessage("Project description must be between 10 and 500 characters"),
    body("longDescription")
        .optional()
        .trim()
        .custom((value) => {
            if (value && value.length > 0) {
                if (value.length < 50 || value.length > 5000) {
                    throw new Error("Project detailed description must be between 50 and 5000 characters");
                }
            }
            return true;
        }),
    body("projectUrl")
        .optional()
        .trim()
        .custom((value) => {
            if (value && value.length > 0) {
                if (value.length < 5 || value.length > 200) {
                    throw new Error("Project URL must be between 5 and 200 characters");
                }
            }
            return true;
        }),
    body("repositoryUrl")
        .optional()
        .trim()
        .custom((value) => {
            if (value && value.length > 0) {
                if (value.length < 5 || value.length > 200) {
                    throw new Error("Repository URL must be between 5 and 200 characters");
                }
            }
            return true;
        }),
    body("category")
        .isIn([
          "E-commerce Platform",
          "Learning Management System",
          "Mobile Application",
          "IoT Solution",
          "Web Application",
          "Portfolio Website",
          "Business Platform",
          "Graphics Design",
          "Electrical Project",
          "Other"
        ])
        .withMessage("Invalid project category"),
    body("status")
        .optional()
        .isIn(["planning", "in-progress", "completed", "on-hold", "cancelled"])
        .withMessage("Invalid project status"),
    body("visibility")
        .optional()
        .isIn(["public", "private", "draft"])
        .withMessage("Invalid project visibility"),
    body("featured")
        .optional(),
    // FormData fields come as strings, so make these optional
    body("client")
        .optional(),
    body("timeline")
        .optional(),
    body("technologies")
        .optional(),
    body("tags")
        .optional(),
    handleValidationErrors
];

// Enhanced Partner validation
const validatePartner = [
    body("name")
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage("Partner name is required and must be less than 100 characters")
        .customSanitizer(sanitizeInput),
    body("website")
        .optional()
        .trim()
        .custom((value) => {
          if (value && !validator.isURL(value, { protocols: ["http", "https"] })) {
            throw new Error("Website must be a valid HTTP/HTTPS URL");
          }
          return true;
        }),
    body("description")
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage("Description must be less than 1000 characters")
        .customSanitizer(sanitizeInput),
    body("isActive")
        .optional()
        .isBoolean()
        .withMessage("isActive must be a boolean"),
    body("order")
        .optional()
        .isInt({ min: 0, max: 9999 })
        .withMessage("Order must be between 0 and 9999"),
    handleValidationErrors
];

// Advanced input sanitization middleware
const sanitizeRequest = (req, res, next) => {
  // Sanitize request body
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeObject(req.body);
  }
  
  // Sanitize query parameters
  if (req.query && typeof req.query === "object") {
    req.query = sanitizeObject(req.query);
  }
  
  // Sanitize URL parameters
  if (req.params && typeof req.params === "object") {
    req.params = sanitizeObject(req.params);
  }
  
  next();
};

// Recursive object sanitization
const sanitizeObject = (obj) => {
  if (obj === null || obj === undefined) return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  if (typeof obj === "object") {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }
  
  if (typeof obj === "string") {
    return sanitizeInput(obj);
  }
  
  return obj;
};

// MongoDB ObjectId validation
const validateObjectId = [
    param("id")
        .custom((value) => {
          if (!validator.isMongoId(value)) {
            throw new Error("Invalid ID format");
          }
          return true;
        }),
    handleValidationErrors
];

// File upload validation
const validateFileUpload = (allowedTypes = [], maxSize = 5 * 1024 * 1024) => {
  return (req, res, next) => {
    if (!req.file) {
      return next();
    }
    
    const file = req.file;
    
    // Check file size
    if (file.size > maxSize) {
      return next(new AppError(`File size exceeds ${maxSize / (1024 * 1024)}MB limit`, 400));
    }
    
    // Check file type
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
      return next(new AppError(`File type not allowed. Allowed types: ${allowedTypes.join(", ")}`, 400));
    }
    
    // Check for dangerous file names
    const dangerousExtensions = [".exe", ".bat", ".cmd", ".com", ".scr", ".vbs", ".js", ".php", ".asp"];
    const fileName = file.originalname.toLowerCase();
    
    for (const ext of dangerousExtensions) {
      if (fileName.endsWith(ext)) {
        return next(new AppError("Dangerous file type detected", 400));
      }
    }
    
    // Check for path traversal in filename
    if (file.originalname.includes("..") || file.originalname.includes("/") || file.originalname.includes("\\")) {
      return next(new AppError("Invalid file name", 400));
    }
    
    next();
  };
};

// Search query validation
const validateSearch = [
    query("q")
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage("Search query too long")
        .customSanitizer(sanitizeInput),
    query("page")
        .optional()
        .isInt({ min: 1, max: 1000 })
        .withMessage("Invalid page number"),
    query("limit")
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage("Invalid limit value"),
    handleValidationErrors
];

// Enhanced Partnership request validation
const validatePartnershipRequest = [
    body("companyName")
        .trim()
        .isLength({ min: 2, max: 200 })
        .withMessage("Company name must be between 2 and 200 characters")
        .matches(/^[a-zA-Z0-9\s\-\.\&\,]+$/)
        .withMessage("Company name contains invalid characters")
        .customSanitizer(sanitizeInput),
    body("contactEmail")
        .trim()
        .normalizeEmail()
        .custom((value) => {
          if (!isValidEmail(value)) {
            throw new Error("Invalid email address");
          }
          return true;
        }),
    body("website")
        .optional()
        .trim()
        .isURL({
          protocols: ['http', 'https'],
          require_tld: true,
          require_protocol: false
        })
        .withMessage("Invalid website URL")
        .isLength({ max: 500 })
        .withMessage("Website URL too long")
        .customSanitizer(sanitizeInput),
    body("description")
        .trim()
        .isLength({ min: 20, max: 2000 })
        .withMessage("Description must be between 20 and 2000 characters")
        .customSanitizer(sanitizeInput),
    body("contactPerson")
        .trim()
        .isLength({ min: 2, max: 200 })
        .withMessage("Contact person name must be between 2 and 200 characters")
        .matches(/^[a-zA-Z\s\-"\.]+$/)
        .withMessage("Contact person name contains invalid characters")
        .customSanitizer(sanitizeInput),
    handleValidationErrors
];

module.exports = {
    validateRegistration,
    validateLogin,
    validateContact,
    validateNewsletter,
    validatePasswordChange,
    validateProfileUpdate,
    validateService,
    validateProject,
    validatePartner,
    validatePartnershipRequest,
    validateObjectId,
    validateFileUpload,
    validateSearch,
    handleValidationErrors,
    sanitizeRequest,
    sanitizeInput,
    isStrongPassword,
    isValidEmail,
    logSecurityEvent
};
