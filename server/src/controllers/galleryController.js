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

const getUploadedFiles = (req) => {
  if (req.file) return [req.file];
  if (Array.isArray(req.files)) return req.files;
  if (req.files && typeof req.files === "object") {
    return Object.values(req.files).flat();
  }
  return [];
};

const getMediaType = (fileOrMedia = {}) => {
  const mimeType = fileOrMedia.mimetype || fileOrMedia.mimeType || "";
  if (fileOrMedia.type === "video" || mimeType.startsWith("video/")) return "video";
  return "image";
};

const buildMediaFromFile = (file) => ({
  url: getFileUrl(file, "gallery"),
  type: getMediaType(file),
  mimeType: file.mimetype || "",
  size: file.size || 0,
  cloudinaryId: file.public_id || null,
  originalName: file.originalname || "",
  isCompressed: Boolean(file.isCompressed)
});

const normalizeMedia = (item) => {
  const media = Array.isArray(item?.media)
    ? item.media
        .filter((mediaItem) => mediaItem?.url)
        .map((mediaItem) => ({
          url: mediaItem.url,
          type: mediaItem.type || getMediaType(mediaItem),
          mimeType: mediaItem.mimeType || "",
          size: mediaItem.size || 0,
          cloudinaryId: mediaItem.cloudinaryId || null,
          originalName: mediaItem.originalName || "",
          isCompressed: Boolean(mediaItem.isCompressed)
        }))
    : [];

  if (media.length === 0 && item?.image) {
    media.push({
      url: item.image,
      type: "image",
      mimeType: "",
      size: 0,
      cloudinaryId: item.cloudinaryId || null,
      originalName: "",
      isCompressed: false
    });
  }

  return media;
};

const getPrimaryMedia = (media = []) => media.find((item) => item.type === "image") || media[0] || null;

const parseRemoveMedia = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return String(value)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
};

const deleteLocalMediaFiles = async (mediaItems = []) => {
  const seen = new Set();
  await Promise.all(mediaItems.map(async (mediaItem) => {
    const url = typeof mediaItem === "string" ? mediaItem : mediaItem?.url;
    if (!url || seen.has(url) || !url.startsWith("/uploads/gallery/")) return;
    seen.add(url);

    try {
      const filePath = path.join(process.cwd(), "uploads", url.replace("/uploads/", ""));
      await fs.unlink(filePath);
    } catch (unlinkError) {
      console.error("Error deleting gallery media:", unlinkError);
    }
  }));
};

const deleteUploadedLocalFiles = async (files = []) => {
  if (useCloudinary) return;
  await Promise.all(files.map(async (file) => {
    if (!file?.path) return;
    try {
      await fs.unlink(file.path);
    } catch (unlinkError) {
      console.error("Error deleting uploaded gallery file:", unlinkError);
    }
  }));
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

    const uploadedFiles = getUploadedFiles(req);

    if (uploadedFiles.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "At least one gallery photo or video is required"
      });
    }

    const { title, description, category, isActive, displayOrder } = req.body;
    const media = uploadedFiles.map(buildMediaFromFile);
    const primaryMedia = getPrimaryMedia(media);

    const item = new Gallery({
      title: normalizeText(title),
      description: normalizeText(description),
      category: normalizeText(category) || "other",
      image: primaryMedia?.url,
      cloudinaryId: primaryMedia?.cloudinaryId || null,
      media,
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
    await deleteUploadedLocalFiles(getUploadedFiles(req));

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
      await deleteUploadedLocalFiles(getUploadedFiles(req));
      return res.status(404).json({
        status: "error",
        message: "Gallery item not found"
      });
    }

    const updateData = {};
    if (req.body.title !== undefined) updateData.title = normalizeText(req.body.title);
    if (req.body.description !== undefined) updateData.description = normalizeText(req.body.description);
    if (req.body.category !== undefined) updateData.category = normalizeText(req.body.category);
    if (req.body.isActive !== undefined) updateData.isActive = normalizeBoolean(req.body.isActive, item.isActive);
    if (req.body.displayOrder !== undefined) updateData.displayOrder = normalizeOrder(req.body.displayOrder, item.displayOrder);

    const uploadedFiles = getUploadedFiles(req);
    const newMedia = uploadedFiles.map(buildMediaFromFile);
    const removeMedia = parseRemoveMedia(req.body.removeMedia);
    const removeSet = new Set(removeMedia);
    const existingMedia = normalizeMedia(item);
    const retainedMedia = existingMedia.filter((mediaItem) => !removeSet.has(mediaItem.url));
    const nextMedia = [...retainedMedia, ...newMedia];

    if (removeMedia.length > 0 || newMedia.length > 0) {
      if (nextMedia.length === 0) {
        await deleteUploadedLocalFiles(uploadedFiles);
        return res.status(400).json({
          status: "error",
          message: "At least one gallery photo or video is required"
        });
      }

      const primaryMedia = getPrimaryMedia(nextMedia);
      updateData.media = nextMedia;
      updateData.image = primaryMedia?.url;
      updateData.cloudinaryId = primaryMedia?.cloudinaryId || null;
    }

    const updatedItem = await Gallery.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    cache.invalidateGallery();
    if (removeMedia.length > 0) {
      await deleteLocalMediaFiles(existingMedia.filter((mediaItem) => removeSet.has(mediaItem.url)));
    }
    logger.logInfo("GalleryController", "Gallery item updated, cache invalidated", { itemId: updatedItem._id });

    res.status(200).json({
      status: "success",
      message: "Gallery item updated successfully",
      data: { item: updatedItem }
    });
  } catch (error) {
    logger.logError("GalleryController", error, { context: "updateGalleryItem", itemId: req.params.id });

    await deleteUploadedLocalFiles(getUploadedFiles(req));

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

    await deleteLocalMediaFiles(normalizeMedia(item));

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
