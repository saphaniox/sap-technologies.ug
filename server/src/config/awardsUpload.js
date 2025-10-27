const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { isCloudinaryConfigured, storageConfigs } = require("./cloudinary");

// Ensure awards upload directory exists (fallback for local storage)
const uploadsDir = path.join(__dirname, "../../uploads/awards");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Check if Cloudinary is configured
const useCloudinary = isCloudinaryConfigured();

// Configure LOCAL storage for awards photos (fallback)
const localStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename for nominee photos
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
        cb(null, "nominee-" + uniqueSuffix + path.extname(file.originalname));
    }
});

// Use Cloudinary if configured, otherwise use local storage
const storage = useCloudinary ? storageConfigs.awards : localStorage;

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

// Create multer upload instance
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit for nominee photos
        files: 1 // Only allow one file per request
    },
    fileFilter: fileFilter
}).single('nomineePhoto');

// Create middleware with error handling
const awardPhotoUpload = () => {
    return (req, res, next) => {
        if (!req.headers) {
            console.error('❌ Invalid request object - missing headers');
            return res.status(400).json({
                status: "error",
                message: "Invalid request format"
            });
        }

        upload(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                // Multer error (e.g., file too large)
                console.error('❌ Multer error:', err.message);
                return res.status(400).json({
                    status: "error",
                    message: err.code === 'LIMIT_FILE_SIZE' 
                        ? "File is too large. Maximum size is 5MB"
                        : `Upload error: ${err.message}`
                });
            } else if (err) {
                // Other errors (e.g., file type)
                console.error('❌ File upload error:', err.message);
                return res.status(400).json({
                    status: "error",
                    message: err.message || "File upload failed"
                });
            }
            
            // Success - no file is also okay
            if (!req.file) {
                console.log('ℹ️ No file uploaded - continuing with default image');
            } else {
                console.log('✅ File uploaded successfully:', req.file.filename || req.file.path);
            }
            
            next();
        });
    };
};

module.exports = awardPhotoUpload;