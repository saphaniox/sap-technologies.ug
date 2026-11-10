const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure upload directories exist on the VPS.
const createUploadDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Create all upload directories used by VPS-backed file storage.
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
const galleryDir = path.join(baseUploadDir, "gallery");
const jobsDir = path.join(baseUploadDir, "jobs");
const jobApplicationsDir = path.join(baseUploadDir, "job-applications");

createUploadDir(profilePicsDir);
createUploadDir(servicesDir);
createUploadDir(projectsDir);
createUploadDir(productsDir);
createUploadDir(softwareDir);
createUploadDir(iotDir);
createUploadDir(signaturesDir);
createUploadDir(partnersDir);
createUploadDir(awardsDir);
createUploadDir(galleryDir);
createUploadDir(jobsDir);
createUploadDir(jobApplicationsDir);

// Configure disk storage for uploads.
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
  if (file.mimetype === "image/svg+xml") {
    cb(new Error("SVG uploads are not allowed for security reasons"), false);
  } else if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

const imageVideoFilter = (req, file, cb) => {
  if (file.mimetype === "image/svg+xml") {
    cb(new Error("SVG uploads are not allowed for security reasons"), false);
  } else if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image and video files are allowed!"), false);
  }
};

const allowedDocumentMimeTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/rtf",
  "text/rtf",
  "text/plain",
  "application/vnd.oasis.opendocument.text"
]);

const allowedDocumentExtensions = new Set([".pdf", ".doc", ".docx", ".rtf", ".txt", ".odt"]);

const documentFilter = (req, file, cb) => {
  const extension = path.extname(file.originalname || "").toLowerCase();

  if (allowedDocumentExtensions.has(extension) && allowedDocumentMimeTypes.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF, Word, RTF, TXT, and ODT document files are allowed."), false);
  }
};

// Configure multer instances for different purposes

const profileUpload = multer({
  storage: createLocalStorage(profilePicsDir),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: imageFilter
});

const serviceUpload = multer({
  storage: createLocalStorage(servicesDir),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: imageFilter
});

const projectUpload = multer({
  storage: createLocalStorage(projectsDir),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB limit
  },
  fileFilter: imageFilter
});

const productUpload = multer({
  storage: createLocalStorage(productsDir),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: imageFilter
});

const signatureUpload = multer({
  storage: createLocalStorage(signaturesDir),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for signatures
  },
  fileFilter: imageFilter
});

const partnerUpload = multer({
  storage: createLocalStorage(partnersDir),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: imageFilter
});

const awardUpload = multer({
  storage: createLocalStorage(awardsDir),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: imageFilter
});

const galleryUpload = multer({
  storage: createLocalStorage(galleryDir),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB per file so gallery videos can upload safely
  },
  fileFilter: imageVideoFilter
});

const jobPosterUpload = multer({
  storage: createLocalStorage(jobsDir),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for job posters
  },
  fileFilter: imageFilter
});

const jobApplicationUpload = multer({
  storage: createLocalStorage(jobApplicationsDir),
  limits: {
    fileSize: 8 * 1024 * 1024, // 8MB per application document
    files: 2
  },
  fileFilter: documentFilter
});

const softwareUpload = multer({
  storage: createLocalStorage(softwareDir),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: imageFilter
});

const iotUpload = multer({
  storage: createLocalStorage(iotDir),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for uploads
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image and video files are allowed!"), false);
    }
  }
});

console.log(`✅ File uploads configured with VPS storage at ${baseUploadDir}`);

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
  galleryUpload,
  jobPosterUpload,
  jobApplicationUpload,
  resumeUpload: jobApplicationUpload,
  upload: profileUpload
};
