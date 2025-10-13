const express = require("express");
const { Service, Project } = require("../models");
const cache = require("../services/cacheService");
const logger = require("../utils/logger");

const router = express.Router();

// Public Service Routes
// GET /api/public/services - Get all active services for display
router.get("/services", async (req, res) => {
  try {
    const { category, featured } = req.query;
    
    // Create cache key based on query params
    const cacheKey = `services:public:${category || 'all'}:${featured || 'all'}`;
    
    // Try to get from cache
    const cachedServices = cache.get(cacheKey);
    if (cachedServices) {
      logger.logDebug('PublicRoutes', 'Serving cached services', { category, featured });
      return res.json({
        success: true,
        data: { services: cachedServices },
        cached: true
      });
    }
    
    // Build filter object - only show active services
    const filter = { status: "active" };
    if (category) filter.category = category;
    if (featured !== undefined) filter.featured = featured === "true";

    const services = await Service.find(filter)
      .sort({ featured: -1, order: 1, createdAt: -1 })
      .select("-__v")
      .lean();

    // Cache for 15 minutes
    cache.set(cacheKey, services, 900);
    logger.logDebug('PublicRoutes', 'Services cached', { count: services.length, key: cacheKey });

    res.json({
      success: true,
      data: { services }
    });
  } catch (error) {
    logger.logError('PublicRoutes', error, { context: 'getPublicServices' });
    res.status(500).json({
      success: false,
      message: "Failed to fetch services",
      error: error.message
    });
  }
});

// GET /api/public/services/categories - Get all service categories
// NOTE: This MUST be before /services/:id to avoid route conflict
router.get("/services/categories", async (req, res) => {
  try {
    // Try to get from cache
    const cacheKey = 'services:categories';
    const cachedCategories = cache.get(cacheKey);
    if (cachedCategories) {
      logger.logDebug('PublicRoutes', 'Serving cached service categories');
      return res.json({
        success: true,
        data: { categories: cachedCategories },
        cached: true
      });
    }
    
    const categories = await Service.distinct("category", { status: "active" });
    
    // Cache for 1 hour (categories change rarely)
    cache.set(cacheKey, categories, 3600);
    logger.logDebug('PublicRoutes', 'Service categories cached', { count: categories.length });
    
    res.json({
      success: true,
      data: { categories }
    });
  } catch (error) {
    logger.logError('PublicRoutes', error, { context: 'getServiceCategories' });
    res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
      error: error.message
    });
  }
});

// GET /api/public/services/:id - Get service by ID for public display
router.get("/services/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Try to get from cache
    const cacheKey = `service:${id}`;
    const cachedService = cache.get(cacheKey);
    if (cachedService) {
      logger.logDebug('PublicRoutes', 'Serving cached service', { id });
      return res.json({
        success: true,
        data: { service: cachedService },
        cached: true
      });
    }
    
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

    // Cache for 15 minutes
    cache.set(cacheKey, service, 900);
    logger.logDebug('PublicRoutes', 'Service cached', { id });

    res.json({
      success: true,
      data: { service }
    });
  } catch (error) {
    logger.logError('PublicRoutes', error, { context: 'getPublicServiceById', id: req.params.id });
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
    
    // Create cache key based on query params
    const cacheKey = `projects:public:${category || 'all'}:${featured || 'all'}`;
    
    // Try to get from cache
    const cachedProjects = cache.get(cacheKey);
    if (cachedProjects) {
      logger.logDebug('PublicRoutes', 'Serving cached projects', { category, featured });
      return res.json({
        success: true,
        data: { projects: cachedProjects },
        cached: true
      });
    }
    
    // Build filter object - only show active projects
    const filter = { status: "completed" }; // Only show completed projects in portfolio
    if (category) filter.category = category;
    if (featured !== undefined) filter.featured = featured === "true";

    const projects = await Project.find(filter)
      .sort({ featured: -1, completionDate: -1 })
      .select("-__v -client.email -client.phone") // Hide sensitive client info
      .lean();

    // Cache for 10 minutes
    cache.set(cacheKey, projects, 600);
    logger.logDebug('PublicRoutes', 'Projects cached', { count: projects.length, key: cacheKey });

    res.json({
      success: true,
      data: { projects }
    });
  } catch (error) {
    logger.logError('PublicRoutes', error, { context: 'getPublicProjects' });
    res.status(500).json({
      success: false,
      message: "Failed to fetch projects",
      error: error.message
    });
  }
});

// GET /api/public/projects/categories - Get all project categories
// NOTE: This MUST be before /projects/:id to avoid route conflict
router.get("/projects/categories", async (req, res) => {
  try {
    // Try to get from cache
    const cacheKey = 'projects:categories';
    const cachedCategories = cache.get(cacheKey);
    if (cachedCategories) {
      logger.logDebug('PublicRoutes', 'Serving cached project categories');
      return res.json({
        success: true,
        data: { categories: cachedCategories },
        cached: true
      });
    }
    
    const categories = await Project.distinct("category", { status: "completed" });
    
    // Cache for 1 hour (categories change rarely)
    cache.set(cacheKey, categories, 3600);
    logger.logDebug('PublicRoutes', 'Project categories cached', { count: categories.length });
    
    res.json({
      success: true,
      data: { categories }
    });
  } catch (error) {
    logger.logError('PublicRoutes', error, { context: 'getProjectCategories' });
    res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
      error: error.message
    });
  }
});

// GET /api/public/projects/:id - Get project by ID for public display
router.get("/projects/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Try to get from cache
    const cacheKey = `project:${id}`;
    const cachedProject = cache.get(cacheKey);
    if (cachedProject) {
      logger.logDebug('PublicRoutes', 'Serving cached project', { id });
      return res.json({
        success: true,
        data: { project: cachedProject },
        cached: true
      });
    }
    
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

    // Cache for 10 minutes
    cache.set(cacheKey, project, 600);
    logger.logDebug('PublicRoutes', 'Project cached', { id });

    res.json({
      success: true,
      data: { project }
    });
  } catch (error) {
    logger.logError('PublicRoutes', error, { context: 'getPublicProjectById', id: req.params.id });
    res.status(500).json({
      success: false,
      message: "Failed to fetch project",
      error: error.message
    });
  }
});

module.exports = router;
