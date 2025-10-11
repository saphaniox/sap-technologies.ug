const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { isCloudinaryConfigured, storageConfigs } = require("./cloudinary");

// Ensure upload directories exist (fallback for local storage)
const createUploadDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Create all necessary upload directories (only used if Cloudinary not configured)
const baseUploadDir = path.join(__dirname, "../../uploads");
const profilePicsDir = path.join(baseUploadDir, "profile-pics");
const servicesDir = path.join(baseUploadDir, "services");
const projectsDir = path.join(baseUploadDir, "projects");
const productsDir = path.join(baseUploadDir, "products");
const signaturesDir = path.join(baseUploadDir, "signatures");
const partnersDir = path.join(baseUploadDir, "partners");
const awardsDir = path.join(baseUploadDir, "awards");

createUploadDir(profilePicsDir);
createUploadDir(servicesDir);
createUploadDir(projectsDir);
createUploadDir(productsDir);
createUploadDir(signaturesDir);
createUploadDir(partnersDir);
createUploadDir(awardsDir);

// Check if Cloudinary is configured
const useCloudinary = isCloudinaryConfigured();

// Configure storage for different upload types (LOCAL STORAGE FALLBACK)
const createLocalStorage = (uploadPath) => {
  return multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
      // Generate unique filename
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
    }
  });
};

// File filter for images only
const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

// File filter for images and documents
const mediaFilter = (req, file, cb) => {
  const allowedTypes = ["image/", "application/pdf", "text/"];
  const isAllowed = allowedTypes.some(type => file.mimetype.startsWith(type));
  
  if (isAllowed) {
    cb(null, true);
  } else {
    cb(new Error("Only image, PDF, and text files are allowed!"), false);
  }
};

// Configure multer instances for different purposes
// Use Cloudinary if configured, otherwise use local storage

const profileUpload = multer({
  storage: useCloudinary ? storageConfigs['profile-pics'] : createLocalStorage(profilePicsDir),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: imageFilter
});

const serviceUpload = multer({
  storage: useCloudinary ? storageConfigs.services : createLocalStorage(servicesDir),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: imageFilter
});

const projectUpload = multer({
  storage: useCloudinary ? storageConfigs.projects : createLocalStorage(projectsDir),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB limit
  },
  fileFilter: mediaFilter
});

const productUpload = multer({
  storage: useCloudinary ? storageConfigs.products : createLocalStorage(productsDir),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: imageFilter
});

const signatureUpload = multer({
  storage: useCloudinary ? storageConfigs.signatures : createLocalStorage(signaturesDir),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for signatures
  },
  fileFilter: imageFilter
});

const partnerUpload = multer({
  storage: useCloudinary ? storageConfigs.partners : createLocalStorage(partnersDir),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: imageFilter
});

const awardUpload = multer({
  storage: useCloudinary ? storageConfigs.awards : createLocalStorage(awardsDir),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: imageFilter
});

// Log storage mode
if (useCloudinary) {
  console.log('✅ File uploads configured with Cloudinary (cloud storage)');
} else {
  console.log('⚠️  File uploads using local storage (not recommended for production)');
}

module.exports = {
  profileUpload,
  serviceUpload,
  projectUpload,
  productUpload,
  signatureUpload,
  partnerUpload,
  awardUpload,
  // Legacy export for backward compatibility
  upload: profileUpload,
  useCloudinary // Export for use in controllers
};

