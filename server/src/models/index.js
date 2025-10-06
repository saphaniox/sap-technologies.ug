// Export all models
const User = require("./User");
const Contact = require("./Contact");
const Newsletter = require("./Newsletter");
const Service = require("./Service");
const Project = require("./Project");
const Partner = require("./Partner");
const PartnershipRequest = require("./PartnershipRequest");
const Product = require("./Product");
const ProductInquiry = require("./ProductInquiry");
const ServiceQuote = require("./ServiceQuote");
const Certificate = require("./Certificate");
const { AwardCategory, Nomination } = require("./Award");

module.exports = {
    User,
    Contact,
    Newsletter,
    Service,
    Project,
    Partner,
    PartnershipRequest,
    Product,
    ProductInquiry,
    ServiceQuote,
    Certificate,
    AwardCategory,
    Nomination
};
