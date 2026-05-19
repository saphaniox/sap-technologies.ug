const path = require("path");
const { cloudinary } = require("../config/cloudinary");

const isRemoteUrl = (value = "") => /^https?:\/\//i.test(value);
const isLocalUploadUrl = (value = "") => value.startsWith("/uploads/");
const looksLikeFilesystemPath = (value = "") => (
  path.isAbsolute(value) ||
  value.includes("\\") ||
  value.startsWith("./") ||
  value.startsWith("../")
);

const getResourceType = (file) => {
  if (file?.resource_type) return file.resource_type;
  if (file?.mimetype?.startsWith("video/")) return "video";
  if (file?.mimetype?.startsWith("image/")) return "image";
  return "auto";
};

const getUploadedFileUrl = (file, folder = "uploads") => {
  if (!file) return null;

  const directUrl = file.secure_url || file.url || (isRemoteUrl(file.path) ? file.path : null);
  if (directUrl) return directUrl;

  if (isLocalUploadUrl(file.path)) return file.path;

  const publicId = file.public_id || file.file_id;
  if (publicId) {
    return cloudinary.url(publicId, {
      secure: true,
      resource_type: getResourceType(file),
      type: "upload"
    });
  }

  if (file.path && !looksLikeFilesystemPath(file.path)) {
    return cloudinary.url(file.path, {
      secure: true,
      resource_type: getResourceType(file),
      type: "upload"
    });
  }

  return file.filename ? `/uploads/${folder}/${file.filename}` : null;
};

module.exports = {
  getUploadedFileUrl
};
