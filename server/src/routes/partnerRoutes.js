const express = require("express");
const {
  getPartners,
  getAllPartners,
  getPartnerById,
  createPartner,
  updatePartner,
  deletePartner
} = require("../controllers/partnerController");
const { adminAuth } = require("../middleware/adminAuth");
const { validatePartner } = require("../middleware/validation");
const { partnerUpload } = require("../config/fileUpload"); // Use centralized upload config

const router = express.Router();

// Public routes
router.get("/public", getPartners);

// Admin routes (require authentication)
router.use(adminAuth); // Apply admin authentication to all routes below

router.get("/", getAllPartners);
router.get("/:id", getPartnerById);
router.post("/", partnerUpload.single("logo"), validatePartner, createPartner);
router.put("/:id", partnerUpload.single("logo"), validatePartner, updatePartner);
router.delete("/:id", deletePartner);

module.exports = router;