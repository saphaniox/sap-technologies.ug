const { body, validationResult } = require("express-validator");

const finish = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg, errors: errors.array() });
  }
  next();
};

const customerFields = () => [
  body("customerName").optional({ values: "falsy" }).isString().bail().trim().isLength({ max: 100 }).withMessage("Name cannot exceed 100 characters"),
  body("customerEmail").isString().bail().trim().isEmail().withMessage("Please provide a valid email address"),
  body("customerPhone").optional({ values: "falsy" }).isString().bail().trim().isLength({ max: 20 }).withMessage("Phone cannot exceed 20 characters"),
  body("preferredContact").optional().isIn(["email", "phone", "both"]).withMessage("Invalid preferred contact method"),
  body("customerPhone").custom((phone, { req }) => {
    return !["phone", "both"].includes(req.body.preferredContact) || (typeof phone === "string" && Boolean(phone.trim()));
  }).withMessage("Please provide a phone number for phone contact")
];

const validateInquiry = [
  ...customerFields(),
  body("productId").isMongoId().withMessage("Invalid product ID"),
  body("quantity").optional().isInt({ min: 1, max: 1000000 }).withMessage("Quantity must be a positive whole number"),
  body("message").optional({ values: "falsy" }).isString().bail().isLength({ max: 1000 }).withMessage("Message cannot exceed 1000 characters"),
  finish
];

const validateCartInquiry = [
  ...customerFields(),
  body("items").isArray({ min: 1, max: 100 }).withMessage("Please include between 1 and 100 cart items"),
  body("items.*.productId").isMongoId().withMessage("Invalid cart product ID"),
  body("items.*.quantity").isInt({ min: 1, max: 1000000 }).withMessage("Quantity must be a positive whole number"),
  body("message").optional({ values: "falsy" }).isString().bail().isLength({ max: 1000 }).withMessage("Cart message cannot exceed 1000 characters"),
  finish
];

const validateQuote = [
  ...customerFields(),
  body("customerName").isString().bail().trim().notEmpty().withMessage("Please provide your name"),
  body("serviceId").isString().bail().trim().notEmpty().withMessage("Service is required"),
  body("serviceName").isString().bail().trim().isLength({ min: 1, max: 200 }).withMessage("Service name is required (maximum 200 characters)"),
  body("projectDetails").optional({ values: "falsy" }).isString().bail().isLength({ max: 2000 }).withMessage("Project details cannot exceed 2000 characters"),
  body("budget").optional({ values: "falsy" }).isIn(["< $5,000", "$5,000 - $10,000", "$10,000 - $25,000", "$25,000 - $50,000", "> $50,000", "Not sure"]).withMessage("Invalid budget selection"),
  body("timeline").optional({ values: "falsy" }).isIn(["ASAP", "1-2 weeks", "1 month", "2-3 months", "3+ months", "Flexible"]).withMessage("Invalid timeline selection"),
  finish
];

module.exports = { validateInquiry, validateCartInquiry, validateQuote };
