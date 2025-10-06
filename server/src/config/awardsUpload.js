const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure awards upload directory exists
const uploadsDir = path.join(__dirname, "../../uploads/awards");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage for awards photos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename for nominee photos
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
        cb(null, "nominee-" + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter for images only (enhanced validation for award photos)
const fileFilter = (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith("image/")) {
        // Additional check for allowed image formats
        const allowedFormats = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
        const fileExtension = path.extname(file.originalname).toLowerCase();
        
        if (allowedFormats.includes(fileExtension)) {
            cb(null, true);
        } else {
            cb(new Error("Only JPG, JPEG, PNG, GIF, and WebP image files are allowed!"), false);
        }
    } else {
        cb(new Error("Only image files are allowed for nominee photos!"), false);
    }
};

// Configure multer for awards with specific settings
const awardsUpload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit for nominee photos
        files: 1 // Only allow one file per request
    },
    fileFilter: fileFilter
});

module.exports = awardsUpload;