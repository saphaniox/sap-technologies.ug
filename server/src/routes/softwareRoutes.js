const express = require("express");
const router = express.Router();
const softwareController = require("../controllers/softwareController");
const { adminAuth } = require("../middleware/adminAuth");
const { softwareUpload } = require("../config/fileUpload");

// Admin routes (must come before dynamic :id routes)
router.post("/", adminAuth, softwareUpload.array("images", 5), softwareController.createSoftware);
router.get("/admin/stats", adminAuth, softwareController.getStats);

// Public routes
router.get("/", softwareController.getAllSoftware);
router.get("/categories", softwareController.getCategories);
router.get("/:id", softwareController.getSoftwareById);
router.post("/:id/click", softwareController.trackClick);

// Admin routes for specific software
router.put("/:id", adminAuth, softwareUpload.array("images", 5), softwareController.updateSoftware);
router.delete("/:id", adminAuth, softwareController.deleteSoftware);

module.exports = router;
