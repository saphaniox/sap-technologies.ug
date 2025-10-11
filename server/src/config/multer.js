const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { isCloudinaryConfigured, storageConfigs } = require("./cloudinary");

// Ensure upload directory exists (fallback for local storage)
const uploadDir = path.join(__dirname, "../../uploads/profile-pics");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Check if Cloudinary is configured
const useCloudinary = isCloudinaryConfigured();

// Configure LOCAL storage (fallback)
const localStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
    }
});

// Use Cloudinary if configured, otherwise use local storage
const storage = useCloudinary ? storageConfigs['profile-pics'] : localStorage;

// File filter for images only
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
        cb(null, true);
    } else {
        cb(new Error("Only image files are allowed!"), false);
    }
};

// Configure multer
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: fileFilter
});

module.exports = upload;
