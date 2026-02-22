const express = require("express");
const router = express.Router();
const {
  getAllIoTProjects,
  getIoTProjectById,
  createIoTProject,
  updateIoTProject,
  deleteIoTProject,
  getCategories,
  likeProject,
  getAdminStats
} = require("../controllers/iotController");
const { adminAuth } = require("../middleware/auth");
const { iotUpload } = require("../config/fileUpload");
const { compressionPresets } = require("../middleware/imageCompression");

// Public routes
router.get("/", getAllIoTProjects);
router.get("/categories", getCategories);

// Admin routes (must come before /:id to avoid route conflicts)
router.get("/admin/stats", adminAuth, getAdminStats);
router.post("/", adminAuth, iotUpload.array("images", 10), compressionPresets.highQuality, createIoTProject);
router.put("/:id", adminAuth, iotUpload.array("images", 10), compressionPresets.highQuality, updateIoTProject);
router.delete("/:id", adminAuth, deleteIoTProject);

// Public dynamic routes (must come after specific routes)
router.get("/:id", getIoTProjectById);
router.post("/:id/like", likeProject);

module.exports = router;
