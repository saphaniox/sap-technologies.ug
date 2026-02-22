const IoT = require("../models/IoT");
const fs = require("fs");
const path = require("path");

// @desc    Get all IoT projects
// @route   GET /api/iot
// @access  Public
exports.getAllIoTProjects = async (req, res) => {
  try {
    const { category, status, search, featured } = req.query;
    
    // Build query
    const query = {};
    
    // Only show public projects for non-admin users
    if (req.user?.role !== "admin") {
      query.isPublic = true;
    }
    
    if (category && category !== "all") {
      query.category = category;
    }
    
    if (status && status !== "all") {
      query.status = status;
    }
    
    if (featured === "true") {
      query.isFeatured = true;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { technologies: { $regex: search, $options: "i" } }
      ];
    }
    
    const iotProjects = await IoT.find(query).sort({ order: 1, createdAt: -1 });
    
    res.status(200).json({
      status: "success",
      results: iotProjects.length,
      data: {
        iotProjects
      }
    });
  } catch (error) {
    console.error("Error fetching IoT projects:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch IoT projects"
    });
  }
};

// @desc    Get IoT project by ID
// @route   GET /api/iot/:id
// @access  Public
exports.getIoTProjectById = async (req, res) => {
  try {
    const iotProject = await IoT.findById(req.params.id);
    
    if (!iotProject) {
      return res.status(404).json({
        status: "error",
        message: "IoT project not found"
      });
    }
    
    // Increment views
    await iotProject.incrementViews();
    
    res.status(200).json({
      status: "success",
      data: {
        iotProject
      }
    });
  } catch (error) {
    console.error("Error fetching IoT project:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch IoT project"
    });
  }
};

// @desc    Create new IoT project
// @route   POST /api/iot
// @access  Admin
exports.createIoTProject = async (req, res) => {
  try {
    const projectData = { ...req.body };
    
    // Parse JSON fields if they're strings
    if (typeof projectData.technologies === "string") {
      projectData.technologies = JSON.parse(projectData.technologies);
    }
    if (typeof projectData.hardware === "string") {
      projectData.hardware = JSON.parse(projectData.hardware);
    }
    if (typeof projectData.features === "string") {
      projectData.features = JSON.parse(projectData.features);
    }
    
    // Convert string booleans to actual booleans
    if (typeof projectData.isPublic === "string") {
      projectData.isPublic = projectData.isPublic === "true";
    }
    if (typeof projectData.isFeatured === "string") {
      projectData.isFeatured = projectData.isFeatured === "true";
    }
    
    // Handle image uploads
    if (req.files && req.files.length > 0) {
      projectData.images = req.files.map(file => ({
        url: `/uploads/iot/${file.filename}`,
        isCompressed: file.isCompressed || false
      }));
    }
    
    const iotProject = await IoT.create(projectData);
    
    res.status(201).json({
      status: "success",
      data: {
        iotProject
      }
    });
  } catch (error) {
    console.error("Error creating IoT project:", error);
    res.status(500).json({
      status: "error",
      message: error.message || "Failed to create IoT project"
    });
  }
};

// @desc    Update IoT project
// @route   PUT /api/iot/:id
// @access  Admin
exports.updateIoTProject = async (req, res) => {
  try {
    const iotProject = await IoT.findById(req.params.id);
    
    if (!iotProject) {
      return res.status(404).json({
        status: "error",
        message: "IoT project not found"
      });
    }
    
    const updateData = { ...req.body };
    
    // Parse JSON fields if they're strings
    if (typeof updateData.technologies === "string") {
      updateData.technologies = JSON.parse(updateData.technologies);
    }
    if (typeof updateData.hardware === "string") {
      updateData.hardware = JSON.parse(updateData.hardware);
    }
    if (typeof updateData.features === "string") {
      updateData.features = JSON.parse(updateData.features);
    }
    
    // Convert string booleans to actual booleans
    if (typeof updateData.isPublic === "string") {
      updateData.isPublic = updateData.isPublic === "true";
    }
    if (typeof updateData.isFeatured === "string") {
      updateData.isFeatured = updateData.isFeatured === "true";
    }
    
    // Handle new image uploads
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => ({
        url: `/uploads/iot/${file.filename}`,
        isCompressed: file.isCompressed || false
      }));
      
      // Keep existing images and add new ones
      updateData.images = [...(iotProject.images || []), ...newImages];
    }
    
    // Handle image removal if specified
    if (req.body.removeImages) {
      const imagesToRemove = JSON.parse(req.body.removeImages);
      imagesToRemove.forEach(imageUrl => {
        const imagePath = path.join(__dirname, "../../..", imageUrl);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      });
      
      updateData.images = iotProject.images.filter(
        img => !imagesToRemove.includes(img.url)
      );
    }
    
    const updatedProject = await IoT.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      status: "success",
      data: {
        iotProject: updatedProject
      }
    });
  } catch (error) {
    console.error("Error updating IoT project:", error);
    res.status(500).json({
      status: "error",
      message: error.message || "Failed to update IoT project"
    });
  }
};

// @desc    Delete IoT project
// @route   DELETE /api/iot/:id
// @access  Admin
exports.deleteIoTProject = async (req, res) => {
  try {
    const iotProject = await IoT.findById(req.params.id);
    
    if (!iotProject) {
      return res.status(404).json({
        status: "error",
        message: "IoT project not found"
      });
    }
    
    // Delete associated images
    if (iotProject.images && iotProject.images.length > 0) {
      iotProject.images.forEach(img => {
        const imagePath = path.join(__dirname, "../../..", img.url);
        if (fs.existsSync(imagePath)) {
          try {
            fs.unlinkSync(imagePath);
          } catch (err) {
            console.error("Error deleting image:", err);
          }
        }
      });
    }
    
    await IoT.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      status: "success",
      message: "IoT project deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting IoT project:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to delete IoT project"
    });
  }
};

// @desc    Get IoT categories
// @route   GET /api/iot/categories
// @access  Public
exports.getCategories = async (req, res) => {
  try {
    const categories = await IoT.getCategories();
    
    res.status(200).json({
      status: "success",
      data: {
        categories
      }
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch categories"
    });
  }
};

// @desc    Like IoT project
// @route   POST /api/iot/:id/like
// @access  Public
exports.likeProject = async (req, res) => {
  try {
    const iotProject = await IoT.findById(req.params.id);
    
    if (!iotProject) {
      return res.status(404).json({
        status: "error",
        message: "IoT project not found"
      });
    }
    
    await iotProject.incrementLikes();
    
    res.status(200).json({
      status: "success",
      data: {
        likes: iotProject.stats.likes
      }
    });
  } catch (error) {
    console.error("Error liking project:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to like project"
    });
  }
};

// @desc    Get admin statistics
// @route   GET /api/iot/admin/stats
// @access  Admin
exports.getAdminStats = async (req, res) => {
  try {
    const totalProjects = await IoT.countDocuments();
    const completedProjects = await IoT.countDocuments({ status: "completed" });
    const inProgressProjects = await IoT.countDocuments({ status: "in-progress" });
    const featuredProjects = await IoT.countDocuments({ isFeatured: true });
    
    const totalViews = await IoT.aggregate([
      { $group: { _id: null, total: { $sum: "$stats.views" } } }
    ]);
    
    const totalLikes = await IoT.aggregate([
      { $group: { _id: null, total: { $sum: "$stats.likes" } } }
    ]);
    
    res.status(200).json({
      status: "success",
      data: {
        stats: {
          totalProjects,
          completedProjects,
          inProgressProjects,
          featuredProjects,
          totalViews: totalViews[0]?.total || 0,
          totalLikes: totalLikes[0]?.total || 0
        }
      }
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch admin statistics"
    });
  }
};
