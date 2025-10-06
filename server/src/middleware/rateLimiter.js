const rateLimit = require("express-rate-limit");

// General rate limiter
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        status: "error",
        message: "Too many requests from this IP, please try again later."
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Auth rate limiter (stricter)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // limit each IP to 50 auth requests per windowMs (more reasonable for development)
    message: {
        status: "error",
        message: "Too many authentication attempts, please try again later."
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Contact form rate limiter
const contactLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // limit each IP to 10 contact form submissions per hour (more reasonable for testing)
    message: {
        status: "error",
        message: "Too many contact form submissions, please try again later."
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Newsletter rate limiter
const newsletterLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // limit each IP to 5 newsletter actions per hour
    message: {
        status: "error",
        message: "Too many newsletter requests, please try again later."
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    generalLimiter,
    authLimiter,
    contactLimiter,
    newsletterLimiter
};
