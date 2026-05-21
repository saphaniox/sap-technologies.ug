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
const softwareDir = path.join(baseUploadDir, "software");
const iotDir = path.join(baseUploadDir, "iot");
const signaturesDir = path.join(baseUploadDir, "signatures");
const partnersDir = path.join(baseUploadDir, "partners");
const awardsDir = path.join(baseUploadDir, "awards");

createUploadDir(profilePicsDir);
createUploadDir(servicesDir);
createUploadDir(projectsDir);
createUploadDir(productsDir);
createUploadDir(softwareDir);
createUploadDir(iotDir);
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

// Safety function: fallback to local storage if Cloudinary storage is null
const getStorage = (cloudinaryStorage, localStoragePath) => {
  if (useCloudinary && cloudinaryStorage) {
    return cloudinaryStorage;
  }
  return createLocalStorage(localStoragePath);
};

// Configure multer instances for different purposes
// Use Cloudinary if configured, otherwise use local storage

const profileUpload = multer({
  storage: getStorage(storageConfigs.profilePics, profilePicsDir),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: imageFilter
});

const serviceUpload = multer({
  storage: getStorage(storageConfigs.services, servicesDir),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: imageFilter
});

const projectUpload = multer({
  storage: getStorage(storageConfigs.projects, projectsDir),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB limit
  },
  fileFilter: imageFilter
});

const productUpload = multer({
  storage: getStorage(storageConfigs.products, productsDir),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: imageFilter
});

const signatureUpload = multer({
  storage: getStorage(storageConfigs.signatures, signaturesDir),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for signatures
  },
  fileFilter: imageFilter
});

const partnerUpload = multer({
  storage: getStorage(storageConfigs.partners, partnersDir),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: imageFilter
});

const awardUpload = multer({
  storage: getStorage(storageConfigs.awards, awardsDir),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: imageFilter
});

const softwareUpload = multer({
  storage: getStorage(storageConfigs.software, softwareDir),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: imageFilter
});

const iotUpload = multer({
  storage: getStorage(storageConfigs.iot, iotDir),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit to avoid Render gateway timeouts
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image and video files are allowed!"), false);
    }
  }
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
  softwareUpload,
  iotUpload,
  signatureUpload,
  partnerUpload,
  awardUpload,
  // Legacy export for backward compatibility
  upload: profileUpload,
  useCloudinary // Export for use in controllers
};

