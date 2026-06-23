const Gallery = require("../models/Gallery");
const { useCloudinary } = require("../config/fileUpload");
const { getUploadedFileUrl } = require("../utils/uploadedFileUrl");
const cache = require("../services/cacheService");
const logger = require("../utils/logger");
const { validationResult } = require("express-validator");
const path = require("path");
const fs = require("fs").promises;

const getFileUrl = (file, folder = "gallery") => {
  return getUploadedFileUrl(file, folder);
};

const normalizeText = (value) => {
  if (typeof value !== "string") return value;
  return value.trim();
};

const normalizeOrder = (value, fallback) => {
  if (value === undefined || value === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeBoolean = (value, fallback) => {
  if (value === undefined) return fallback;
  if (typeof value === "boolean") return value;
  return String(value).toLowerCase() === "true";
};

// Public - get active gallery items
const getPublicGallery = async (req, res) => {
  try {
    const cached = cache.getCachedGallery();
    if (cached) {
      logger.logDebug("GalleryController", "Serving cached gallery");
      return res.status(200).json({
        status: "success",
        data: cached,
        cached: true
      });
    }

    const items = await Gallery.find({ isActive: true })
      .sort({ displayOrder: 1, createdAt: -1 })
      .select("-__v");

    cache.cacheGallery(items);
    logger.logDebug("GalleryController", "Gallery cached", { count: items.length });

    res.status(200).json({
      status: "success",
      data: items
    });
  } catch (error) {
    logger.logError("GalleryController", error, { context: "getPublicGallery" });
    res.status(500).json({
      status: "error",
      message: "Error fetching gallery",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error"
    });
  }
};

// Admin - get all gallery items
const getAllGallery = async (req, res) => {
  try {
    const items = await Gallery.find()
      .sort({ displayOrder: 1, createdAt: -1 })
      .select("-__v");

    res.status(200).json({
      status: "success",
      data: items
    });
  } catch (error) {
    logger.logError("GalleryController", error, { context: "getAllGallery" });
    res.status(500).json({
      status: "error",
      message: "Error fetching gallery items",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error"
    });
  }
};

// Admin - get single item
const getGalleryById = async (req, res) => {
  try {
    const item = await Gallery.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        status: "error",
        message: "Gallery item not found"
      });
    }
    res.status(200).json({
      status: "success",
      data: item
    });
  } catch (error) {
    logger.logError("GalleryController", error, { context: "getGalleryById" });
    res.status(500).json({
      status: "error",
      message: "Error fetching gallery item",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error"
    });
  }
};

// Admin - create gallery item
const createGalleryItem = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "error",
        message: "Validation failed",
        errors: errors.array()
      });
    }

    if (!req.file) {
      return res.status(400).json({
        status: "error",
        message: "Gallery image is required"
      });
    }

    const { title, description, category, isActive, displayOrder } = req.body;

    const item = new Gallery({
      title: normalizeText(title),
      description: normalizeText(description),
      category: normalizeText(category) || "other",
      image: getFileUrl(req.file, "gallery"),
      cloudinaryId: req.file.public_id || null,
      isActive: normalizeBoolean(isActive, true),
      displayOrder: normalizeOrder(displayOrder, 0)
    });

    await item.save();

    cache.invalidateGallery();
    logger.logInfo("GalleryController", "Gallery item created, cache invalidated", { itemId: item._id });

    res.status(201).json({
      status: "success",
      message: "Gallery item created successfully",
      data: { item }
    });
  } catch (error) {
    logger.logError("GalleryController", error, { context: "createGalleryItem" });

    // Cleanup uploaded file
    if (req.file && req.file.path && !useCloudinary) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error("Error deleting uploaded file:", unlinkError);
      }
    }

    res.status(500).json({
      status: "error",
      message: "Error creating gallery item",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error"
    });
  }
};

// Admin - update gallery item
const updateGalleryItem = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "error",
        message: "Validation failed",
        errors: errors.array()
      });
    }

    const item = await Gallery.findById(req.params.id);
    if (!item) {
      // Cleanup uploaded file if item not found
      if (req.file && req.file.path && !useCloudinary) {
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          console.error("Error deleting uploaded file:", unlinkError);
        }
      }
      return res.status(404).json({
        status: "error",
        message: "Gallery item not found"
      });
    }

    const oldImage = item.image;
    const oldCloudinaryId = item.cloudinaryId;

    const updateData = {};
    if (req.body.title !== undefined) updateData.title = normalizeText(req.body.title);
    if (req.body.description !== undefined) updateData.description = normalizeText(req.body.description);
    if (req.body.category !== undefined) updateData.category = normalizeText(req.body.category);
    if (req.body.isActive !== undefined) updateData.isActive = normalizeBoolean(req.body.isActive, item.isActive);
    if (req.body.displayOrder !== undefined) updateData.displayOrder = normalizeOrder(req.body.displayOrder, item.displayOrder);

    if (req.file) {
      updateData.image = getFileUrl(req.file, "gallery");
      updateData.cloudinaryId = req.file.public_id || null;

      // Delete old image (local only)
      if (!useCloudinary && oldImage && oldImage.startsWith("/uploads/gallery/")) {
        try {
          const oldPath = path.join(__dirname, "../../uploads/gallery", path.basename(oldImage));
          await fs.unlink(oldPath);
        } catch (unlinkError) {
          console.error("Error deleting old gallery image:", unlinkError);
        }
      }
    }

    const updatedItem = await Gallery.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    cache.invalidateGallery();
    logger.logInfo("GalleryController", "Gallery item updated, cache invalidated", { itemId: updatedItem._id });

    res.status(200).json({
      status: "success",
      message: "Gallery item updated successfully",
      data: { item: updatedItem }
    });
  } catch (error) {
    logger.logError("GalleryController", error, { context: "updateGalleryItem", itemId: req.params.id });

    // Cleanup on failure
    if (req.file && req.file.path && !useCloudinary) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error("Error deleting uploaded file:", unlinkError);
      }
    }

    res.status(500).json({
      status: "error",
      message: "Error updating gallery item",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error"
    });
  }
};

// Admin - delete gallery item
const deleteGalleryItem = async (req, res) => {
  try {
    const item = await Gallery.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        status: "error",
        message: "Gallery item not found"
      });
    }

    // Delete file (local only)
    if (item.image && item.image.startsWith("/uploads/gallery/")) {
      try {
        const filePath = path.join(process.cwd(), "uploads", item.image.replace("/uploads/", ""));
        await fs.unlink(filePath);
      } catch (unlinkError) {
        console.error("Error deleting gallery image:", unlinkError);
      }
    }

    await Gallery.findByIdAndDelete(req.params.id);

    cache.invalidateGallery();
    logger.logInfo("GalleryController", "Gallery item deleted, cache invalidated", { itemId: req.params.id });

    res.status(200).json({
      status: "success",
      message: "Gallery item deleted successfully"
    });
  } catch (error) {
    logger.logError("GalleryController", error, { context: "deleteGalleryItem", itemId: req.params.id });
    res.status(500).json({
      status: "error",
      message: "Error deleting gallery item",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error"
    });
  }
};

module.exports = {
  getPublicGallery,
  getAllGallery,
  getGalleryById,
  createGalleryItem,
  updateGalleryItem,
  deleteGalleryItem
};
