const express = require("express");
const multer = require("multer");
const { ServiceController, ProjectController } = require("../controllers/serviceProjectController");
const { adminAuth } = require("../middleware/adminAuth");
const validation = require("../middleware/validation");
const { serviceUpload, projectUpload } = require("../config/fileUpload");
const { compressionPresets } = require("../middleware/imageCompression");

const router = express.Router();

const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        status: "error",
        message: "File size exceeds limit",
        error: err.message
      });
    }

    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        status: "error",
        message: "Too many files uploaded",
        error: err.message
      });
    }

    return res.status(400).json({
      status: "error",
      message: `File upload error: ${err.message}`,
      error: err.message
    });
  }

  if (err) {
    return res.status(400).json({
      status: "error",
      message: err.message || "File upload failed"
    });
  }

  next();
};

router.use(adminAuth);

router.get("/services", ServiceController.getAllServices);
router.get("/services/categories", ServiceController.getCategories);
router.get("/services/stats", ServiceController.getServiceStats);
router.get("/services/:id", ServiceController.getServiceById);

router.post(
  "/services",
  serviceUpload.array("images", 10),
  handleMulterError,
  compressionPresets.web,
  validation.validateService,
  ServiceController.createService
);

router.put(
  "/services/:id",
  serviceUpload.array("images", 10),
  handleMulterError,
  compressionPresets.web,
  ServiceController.updateService
);

router.delete("/services/:id", ServiceController.deleteService);
router.patch("/services/:id/featured", ServiceController.toggleFeatured);

router.get("/projects", ProjectController.getAllProjects);
router.get("/projects/stats", ProjectController.getProjectStats);
router.get("/projects/:id", ProjectController.getProjectById);

router.post(
  "/projects",
  projectUpload.array("images", 5),
  handleMulterError,
  compressionPresets.highQuality,
  ProjectController.createProject
);

router.put(
  "/projects/:id",
  projectUpload.array("images", 5),
  handleMulterError,
  compressionPresets.highQuality,
  validation.validateProject,
  ProjectController.updateProject
);

router.delete("/projects/:id", ProjectController.deleteProject);
router.patch("/projects/:id/featured", ProjectController.toggleFeatured);

module.exports = router;
