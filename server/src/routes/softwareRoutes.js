const express = require("express");
const router = express.Router();
const softwareController = require("../controllers/softwareController");
const { protect } = require("../middleware/auth");
const upload = require("../middleware/upload");

// Public routes
router.get("/", softwareController.getAllSoftware);
router.get("/categories", softwareController.getCategories);
router.get("/:id", softwareController.getSoftwareById);
router.post("/:id/click", softwareController.trackClick);

// Admin routes
router.post("/", protect, upload.array("images", 5), softwareController.createSoftware);
router.put("/:id", protect, upload.array("images", 5), softwareController.updateSoftware);
router.delete("/:id", protect, softwareController.deleteSoftware);
router.get("/admin/stats", protect, softwareController.getStats);

module.exports = router;
