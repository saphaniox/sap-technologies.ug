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
const { adminMiddleware } = require("../middleware/auth");
const { iotUpload } = require("../config/fileUpload");
const { compressionPresets } = require("../middleware/imageCompression");

// Public routes
router.get("/", getAllIoTProjects);
router.get("/categories", getCategories);

// Admin routes (must come before /:id to avoid route conflicts)
router.get("/admin/stats", adminMiddleware, getAdminStats);
router.post("/", adminMiddleware, iotUpload.array("images", 10), compressionPresets.highQuality, createIoTProject);
router.put("/:id", adminMiddleware, iotUpload.array("images", 10), compressionPresets.highQuality, updateIoTProject);
router.delete("/:id", adminMiddleware, deleteIoTProject);

// Public dynamic routes (must come after specific routes)
router.get("/:id", getIoTProjectById);
router.post("/:id/like", likeProject);

module.exports = router;
