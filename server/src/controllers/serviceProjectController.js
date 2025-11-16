const { Service, Project } = require("../models");
const fs = require("fs");
const path = require("path");
const { useCloudinary } = require("../config/fileUpload");
const cache = require("../services/cacheService");
const logger = require("../utils/logger");

// Helper function to get correct file URL (Cloudinary or local)
const getFileUrl = (file, folder = 'services') => {
  if (!file) return null;
  
  if (useCloudinary && file.path) {
    // Cloudinary returns full URL in file.path
    return file.path;
  }
  
  // Local storage - construct relative path
  return file ? `/uploads/${folder}/${file.filename}` : null;
};

// Service Management Controllers
class ServiceController {
  // Get all services with pagination and filtering
  static async getAllServices(req, res) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        category, 
        status, 
        featured,
        search,
        sortBy = "createdAt",
        sortOrder = "desc"
      } = req.query;

      const skip = (page - 1) * limit;
      
      // Build filter object
      const filter = {};
      if (category && category !== "" && category !== "all") filter.category = category;
      if (status && status !== "" && status !== "all") filter.status = status;
      if (featured !== undefined) filter.featured = featured === "true";
      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          { "technologies.name": { $regex: search, $options: "i" } }
        ];
      }

      // Build sort object
      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

      const services = await Service.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      const total = await Service.countDocuments(filter);
      const totalPages = Math.ceil(total / limit);

      res.json({
        success: true,
        data: {
          services,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalItems: total,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
          }
        }
      });
    } catch (error) {
      console.error("Get all services error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch services",
        error: error.message
      });
    }
  }

  // Get service by ID
  static async getServiceById(req, res) {
    try {
      const { id } = req.params;
      const service = await Service.findById(id);

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
      console.error("Get service by ID error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch service",
        error: error.message
      });
    }
  }

  // Create new service
  static async createService(req, res) {
    try {
      const serviceData = req.body;
      
      // Handle multiple file uploads with Cloudinary support
      if (req.files && req.files.length > 0) {
        serviceData.images = req.files.map((file, index) => ({
          url: getFileUrl(file, 'services'),
          alt: serviceData.title || 'Service image',
          isPrimary: index === 0, // First image is primary
          order: index
        }));
        // Also set single image field for backward compatibility
        serviceData.image = serviceData.images[0].url;
      } else if (req.file) {
        // Support single file upload for backward compatibility
        serviceData.image = getFileUrl(req.file, 'services');
        serviceData.images = [{
          url: serviceData.image,
          alt: serviceData.title || 'Service image',
          isPrimary: true,
          order: 0
        }];
      }
      
      // Parse JSON fields that come as strings from FormData
      if (typeof serviceData.features === "string") {
        try {
          serviceData.features = JSON.parse(serviceData.features);
        } catch (e) {
          serviceData.features = serviceData.features.split(",").map(f => f.trim());
        }
      }
      
      if (typeof serviceData.technologies === "string") {
        try {
          const techArray = JSON.parse(serviceData.technologies);
          // Convert string array to object array format expected by model
          serviceData.technologies = techArray.map(tech => ({
            name: typeof tech === "string" ? tech : tech.name || tech,
            level: "Intermediate" // Default level
          }));
        } catch (e) {
          serviceData.technologies = serviceData.technologies.split(",").map(t => ({
            name: t.trim(),
            level: "Intermediate"
          }));
        }
      }
      
      if (typeof serviceData.price === "string") {
        try {
          serviceData.price = JSON.parse(serviceData.price);
        } catch (e) {
          // Keep as string if not valid JSON
        }
      }
      
      // Validate required fields
      const { title, description, icon, category } = serviceData;
      if (!title || !description || !icon || !category) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: title, description, icon, category"
        });
      }

      const service = new Service(serviceData);
      await service.save();

      // Invalidate service caches
      cache.invalidateServices();
      cache.del('services:categories');
      logger.logInfo('ServiceController', 'Service created, cache invalidated', { serviceId: service._id });

      res.status(201).json({
        success: true,
        message: "Service created successfully",
        data: { service }
      });
    } catch (error) {
      logger.logError('ServiceController', error, { context: 'createService' });
      res.status(400).json({
        success: false,
        message: "Failed to create service",
        error: error.message
      });
    }
  }

  // Update service
  static async updateService(req, res) {
    try {
      const { id } = req.params;
      
      console.log("📝 Updating service:", id);
      console.log("📦 req.body type:", typeof req.body);
      console.log("📦 req.body is null?", req.body === null);
      console.log("� req.body is undefined?", req.body === undefined);
      
      if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({
          success: false,
          message: "Invalid request body"
        });
      }
      
      const updateData = { ...req.body };
      console.log("📦 Update data received:", Object.keys(updateData));

      // Handle multiple file uploads and delete old images if exists
      if (req.files && req.files.length > 0) {
        const existingService = await Service.findById(id);
        
        // Delete old local images (not Cloudinary URLs)
        if (existingService && existingService.images && existingService.images.length > 0) {
          existingService.images.forEach(img => {
            if (img.url && !img.url.startsWith('http')) {
              const oldImagePath = path.join(__dirname, "../..", img.url);
              if (fs.existsSync(oldImagePath)) {
                try {
                  fs.unlinkSync(oldImagePath);
                  console.log("🗑️ Deleted old image:", img.url);
                } catch (err) {
                  console.error("❌ Failed to delete old image:", err.message);
                }
              }
            }
          });
        }
        
        updateData.images = req.files.map((file, index) => ({
          url: getFileUrl(file, 'services'),
          alt: updateData.title || 'Service image',
          isPrimary: index === 0,
          order: index
        }));
        updateData.image = updateData.images[0].url; // Backward compatibility
        console.log("📸 New images uploaded:", updateData.images.length);
      } else if (req.file) {
        // Support single file upload for backward compatibility
        const existingService = await Service.findById(id);
        
        if (existingService && existingService.image) {
          if (!existingService.image.startsWith('http')) {
            const oldImagePath = path.join(__dirname, "../..", existingService.image);
            
            if (fs.existsSync(oldImagePath)) {
              try {
                fs.unlinkSync(oldImagePath);
                console.log("🗑️ Deleted old image:", existingService.image);
              } catch (err) {
                console.error("❌ Failed to delete old image:", err.message);
              }
            }
          }
        }
        
        updateData.image = getFileUrl(req.file, 'services');
        updateData.images = [{
          url: updateData.image,
          alt: updateData.title || 'Service image',
          isPrimary: true,
          order: 0
        }];
        console.log("📸 New image uploaded:", updateData.image);
      }
      
      // Parse JSON fields that come as strings from FormData
      if (typeof updateData.features === "string") {
        try {
          updateData.features = JSON.parse(updateData.features);
        } catch (e) {
          updateData.features = updateData.features.split(",").map(f => f.trim());
        }
      }
      
      if (typeof updateData.technologies === "string") {
        try {
          const techArray = JSON.parse(updateData.technologies);
          // Convert string array to object array format expected by model
          updateData.technologies = techArray.map(tech => ({
            name: typeof tech === "string" ? tech : tech.name || tech,
            level: "Intermediate" // Default level
          }));
        } catch (e) {
          updateData.technologies = updateData.technologies.split(",").map(t => ({
            name: t.trim(),
            level: "Intermediate"
          }));
        }
      }
      
      if (typeof updateData.price === "string") {
        try {
          updateData.price = JSON.parse(updateData.price);
          console.log("💰 Parsed price object:", updateData.price);
        } catch (e) {
          console.error("❌ Failed to parse price:", e.message);
          // Keep as string if not valid JSON
        }
      }

      // Ensure metadata exists before spreading
      const finalUpdateData = {
        ...updateData,
        metadata: {
          ...(updateData.metadata && typeof updateData.metadata === 'object' ? updateData.metadata : {}),
          lastUpdated: Date.now()
        }
      };

      console.log("✅ Final update data prepared, updating service...");

      const service = await Service.findByIdAndUpdate(
        id,
        finalUpdateData,
        { new: true, runValidators: true }
      );

      if (!service) {
        return res.status(404).json({
          success: false,
          message: "Service not found"
        });
      }

      // Invalidate service caches
      cache.invalidateServices();
      cache.del(`service:${id}`);
      cache.del('services:categories');
      logger.logInfo('ServiceController', 'Service updated, cache invalidated', { serviceId: id });

      res.json({
        success: true,
        message: "Service updated successfully",
        data: { service }
      });
    } catch (error) {
      logger.logError('ServiceController', error, { context: 'updateService', serviceId: req.params.id });
      res.status(500).json({
        success: false,
        message: "Failed to update service",
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  // Delete service
  static async deleteService(req, res) {
    try {
      const { id } = req.params;

      const service = await Service.findByIdAndDelete(id);

      if (!service) {
        return res.status(404).json({
          success: false,
          message: "Service not found"
        });
      }

      // Delete associated image file if exists
      if (service.image) {
        const imagePath = path.join(__dirname, "../..", service.image);
        
        if (fs.existsSync(imagePath)) {
          try {
            fs.unlinkSync(imagePath);
            logger.logInfo('ServiceController', 'Deleted service image', { path: service.image });
          } catch (err) {
            logger.logError('ServiceController', err, { context: 'deleteServiceImage', path: service.image });
          }
        }
      }

      // Invalidate service caches
      cache.invalidateServices();
      cache.del(`service:${id}`);
      cache.del('services:categories');
      logger.logInfo('ServiceController', 'Service deleted, cache invalidated', { serviceId: id });

      res.json({
        success: true,
        message: "Service deleted successfully"
      });
    } catch (error) {
      logger.logError('ServiceController', error, { context: 'deleteService', serviceId: req.params.id });
      res.status(500).json({
        success: false,
        message: "Failed to delete service",
        error: error.message
      });
    }
  }

  // Toggle featured status
  static async toggleFeatured(req, res) {
    try {
      const { id } = req.params;

      const service = await Service.findById(id);
      if (!service) {
        return res.status(404).json({
          success: false,
          message: "Service not found"
        });
      }

      service.featured = !service.featured;
      await service.save();

      res.json({
        success: true,
        message: `Service ${service.featured ? "featured" : "unfeatured"} successfully`,
        data: { service }
      });
    } catch (error) {
      console.error("Toggle featured error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to toggle featured status",
        error: error.message
      });
    }
  }

  // Get service categories
  static async getCategories(req, res) {
    try {
      const categories = await Service.distinct("category");
      
      res.json({
        success: true,
        data: { categories }
      });
    } catch (error) {
      console.error("Get categories error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch categories",
        error: error.message
      });
    }
  }

  // Get service statistics
  static async getServiceStats(req, res) {
    try {
      const totalServices = await Service.countDocuments();
      const activeServices = await Service.countDocuments({ status: "active" });
      const featuredServices = await Service.countDocuments({ featured: true });
      const servicesByCategory = await Service.aggregate([
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      res.json({
        success: true,
        data: {
          stats: {
            total: totalServices,
            active: activeServices,
            featured: featuredServices,
            byCategory: servicesByCategory
          }
        }
      });
    } catch (error) {
      console.error("Get service stats error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch service statistics",
        error: error.message
      });
    }
  }
}

// Project Management Controllers
class ProjectController {
  // Get all projects with pagination and filtering
  static async getAllProjects(req, res) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        category, 
        status, 
        featured,
        visibility,
        search,
        sortBy = "createdAt",
        sortOrder = "desc"
      } = req.query;

      const skip = (page - 1) * limit;
      
      // Build filter object
      const filter = {};
      if (category) filter.category = category;
      if (status) filter.status = status;
      if (featured !== undefined) filter.featured = featured === "true";
      if (visibility) filter.visibility = visibility;
      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          { tags: { $regex: search, $options: "i" } },
          { "technologies.name": { $regex: search, $options: "i" } }
        ];
      }

      // Build sort object
      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

      const projects = await Project.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      const total = await Project.countDocuments(filter);
      const totalPages = Math.ceil(total / limit);

      res.json({
        success: true,
        data: {
          projects,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalItems: total,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
          }
        }
      });
    } catch (error) {
      console.error("Get all projects error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch projects",
        error: error.message
      });
    }
  }

  // Get project by ID
  static async getProjectById(req, res) {
    try {
      const { id } = req.params;
      const project = await Project.findById(id);

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
      console.error("Get project by ID error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch project",
        error: error.message
      });
    }
  }

  // Create new project
  static async createProject(req, res) {
    try {
      console.log("=== CREATE PROJECT CONTROLLER START ===");
      console.log("User:", req.user ? `${req.user.name} (${req.user.email})` : "No user");
      console.log("Body:", JSON.stringify(req.body, null, 2));
      console.log("Files:", req.files ? req.files.length : "No files");
      
      const projectData = req.body;
      
      // Handle multiple file uploads with Cloudinary support
      if (req.files && req.files.length > 0) {
        console.log("Processing uploaded files...");
        projectData.images = req.files.map(file => getFileUrl(file, 'projects'));
        console.log("Images URLs:", projectData.images);
        // Set first image as main image if not specified
        if (!projectData.image && projectData.images.length > 0) {
          projectData.image = projectData.images[0];
          console.log("Set main image:", projectData.image);
        }
      }
      
      // Parse JSON fields that come as strings from FormData
      // Handle both techStack (legacy) and technologies (new format)
      if (typeof projectData.techStack === "string") {
        try {
          projectData.techStack = JSON.parse(projectData.techStack);
        } catch (e) {
          projectData.techStack = projectData.techStack.split(",").map(t => t.trim());
        }
      }
      
      if (typeof projectData.technologies === "string") {
        try {
          const techArray = JSON.parse(projectData.technologies);
          // Convert string array to object array format expected by model
          projectData.technologies = techArray.map(tech => ({
            name: typeof tech === "string" ? tech : tech.name || tech,
            category: "Other" // Default category
          }));
        } catch (e) {
          projectData.technologies = projectData.technologies.split(",").map(t => ({
            name: t.trim(),
            category: "Other"
          }));
        }
      }
      // If techStack exists but technologies doesn"t, convert techStack to technologies
      if (projectData.techStack && !projectData.technologies) {
        projectData.technologies = projectData.techStack.map(tech => ({
          name: typeof tech === "string" ? tech : tech.name || tech,
          category: "Other"
        }));
      }
      
      if (typeof projectData.features === "string") {
        try {
          const featureArray = JSON.parse(projectData.features);
          // Convert string array to object array format expected by model
          projectData.features = featureArray.map(feature => ({
            title: typeof feature === "string" ? feature : feature.title || feature,
            description: ""
          }));
        } catch (e) {
          projectData.features = projectData.features.split(",").map(f => ({
            title: f.trim(),
            description: ""
          }));
        }
      }
      
      if (typeof projectData.client === "string") {
        try {
          projectData.client = JSON.parse(projectData.client);
        } catch (e) {
          // Keep as string if not valid JSON
        }
      }
      
      // Parse dates
      if (projectData.startDate) {
        projectData.startDate = new Date(projectData.startDate);
      }
      if (projectData.completionDate) {
        projectData.completionDate = new Date(projectData.completionDate);
      }
      
      // Validate required fields
      const { title, description, category } = projectData;
      console.log("Validating required fields:", { title, description, category });
      if (!title || !description || !category) {
        console.log("❌ Missing required fields!");
        return res.status(400).json({
          success: false,
          message: "Missing required fields: title, description, category"
        });
      }

      console.log("Creating project with data:", JSON.stringify(projectData, null, 2));
      const project = new Project(projectData);
      await project.save();
      console.log("✅ Project saved successfully:", project._id);

      // Invalidate project caches
      cache.invalidateProjects();
      cache.del('projects:categories');
      logger.logInfo('ProjectController', 'Project created, cache invalidated', { projectId: project._id });

      console.log("=== CREATE PROJECT CONTROLLER END (SUCCESS) ===");
      res.status(201).json({
        success: true,
        message: "Project created successfully",
        data: { project }
      });
    } catch (error) {
      console.log("=== CREATE PROJECT CONTROLLER END (ERROR) ===");
      console.error("❌ Error details:", error);
      console.error("Error stack:", error.stack);
      logger.logError('ProjectController', error, { context: 'createProject' });
      res.status(400).json({
        success: false,
        message: "Failed to create project",
        error: error.message
      });
    }
  }

  // Update project
  static async updateProject(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      console.log("=== UPDATE PROJECT DEBUG ===");
      console.log("Project ID:", id);
      console.log("Raw request body:", JSON.stringify(updateData, null, 2));
      console.log("Request files:", req.files ? req.files.length : "none");

      // Handle multiple file uploads and delete old images
      if (req.files && req.files.length > 0) {
        // Get existing project to find old images
        const existingProject = await Project.findById(id);
        
        if (existingProject && existingProject.images && existingProject.images.length > 0) {
          // Delete old project images (only local files, not Cloudinary URLs)
          for (const oldImage of existingProject.images) {
            if (!oldImage.startsWith('http')) {
              const oldImagePath = path.join(__dirname, "../..", oldImage);
              
              if (fs.existsSync(oldImagePath)) {
                try {
                  fs.unlinkSync(oldImagePath);
                  console.log("🗑️ Deleted old project image:", oldImage);
                } catch (err) {
                  console.error("❌ Failed to delete old project image:", err.message);
                }
              }
            }
          }
        }
        
        updateData.images = req.files.map(file => getFileUrl(file, 'projects'));
        console.log("📸 New project images uploaded:", updateData.images);
      }
      
      // Parse JSON fields that come as strings from FormData
      // Handle both techStack (legacy) and technologies (new format)
      if (typeof updateData.techStack === "string") {
        try {
          updateData.techStack = JSON.parse(updateData.techStack);
        } catch (e) {
          updateData.techStack = updateData.techStack.split(",").map(t => t.trim());
        }
      }
      
      if (typeof updateData.technologies === "string") {
        try {
          const techArray = JSON.parse(updateData.technologies);
          // Convert string array to object array format expected by model
          updateData.technologies = techArray.map(tech => ({
            name: typeof tech === "string" ? tech : tech.name || tech,
            category: "Other" // Default category
          }));
        } catch (e) {
          updateData.technologies = updateData.technologies.split(",").map(t => ({
            name: t.trim(),
            category: "Other"
          }));
        }
      }
      // If techStack exists but technologies doesn"t, convert techStack to technologies
      if (updateData.techStack && !updateData.technologies) {
        updateData.technologies = updateData.techStack.map(tech => ({
          name: typeof tech === "string" ? tech : tech.name || tech,
          category: "Other"
        }));
      }
      
      if (typeof updateData.features === "string") {
        try {
          const featureArray = JSON.parse(updateData.features);
          // Convert string array to object array format expected by model
          updateData.features = featureArray.map(feature => ({
            title: typeof feature === "string" ? feature : feature.title || feature,
            description: ""
          }));
        } catch (e) {
          updateData.features = updateData.features.split(",").map(f => ({
            title: f.trim(),
            description: ""
          }));
        }
      }
      
      if (typeof updateData.client === "string") {
        try {
          updateData.client = JSON.parse(updateData.client);
        } catch (e) {
          // Keep as string if not valid JSON
        }
      }
      
      // Parse dates
      if (updateData.startDate) {
        updateData.startDate = new Date(updateData.startDate);
      }
      if (updateData.completionDate) {
        updateData.completionDate = new Date(updateData.completionDate);
      }

      console.log("Transformed update data:", JSON.stringify(updateData, null, 2));

      const project = await Project.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );

      if (!project) {
        return res.status(404).json({
          success: false,
          message: "Project not found"
        });
      }

      // Invalidate project caches
      cache.invalidateProjects();
      cache.del(`project:${id}`);
      cache.del('projects:categories');
      logger.logInfo('ProjectController', 'Project updated, cache invalidated', { projectId: id });

      res.json({
        success: true,
        message: "Project updated successfully",
        data: { project }
      });
    } catch (error) {
      logger.logError('ProjectController', error, { 
        context: 'updateProject', 
        projectId: req.params.id,
        validationErrors: error.errors 
      });
      
      res.status(400).json({
        success: false,
        message: "Failed to update project",
        error: error.message
      });
    }
  }

  // Delete project
  static async deleteProject(req, res) {
    try {
      const { id } = req.params;

      const project = await Project.findByIdAndDelete(id);

      if (!project) {
        return res.status(404).json({
          success: false,
          message: "Project not found"
        });
      }

      // Delete all associated image files if exist
      if (project.images && project.images.length > 0) {
        for (const image of project.images) {
          const imagePath = path.join(__dirname, "../..", image);
          
          if (fs.existsSync(imagePath)) {
            try {
              fs.unlinkSync(imagePath);
              logger.logInfo('ProjectController', 'Deleted project image', { path: image });
            } catch (err) {
              logger.logError('ProjectController', err, { context: 'deleteProjectImage', path: image });
            }
          }
        }
      }

      // Invalidate project caches
      cache.invalidateProjects();
      cache.del(`project:${id}`);
      cache.del('projects:categories');
      logger.logInfo('ProjectController', 'Project deleted, cache invalidated', { projectId: id });

      res.json({
        success: true,
        message: "Project deleted successfully"
      });
    } catch (error) {
      logger.logError('ProjectController', error, { context: 'deleteProject', projectId: req.params.id });
      res.status(500).json({
        success: false,
        message: "Failed to delete project",
        error: error.message
      });
    }
  }

  // Toggle featured status
  static async toggleFeatured(req, res) {
    try {
      const { id } = req.params;

      const project = await Project.findById(id);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: "Project not found"
        });
      }

      project.featured = !project.featured;
      await project.save();

      res.json({
        success: true,
        message: `Project ${project.featured ? "featured" : "unfeatured"} successfully`,
        data: { project }
      });
    } catch (error) {
      console.error("Toggle featured error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to toggle featured status",
        error: error.message
      });
    }
  }

  // Get project statistics
  static async getProjectStats(req, res) {
    try {
      const totalProjects = await Project.countDocuments();
      const completedProjects = await Project.countDocuments({ status: "completed" });
      const featuredProjects = await Project.countDocuments({ featured: true });
      const projectsByCategory = await Project.aggregate([
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      const projectsByStatus = await Project.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]);

      res.json({
        success: true,
        data: {
          stats: {
            total: totalProjects,
            completed: completedProjects,
            featured: featuredProjects,
            byCategory: projectsByCategory,
            byStatus: projectsByStatus
          }
        }
      });
    } catch (error) {
      console.error("Get project stats error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch project statistics",
        error: error.message
      });
    }
  }
}

module.exports = {
  ServiceController,
  ProjectController
};