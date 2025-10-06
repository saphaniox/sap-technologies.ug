const express = require("express");
const { Service, Project } = require("../models");

const router = express.Router();

// Public Service Routes
// GET /api/public/services - Get all active services for display
router.get("/services", async (req, res) => {
  try {
    const { category, featured } = req.query;
    
    // Build filter object - only show active services
    const filter = { status: "active" };
    if (category) filter.category = category;
    if (featured !== undefined) filter.featured = featured === "true";

    const services = await Service.find(filter)
      .sort({ featured: -1, createdAt: -1 })
      .select("-__v")
      .lean();

    res.json({
      success: true,
      data: { services }
    });
  } catch (error) {
    console.error("Get public services error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch services",
      error: error.message
    });
  }
});

// GET /api/public/services/:id - Get service by ID for public display
router.get("/services/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const service = await Service.findOne({ 
      _id: id, 
      status: "active" 
    }).select("-__v");

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found"
      });
    }

    res.json({
      success: true,
      data: { service }
    });
  } catch (error) {
    console.error("Get public service by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch service",
      error: error.message
    });
  }
});

// Public Project Routes
// GET /api/public/projects - Get all active projects for display
router.get("/projects", async (req, res) => {
  try {
    const { category, featured } = req.query;
    
    // Build filter object - only show active projects
    const filter = { status: "completed" }; // Only show completed projects in portfolio
    if (category) filter.category = category;
    if (featured !== undefined) filter.featured = featured === "true";

    const projects = await Project.find(filter)
      .sort({ featured: -1, completionDate: -1 })
      .select("-__v -client.email -client.phone") // Hide sensitive client info
      .lean();

    res.json({
      success: true,
      data: { projects }
    });
  } catch (error) {
    console.error("Get public projects error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch projects",
      error: error.message
    });
  }
});

// GET /api/public/projects/:id - Get project by ID for public display
router.get("/projects/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findOne({ 
      _id: id, 
      status: "completed" 
    }).select("-__v -client.email -client.phone");

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    res.json({
      success: true,
      data: { project }
    });
  } catch (error) {
    console.error("Get public project by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch project",
      error: error.message
    });
  }
});

// GET /api/public/services/categories - Get all service categories
router.get("/services/categories", async (req, res) => {
  try {
    const categories = await Service.distinct("category", { status: "active" });
    
    res.json({
      success: true,
      data: { categories }
    });
  } catch (error) {
    console.error("Get service categories error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
      error: error.message
    });
  }
});

// GET /api/public/projects/categories - Get all project categories
router.get("/projects/categories", async (req, res) => {
  try {
    const categories = await Project.distinct("category", { status: "completed" });
    
    res.json({
      success: true,
      data: { categories }
    });
  } catch (error) {
    console.error("Get project categories error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
      error: error.message
    });
  }
});

module.exports = router;