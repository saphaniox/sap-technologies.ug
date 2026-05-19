const IoT = require("../models/IoT");
const fsp = require("fs").promises;
const path = require("path");
const { deleteFromCloudinary, extractPublicId } = require("../config/cloudinary");
const { getUploadedFileUrl } = require("../utils/uploadedFileUrl");

/**
 * Get the correct file path/URL for uploaded file
 * Works with both Cloudinary and local storage
 */
const getFileUrl = (file, folder = 'iot') => {
  return getUploadedFileUrl(file, folder);
};

const parseJsonField = (value, fallback) => {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value !== "string") return value;

  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
};

const normalizeStringArray = (value) => {
  const parsed = parseJsonField(value, value);
  if (Array.isArray(parsed)) {
    return parsed.map(item => String(item || "").trim()).filter(Boolean);
  }
  if (typeof parsed === "string" && parsed.trim()) {
    return [parsed.trim()];
  }
  return [];
};

const normalizeNumber = (value, fallback = 0) => {
  if (value === "" || value === undefined || value === null) return fallback;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
};

const normalizeDate = (value) => {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const normalizeImages = (images) => {
  if (!Array.isArray(images)) return [];
  return images
    .map(image => {
      if (!image) return null;
      if (typeof image === "string") return { url: image };
      if (image.url) return image;
      return null;
    })
    .filter(Boolean);
};

const normalizeVideos = (videos) => {
  if (!Array.isArray(videos)) return [];
  return videos
    .map(video => {
      if (!video) return null;
      if (typeof video === "string") return { url: video };
      if (video.url) return video;
      return null;
    })
    .filter(Boolean);
};

const deleteUploadedMedia = async (mediaUrl, resourceType = "image") => {
  if (!mediaUrl) return;

  try {
    if (mediaUrl.includes("cloudinary.com")) {
      const publicId = extractPublicId(mediaUrl);
      if (publicId) {
        await deleteFromCloudinary(publicId, resourceType);
      }
      return;
    }

    if (mediaUrl.startsWith("/uploads/")) {
      const filePath = path.join(__dirname, "../..", mediaUrl);
      await fsp.unlink(filePath);
    }
  } catch (error) {
    console.error("Error deleting IoT media:", error.message);
  }
};

const normalizeIoTData = (data, existingProject = null) => {
  if (data.technologies !== undefined) data.technologies = normalizeStringArray(data.technologies);
  if (data.hardware !== undefined) data.hardware = normalizeStringArray(data.hardware);
  if (data.features !== undefined) data.features = normalizeStringArray(data.features);

  if (typeof data.isPublic === "string") data.isPublic = data.isPublic === "true";
  if (typeof data.isFeatured === "string") data.isFeatured = data.isFeatured === "true";
  if (data.order !== undefined) data.order = normalizeNumber(data.order, existingProject?.order || 0);

  if (data.completionDate !== undefined) {
    const normalizedDate = normalizeDate(data.completionDate);
    if (normalizedDate) {
      data.completionDate = normalizedDate;
    } else {
      delete data.completionDate;
    }
  }

  return data;
};

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
    const projectData = normalizeIoTData({ ...req.body });
    
    console.log('🚀 Creating IoT project');
    
    // Handle file uploads (images and videos)
    if (req.files) {
      const imageFiles = Array.isArray(req.files) ? req.files : (req.files.images || []);
      const videoFiles = Array.isArray(req.files) ? [] : (req.files.videos || []);

      console.log(`📁 Files: ${imageFiles.length} images, ${videoFiles.length} videos`);
      
      if (imageFiles.length > 0) {
        console.log('📸 Processing images:');
        projectData.images = imageFiles.map((file, idx) => {
          console.log(`  Image ${idx + 1}:`, {
            filename: file.filename,
            secure_url: file.secure_url ? 'present' : 'missing',
            public_id: file.public_id ? 'present' : 'missing'
          });
          const imageUrl = getFileUrl(file, 'iot');
          console.log(`    Generated URL: ${imageUrl}`);
          return {
            url: imageUrl,
            isCompressed: file.isCompressed || false
          };
        });
      }

      if (videoFiles.length > 0) {
        console.log('🎥 Processing videos:');
        projectData.videos = videoFiles.map((file, idx) => {
          console.log(`  Video ${idx + 1}:`, {
            filename: file.filename,
            secure_url: file.secure_url ? 'present' : 'missing'
          });
          return {
            url: getFileUrl(file, 'iot'),
            mimeType: file.mimetype,
            size: file.size || 0
          };
        });
      }
    }
    
    const iotProject = await IoT.create(projectData);
    console.log('✅ IoT project created');
    
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
    
    const updateData = normalizeIoTData({ ...req.body }, iotProject);
    
    // Handle new file uploads
    if (req.files) {
      const imageFiles = Array.isArray(req.files) ? req.files : (req.files.images || []);
      const videoFiles = Array.isArray(req.files) ? [] : (req.files.videos || []);

      if (imageFiles.length > 0) {
        const newImages = imageFiles.map(file => ({
          url: getFileUrl(file, 'iot'),
          isCompressed: file.isCompressed || false
        }));
        // Keep existing images and add new ones
        updateData.images = [...normalizeImages(iotProject.images), ...newImages];
      }

      if (videoFiles.length > 0) {
        const newVideos = videoFiles.map(file => ({
          url: getFileUrl(file, 'iot'),
          mimeType: file.mimetype,
          size: file.size || 0
        }));
        updateData.videos = [...normalizeVideos(iotProject.videos), ...newVideos];
      }
    }

    // Handle image removal if specified
    if (req.body.removeImages) {
      const imagesToRemove = parseJsonField(req.body.removeImages, []);
      delete updateData.removeImages;
      const safeImagesToRemove = Array.isArray(imagesToRemove) ? imagesToRemove : [];
      const currentImages = normalizeImages(updateData.images || iotProject.images);
      updateData.images = currentImages.filter(img => !safeImagesToRemove.includes(img.url));

      await Promise.all(safeImagesToRemove.map(imageUrl => deleteUploadedMedia(imageUrl, "image")));
    }

    // Handle video removal if specified
    if (req.body.removeVideos) {
      const videosToRemove = parseJsonField(req.body.removeVideos, []);
      delete updateData.removeVideos;
      const safeVideosToRemove = Array.isArray(videosToRemove) ? videosToRemove : [];
      const currentVideos = normalizeVideos(updateData.videos || iotProject.videos);
      updateData.videos = currentVideos.filter(v => !safeVideosToRemove.includes(v.url));

      await Promise.all(safeVideosToRemove.map(videoUrl => deleteUploadedMedia(videoUrl, "video")));
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
    
    // Delete associated media
    const imageUrls = normalizeImages(iotProject.images).map(img => img.url);
    const videoUrls = normalizeVideos(iotProject.videos).map(video => video.url);
    await Promise.all([
      ...imageUrls.map(imageUrl => deleteUploadedMedia(imageUrl, "image")),
      ...videoUrls.map(videoUrl => deleteUploadedMedia(videoUrl, "video"))
    ]);
    
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
