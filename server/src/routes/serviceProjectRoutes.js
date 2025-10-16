const express = require("express");
const { ServiceController, ProjectController } = require("../controllers/serviceProjectController");
const { adminAuth } = require("../middleware/adminAuth");
const validation = require("../middleware/validation");
const { serviceUpload, projectUpload } = require("../config/fileUpload");

const router = express.Router();

// Apply admin authentication to all routes
router.use(adminAuth);

// Service Routes
// GET /api/admin/services - Get all services with filtering and pagination
router.get("/services", ServiceController.getAllServices);

// GET /api/admin/services/categories - Get all service categories
router.get("/services/categories", ServiceController.getCategories);

// GET /api/admin/services/stats - Get service statistics
router.get("/services/stats", ServiceController.getServiceStats);

// GET /api/admin/services/:id - Get service by ID
router.get("/services/:id", ServiceController.getServiceById);

// POST /api/admin/services - Create new service
router.post("/services", 
  serviceUpload.single("image"),
  validation.validateService,
  ServiceController.createService
);

// PUT /api/admin/services/:id - Update service
router.put("/services/:id", 
  serviceUpload.single("image"),
  (req, res, next) => {
    console.log("🔥 SERVICE UPDATE ROUTE HIT (after multer)!");
    console.log("Service ID:", req.params.id);
    console.log("User:", req.user ? `${req.user.name} (${req.user.role})` : "No user");
    console.log("req.body exists?", !!req.body);
    console.log("req.body type:", typeof req.body);
    if (req.body) {
      console.log("Body keys:", Object.keys(req.body));
      console.log("Body values sample:", {
        title: req.body.title,
        price: req.body.price,
        features: req.body.features
      });
    }
    console.log("File uploaded?", !!req.file);
    next();
  },
  // Temporarily skip validation to debug
  // validation.validateService,
  ServiceController.updateService
);

// DELETE /api/admin/services/:id - Delete service
router.delete("/services/:id", ServiceController.deleteService);

// PATCH /api/admin/services/:id/featured - Toggle featured status
router.patch("/services/:id/featured", ServiceController.toggleFeatured);

// Project Routes
// GET /api/admin/projects - Get all projects with filtering and pagination
router.get("/projects", ProjectController.getAllProjects);

// GET /api/admin/projects/stats - Get project statistics
router.get("/projects/stats", ProjectController.getProjectStats);

// GET /api/admin/projects/:id - Get project by ID
router.get("/projects/:id", ProjectController.getProjectById);

// POST /api/admin/projects - Create new project
router.post("/projects", 
  (req, res, next) => {
    console.log("🔥 PROJECT CREATE ROUTE HIT!");
    console.log("User:", req.user ? `${req.user.name} (${req.user.role})` : "No user");
    console.log("Body keys:", req.body ? Object.keys(req.body) : "No body");
    console.log("Files:", req.files ? req.files.length : "No files");
    next();
  },
  projectUpload.array("images", 5), // Allow up to 5 images
  (req, res, next) => {
    console.log("🔥 AFTER MULTER!");
    console.log("Body keys after multer:", req.body ? Object.keys(req.body) : "No body");
    console.log("Files after multer:", req.files ? req.files.length : "No files");
    console.log("Sample body data:", {
      title: req.body.title,
      description: req.body.description,
      category: req.body.category
    });
    next();
  },
  // Temporarily skip validation to debug
  // validation.validateProject,
  ProjectController.createProject
);

// PUT /api/admin/projects/:id - Update project
router.put("/projects/:id", 
  (req, res, next) => {
    console.log("🔥 PROJECT UPDATE ROUTE HIT!");
    console.log("Project ID:", req.params.id);
    console.log("User:", req.user ? `${req.user.name} (${req.user.role})` : "No user");
    console.log("Body keys:", Object.keys(req.body));
    next();
  },
  projectUpload.array("images", 5),
  validation.validateProject,
  ProjectController.updateProject
);

// DELETE /api/admin/projects/:id - Delete project
router.delete("/projects/:id", ProjectController.deleteProject);

// PATCH /api/admin/projects/:id/featured - Toggle featured status
router.patch("/projects/:id/featured", ProjectController.toggleFeatured);

module.exports = router;