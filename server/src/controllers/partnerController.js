const Partner = require("../models/Partner");
const path = require("path");
const fs = require("fs").promises;
const { useCloudinary } = require("../config/fileUpload");
const { getUploadedFileUrl } = require("../utils/uploadedFileUrl");

/**
 * Get the correct file path/URL for uploaded file
 * Works with both Cloudinary and local storage
 */
const getFileUrl = (file, folder = 'partners') => {
  return getUploadedFileUrl(file, folder);
};

const optionalText = (value) => {
  if (typeof value !== "string") return value;
  return value.trim();
};

const normalizeBoolean = (value, fallback) => {
  if (value === undefined) return fallback;
  if (typeof value === "boolean") return value;
  return String(value).toLowerCase() === "true";
};

const normalizeOrder = (value, fallback) => {
  if (value === undefined || value === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

// Get active partners (public)
const getPartners = async (req, res) => {
  try {
    const partners = await Partner.find({ isActive: true })
      .sort({ order: 1, createdAt: -1 })
      .select("-__v");
    
    res.json(partners);
  } catch (error) {
    console.error("Error fetching partners:", error);
    res.status(500).json({ 
      message: "Error fetching partners",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error"
    });
  }
};

// Get all partners (admin)
const getAllPartners = async (req, res) => {
  try {
    const partners = await Partner.find()
      .sort({ order: 1, createdAt: -1 })
      .select("-__v");
    
    res.json(partners);
  } catch (error) {
    console.error("Error fetching all partners:", error);
    res.status(500).json({ 
      message: "Error fetching partners",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error"
    });
  }
};

// Get partner by ID
const getPartnerById = async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id);
    
    if (!partner) {
      return res.status(404).json({ message: "Partner not found" });
    }
    
    res.json(partner);
  } catch (error) {
    console.error("Error fetching partner:", error);
    res.status(500).json({ 
      message: "Error fetching partner",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error"
    });
  }
};

// Create partner
const createPartner = async (req, res) => {
  try {
    const { name, website, description, isActive, order } = req.body;
    
    // Check if logo was uploaded
    if (!req.file) {
      return res.status(400).json({ message: "Partner logo is required" });
    }

    const partner = new Partner({
      name: optionalText(name),
      logo: getFileUrl(req.file, 'partners'),
      website: optionalText(website),
      description: optionalText(description),
      isActive: normalizeBoolean(isActive, true),
      order: normalizeOrder(order, 0)
    });

    await partner.save();
    res.status(201).json(partner);
  } catch (error) {
    console.error("Error creating partner:", error);
    
    // Clean up uploaded file if partner creation failed
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error("Error deleting uploaded file:", unlinkError);
      }
    }
    
    if (error.name === "ValidationError") {
      return res.status(400).json({ 
        message: "Validation error",
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    
    res.status(500).json({ 
      message: "Error creating partner",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error"
    });
  }
};

// Update partner
const updatePartner = async (req, res) => {
  try {
    const { name, website, description, isActive, order } = req.body;
    const partner = await Partner.findById(req.params.id);
    
    if (!partner) {
      // Clean up uploaded file if partner not found
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          console.error("Error deleting uploaded file:", unlinkError);
        }
      }
      return res.status(404).json({ message: "Partner not found" });
    }

    // Store old logo path for cleanup
    const oldLogoPath = partner.logo;

    // Update fields. Blank optional text fields are allowed so admins can keep
    // a partner as logo-only.
    if (name !== undefined) partner.name = optionalText(name);
    if (website !== undefined) partner.website = optionalText(website);
    if (description !== undefined) partner.description = optionalText(description);
    if (isActive !== undefined) partner.isActive = normalizeBoolean(isActive, partner.isActive);
    if (order !== undefined) partner.order = normalizeOrder(order, partner.order);

    // Update logo if new file uploaded
    if (req.file) {
      partner.logo = getFileUrl(req.file, 'partners');
      
      // Delete old logo file (only for local storage)
      if (!useCloudinary && oldLogoPath && oldLogoPath.startsWith("/uploads/partners/")) {
        try {
          const oldFilePath = path.join(__dirname, "../../uploads/partners", path.basename(oldLogoPath));
          await fs.unlink(oldFilePath);
        } catch (unlinkError) {
          console.error("Error deleting old logo file:", unlinkError);
        }
      }
    }

    await partner.save();
    res.json(partner);
  } catch (error) {
    console.error("Error updating partner:", error);
    
    // Clean up uploaded file if update failed
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error("Error deleting uploaded file:", unlinkError);
      }
    }
    
    if (error.name === "ValidationError") {
      return res.status(400).json({ 
        message: "Validation error",
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    
    res.status(500).json({ 
      message: "Error updating partner",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error"
    });
  }
};

// Delete partner
const deletePartner = async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id);
    
    if (!partner) {
      return res.status(404).json({ message: "Partner not found" });
    }

    // Delete logo file
    if (partner.logo && partner.logo.startsWith("/uploads/partners/")) {
      try {
        const filePath = path.join(__dirname, "../../uploads/partners", path.basename(partner.logo));
        await fs.unlink(filePath);
      } catch (unlinkError) {
        console.error("Error deleting logo file:", unlinkError);
      }
    }

    await Partner.findByIdAndDelete(req.params.id);
    res.json({ message: "Partner deleted successfully" });
  } catch (error) {
    console.error("Error deleting partner:", error);
    res.status(500).json({ 
      message: "Error deleting partner",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error"
    });
  }
};

module.exports = {
  getPartners,
  getAllPartners,
  getPartnerById,
  createPartner,
  updatePartner,
  deletePartner
};
