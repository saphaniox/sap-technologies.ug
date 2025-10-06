const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const {
  getPartners,
  getAllPartners,
  getPartnerById,
  createPartner,
  updatePartner,
  deletePartner
} = require("../controllers/partnerController");
const { adminAuth } = require("../middleware/adminAuth");
const { validatePartner } = require("../middleware/validation");

const router = express.Router();

// Create uploads directory for partners if it doesn't exist
const partnersUploadDir = path.join(__dirname, "../../uploads/partners");
if (!fs.existsSync(partnersUploadDir)) {
  fs.mkdirSync(partnersUploadDir, { recursive: true });
}

// Configure multer for partner logo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, partnersUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, "partner-" + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only image files (JPEG, PNG, GIF, WebP, SVG) are allowed"));
    }
  }
});

// Public routes
router.get("/public", getPartners);

// Admin routes (require authentication)
router.use(adminAuth); // Apply admin authentication to all routes below

router.get("/", getAllPartners);
router.get("/:id", getPartnerById);
router.post("/", upload.single("logo"), validatePartner, createPartner);
router.put("/:id", upload.single("logo"), validatePartner, updatePartner);
router.delete("/:id", deletePartner);

module.exports = router;