const express = require("express");
const publicController = require("../controllers/publicController");

const router = express.Router();

// Register categories before dynamic IDs so they cannot be mistaken for records.
router.get("/services", publicController.getServices);
router.get("/services/categories", publicController.getServiceCategories);
router.get("/services/:id", publicController.getServiceById);
router.get("/projects", publicController.getProjects);
router.get("/projects/categories", publicController.getProjectCategories);
router.get("/projects/:id", publicController.getProjectById);

module.exports = router;
