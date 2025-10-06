/**
 * Partner Controller
 * 
 * Manages business partners and sponsors displayed on the website.
 * 
 * Features:
 * - Partner CRUD operations (admin)
 * - Public partner listing (active only)
 * - Logo upload and management
 * - Order/priority management
 * - Active/inactive status control
 * - File cleanup on deletion
 * - Sorted display (by order, then creation date)
 * 
 * Public Endpoints:
 * - GET /partners - List active partners
 * 
 * Admin Endpoints:
 * - GET /admin/partners - List all partners
 * - GET /admin/partners/:id - Get single partner
 * - POST /admin/partners - Create partner
 * - PUT /admin/partners/:id - Update partner
 * - DELETE /admin/partners/:id - Delete partner
 * 
 * @module controllers/partnerController
 */

const Partner = require("../models/Partner");
const path = require("path");
const fs = require("fs").promises;

// Get all partners (public)
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
      name,
      logo: `/uploads/partners/${req.file.filename}`,
      website,
      description,
      isActive: isActive !== undefined ? isActive : true,
      order: order || 0
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

    // Update fields
    partner.name = name || partner.name;
    partner.website = website !== undefined ? website : partner.website;
    partner.description = description !== undefined ? description : partner.description;
    partner.isActive = isActive !== undefined ? isActive : partner.isActive;
    partner.order = order !== undefined ? order : partner.order;

    // Update logo if new file uploaded
    if (req.file) {
      partner.logo = `/uploads/partners/${req.file.filename}`;
      
      // Delete old logo file
      if (oldLogoPath && oldLogoPath.startsWith("/uploads/partners/")) {
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