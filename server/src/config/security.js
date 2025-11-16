/**
 * Security Configuration
 * Comprehensive security settings for SAP Technologies application
 */

const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const slowDown = require("express-slow-down");
const mongoSanitize = require("express-mongo-sanitize");
const hpp = require("hpp");
const compression = require("compression");
const winston = require("winston");

// Security Logger Configuration
const securityLogger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: "sap-security" },
  transports: [
    new winston.transports.File({ filename: "logs/security-error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/security-combined.log" }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Rate Limiting Configurations
const createRateLimit = (windowMs, max, message, skipSuccessfulRequests = false) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: message,
      code: "RATE_LIMIT_EXCEEDED",
      timestamp: new Date().toISOString()
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    handler: (req, res) => {
      securityLogger.warn("Rate limit exceeded", {
        ip: req.ip,
        url: req.url,
        userAgent: req.get("User-Agent"),
        timestamp: new Date().toISOString()
      });
      res.status(429).json({
        error: message,
        code: "RATE_LIMIT_EXCEEDED",
        timestamp: new Date().toISOString()
      });
    }
  });
};

// Different rate limits for different endpoints
const rateLimits = {
  // Global rate limit - 5000 requests per 15 minutes (increased for development)
  global: createRateLimit(
    15 * 60 * 1000, // 15 minutes
    5000,
    "Too many requests from this IP, please try again later."
  ),

  // Authentication rate limit - 5 attempts per 15 minutes
  auth: createRateLimit(
    15 * 60 * 1000, // 15 minutes
    5,
    "Too many authentication attempts, please try again later.",
    true // Skip successful requests
  ),

  // Contact form rate limit - 30 submissions per hour
  contact: createRateLimit(
    60 * 60 * 1000, // 1 hour
    30,
    "Too many contact form submissions, please try again later."
  ),

  // File upload rate limit - 10 uploads per hour
  upload: createRateLimit(
    60 * 60 * 1000, // 1 hour
    10,
    "Too many file uploads, please try again later."
  ),

  // Admin operations - 10000 requests per 15 minutes (development friendly)
  admin: createRateLimit(
    15 * 60 * 1000, // 15 minutes
    10000,
    "Too many admin requests, please try again later."
  ),

  // Product inquiry rate limit - 30 inquiries per hour per IP
  inquiry: createRateLimit(
    60 * 60 * 1000, // 1 hour
    30,
    "Too many inquiry submissions, please try again later."
  )
};

// Speed limiter - slows down repeated requests
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 100, // allow 100 requests per windowMs without delay
  delayMs: () => 500, // add 500ms delay per request after delayAfter
  maxDelayMs: 20000, // max delay of 20 seconds
  validate: { delayMs: false }, // disable the warning
  message: {
    error: "Too many requests, slowing down responses.",
    code: "SPEED_LIMIT_APPLIED"
  }
});

// Helmet Security Headers Configuration
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: [
        "'self'", 
        "'unsafe-inline'", 
        "https://fonts.googleapis.com",
        "https://cdnjs.cloudflare.com"
      ],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Required for React development
        "https://cdn.jsdelivr.net"
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
        "https://cdnjs.cloudflare.com"
      ],
      imgSrc: [
        "'self'",
        "data:",
        "blob:",
        "https:"
      ],
      connectSrc: [
        "'self'",
        "http://localhost:5000",
        "https://api.saptechnologies.com"
      ],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: []
    }
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" }
});

// MongoDB Sanitization Configuration
const mongoSanitizeConfig = {
  replaceWith: "_",
  // Disable dryRun to prevent Express 5.x compatibility issues
  dryRun: false,
  onSanitize: ({ req, key }) => {
    securityLogger.warn("MongoDB injection attempt detected", {
      ip: req.ip,
      key,
      url: req.url,
      userAgent: req.get("User-Agent")
    });
  }
};

// HPP (HTTP Parameter Pollution) Configuration
const hppConfig = {
  whitelist: ["tags", "categories"] // Allow arrays for these parameters
};

// Compression Configuration
const compressionConfig = {
  threshold: 1024, // Only compress responses > 1KB
  filter: (req, res) => {
    if (req.headers["x-no-compression"]) {
      return false;
    }
    return compression.filter(req, res);
  }
};

// Security Event Logger
const logSecurityEvent = (event, req, additionalData = {}) => {
  securityLogger.info("Security Event", {
    event,
    ip: req.ip,
    url: req.url,
    method: req.method,
    userAgent: req.get("User-Agent"),
    timestamp: new Date().toISOString(),
    ...additionalData
  });
};

// Suspicious Activity Detection
const detectSuspiciousActivity = (req, res, next) => {
  const suspiciousPatterns = [
    /(\%27)|(\-\-)|(\%23)|(#)/i, // SQL injection patterns (removed quotes for JSON compatibility)
    /<script[^>]*>.*?<\/script>/gi, // XSS patterns
    /javascript:/gi, // JavaScript injection
    /vbscript:/gi, // VBScript injection
    /onload|onerror|onclick/gi, // Event handler injection
    /\.\.\//gi, // Directory traversal
    /\/etc\/passwd/gi, // System file access
    /cmd\.exe|powershell/gi // Command injection
  ];

  // Skip security check for JSON API requests with Content-Type application/json
  const isJsonApiRequest = req.headers['content-type'] && 
                           req.headers['content-type'].includes('application/json') &&
                           req.url.startsWith('/api/');

  if (isJsonApiRequest) {
    return next();
  }

  const checkString = `${req.url} ${JSON.stringify(req.query)} ${JSON.stringify(req.body)}`;
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(checkString)) {
      logSecurityEvent("SUSPICIOUS_ACTIVITY_DETECTED", req, {
        pattern: pattern.toString(),
        suspiciousContent: checkString.substring(0, 200)
      });
      
      return res.status(400).json({
        error: "Suspicious activity detected",
        code: "SECURITY_VIOLATION",
        timestamp: new Date().toISOString()
      });
    }
  }
  
  next();
};

// Request Size Limiter
const requestSizeLimiter = (req, res, next) => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (req.headers["content-length"] && parseInt(req.headers["content-length"]) > maxSize) {
    logSecurityEvent("REQUEST_SIZE_EXCEEDED", req, {
      contentLength: req.headers["content-length"],
      maxAllowed: maxSize
    });
    
    return res.status(413).json({
      error: "Request entity too large",
      code: "REQUEST_TOO_LARGE",
      maxSize: `${maxSize / (1024 * 1024)}MB`
    });
  }
  
  next();
};

// IP Whitelist/Blacklist
const ipFilter = (req, res, next) => {
  const clientIP = req.ip;
  
  // Example blacklist - add known malicious IPs
  const blacklistedIPs = [
    // Add malicious IPs here
  ];
  
  if (blacklistedIPs.includes(clientIP)) {
    logSecurityEvent("BLACKLISTED_IP_ACCESS", req, {
      blacklistedIP: clientIP
    });
    
    return res.status(403).json({
      error: "Access denied",
      code: "IP_BLACKLISTED"
    });
  }
  
  next();
};

// Secure Headers Middleware
const secureHeaders = (req, res, next) => {
  // Remove server identification
  res.removeHeader("X-Powered-By");
  
  // Additional security headers
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
  
  next();
};

module.exports = {
  rateLimits,
  speedLimiter,
  helmetConfig,
  mongoSanitizeConfig,
  hppConfig,
  compressionConfig,
  logSecurityEvent,
  detectSuspiciousActivity,
  requestSizeLimiter,
  ipFilter,
  secureHeaders,
  securityLogger
};