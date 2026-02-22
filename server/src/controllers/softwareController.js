const Software = require("../models/Software");
const path = require("path");
const fs = require("fs").promises;

/**
 * Get all software
 * GET /api/software
 * Public access
 */
exports.getAllSoftware = async (req, res) => {
  try {
    const { category, status, search, public: isPublic } = req.query;
    
    // Build query
    const query = {};
    
    // Only show public software for non-admin users
    if (req.user?.role !== "admin") {
      query.isPublic = true;
      query.status = "active";
    } else if (isPublic !== undefined) {
      query.isPublic = isPublic === "true";
    }
    
    // Filter by category
    if (category && category !== "all") {
      query.category = category;
    }
    
    // Filter by status
    if (status) {
      query.status = status;
    }
    
    // Search
    if (search) {
      query.$text = { $search: search };
    }
    
    const software = await Software.find(query)
      .sort({ order: 1, createdAt: -1 })
      .lean();
    
    res.status(200).json({
      status: "success",
      data: {
        software,
        count: software.length
      }
    });
  } catch (error) {
    console.error("Error fetching software:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch software",
      error: error.message
    });
  }
};

/**
 * Get single software by ID
 * GET /api/software/:id
 * Public access
 */
exports.getSoftwareById = async (req, res) => {
  try {
    const software = await Software.findById(req.params.id);
    
    if (!software) {
      return res.status(404).json({
        status: "error",
        message: "Software not found"
      });
    }
    
    // Increment views
    await software.incrementViews();
    
    res.status(200).json({
      status: "success",
      data: { software }
    });
  } catch (error) {
    console.error("Error fetching software:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch software",
      error: error.message
    });
  }
};

/**
 * Get software categories
 * GET /api/software/categories
 * Public access
 */
exports.getCategories = async (req, res) => {
  try {
    const categories = await Software.getCategories();
    
    res.status(200).json({
      status: "success",
      data: { categories }
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch categories",
      error: error.message
    });
  }
};

/**
 * Create new software
 * POST /api/software
 * Admin only
 */
exports.createSoftware = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user?.role !== "admin") {
      return res.status(403).json({
        status: "error",
        message: "Access denied. Admin only."
      });
    }
    
    const softwareData = { ...req.body };
    
    // Parse JSON fields if they're strings
    if (typeof softwareData.features === "string") {
      softwareData.features = JSON.parse(softwareData.features);
    }
    if (typeof softwareData.technologies === "string") {
      softwareData.technologies = JSON.parse(softwareData.technologies);
    }
    
    // Convert string booleans to actual booleans
    if (typeof softwareData.isPublic === "string") {
      softwareData.isPublic = softwareData.isPublic === "true";
    }
    
    // Handle uploaded files
    if (req.files && req.files.length > 0) {
      softwareData.images = req.files.map(file => ({
        url: `/uploads/software/${file.filename}`,
        alt: softwareData.name || "Software image"
      }));
      softwareData.image = softwareData.images[0].url;
    }
    
    const software = await Software.create(softwareData);
    
    res.status(201).json({
      status: "success",
      message: "Software created successfully",
      data: { software }
    });
  } catch (error) {
    console.error("Error creating software:", error);
    res.status(400).json({
      status: "error",
      message: "Failed to create software",
      error: error.message
    });
  }
};

/**
 * Update software
 * PUT /api/software/:id
 * Admin only
 */
exports.updateSoftware = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user?.role !== "admin") {
      return res.status(403).json({
        status: "error",
        message: "Access denied. Admin only."
      });
    }
    
    const software = await Software.findById(req.params.id);
    
    if (!software) {
      return res.status(404).json({
        status: "error",
        message: "Software not found"
      });
    }
    
    const updateData = { ...req.body };
    
    // Parse JSON fields if they're strings
    if (typeof updateData.features === "string") {
      updateData.features = JSON.parse(updateData.features);
    }
    if (typeof updateData.technologies === "string") {
      updateData.technologies = JSON.parse(updateData.technologies);
    }
    
    // Convert string booleans to actual booleans
    if (typeof updateData.isPublic === "string") {
      updateData.isPublic = updateData.isPublic === "true";
    }
    
    // Handle new uploaded files
    if (req.files && req.files.length > 0) {
      // Delete old images if requested
      if (req.body.deleteOldImages === "true" && software.images) {
        for (const img of software.images) {
          try {
            const imagePath = path.join(__dirname, "../..", img.url);
            await fs.unlink(imagePath);
          } catch (err) {
            console.error("Error deleting old image:", err);
          }
        }
      }
      
      // Add new images
      const newImages = req.files.map(file => ({
        url: `/uploads/software/${file.filename}`,
        alt: updateData.name || software.name || "Software image"
      }));
      
      updateData.images = req.body.keepExistingImages === "true" 
        ? [...(software.images || []), ...newImages]
        : newImages;
      
      updateData.image = updateData.images[0].url;
    }
    
    Object.assign(software, updateData);
    await software.save();
    
    res.status(200).json({
      status: "success",
      message: "Software updated successfully",
      data: { software }
    });
  } catch (error) {
    console.error("Error updating software:", error);
    res.status(400).json({
      status: "error",
      message: "Failed to update software",
      error: error.message
    });
  }
};

/**
 * Delete software
 * DELETE /api/software/:id
 * Admin only
 */
exports.deleteSoftware = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user?.role !== "admin") {
      return res.status(403).json({
        status: "error",
        message: "Access denied. Admin only."
      });
    }
    
    const software = await Software.findById(req.params.id);
    
    if (!software) {
      return res.status(404).json({
        status: "error",
        message: "Software not found"
      });
    }
    
    // Delete associated images
    if (software.images && software.images.length > 0) {
      for (const img of software.images) {
        try {
          const imagePath = path.join(__dirname, "../..", img.url);
          await fs.unlink(imagePath);
        } catch (err) {
          console.error("Error deleting image:", err);
        }
      }
    } else if (software.image) {
      try {
        const imagePath = path.join(__dirname, "../..", software.image);
        await fs.unlink(imagePath);
      } catch (err) {
        console.error("Error deleting image:", err);
      }
    }
    
    await Software.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      status: "success",
      message: "Software deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting software:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to delete software",
      error: error.message
    });
  }
};

/**
 * Track software click
 * POST /api/software/:id/click
 * Public access
 */
exports.trackClick = async (req, res) => {
  try {
    const software = await Software.findById(req.params.id);
    
    if (!software) {
      return res.status(404).json({
        status: "error",
        message: "Software not found"
      });
    }
    
    await software.incrementClicks();
    
    res.status(200).json({
      status: "success",
      message: "Click tracked"
    });
  } catch (error) {
    console.error("Error tracking click:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to track click",
      error: error.message
    });
  }
};

/**
 * Get software statistics (admin only)
 * GET /api/software/admin/stats
 */
exports.getStats = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user?.role !== "admin") {
      return res.status(403).json({
        status: "error",
        message: "Access denied. Admin only."
      });
    }
    
    const totalSoftware = await Software.countDocuments();
    const activeSoftware = await Software.countDocuments({ status: "active" });
    const publicSoftware = await Software.countDocuments({ isPublic: true });
    
    const totalViews = await Software.aggregate([
      { $group: { _id: null, total: { $sum: "$stats.views" } } }
    ]);
    
    const totalClicks = await Software.aggregate([
      { $group: { _id: null, total: { $sum: "$stats.clicks" } } }
    ]);
    
    const topSoftware = await Software.find()
      .sort({ "stats.clicks": -1 })
      .limit(5)
      .select("name stats")
      .lean();
    
    res.status(200).json({
      status: "success",
      data: {
        stats: {
          total: totalSoftware,
          active: activeSoftware,
          public: publicSoftware,
          totalViews: totalViews[0]?.total || 0,
          totalClicks: totalClicks[0]?.total || 0,
          topSoftware
        }
      }
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch statistics",
      error: error.message
    });
  }
};
