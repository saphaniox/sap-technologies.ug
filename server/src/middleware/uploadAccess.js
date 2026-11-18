const path = require("node:path");

const allowedExtensions = new Set([
  ".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif",
  ".pdf", ".doc", ".docx", ".rtf", ".txt", ".odt",
  ".mp4", ".m4v", ".webm", ".mov", ".avi", ".ogv", ".ogg", ".mpeg", ".mpg"
]);

// Reject before express.static starts writing headers or a response body.
const uploadAccess = (req, res, next) => {
  let pathname;
  try {
    pathname = decodeURIComponent(req.path);
  } catch {
    return res.sendStatus(400);
  }
  const extension = path.extname(pathname).toLowerCase();
  if (!allowedExtensions.has(extension)) {
    return res.sendStatus(403);
  }
  // Express 5's MIME database identifies MP4 as application/mp4.
  // Use explicit video types for consistent native-player handling.
  const videoTypes = {
    ".mp4": "video/mp4", ".m4v": "video/mp4", ".webm": "video/webm",
    ".mov": "video/quicktime", ".avi": "video/x-msvideo",
    ".ogv": "video/ogg", ".ogg": "video/ogg",
    ".mpeg": "video/mpeg", ".mpg": "video/mpeg"
  };
  if (videoTypes[extension]) res.set("Content-Type", videoTypes[extension]);
  next();
};

module.exports = { uploadAccess };
