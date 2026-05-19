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
  if (!file) {
    console.warn('⚠️  getUploadedFileUrl called with null/undefined file');
    return null;
  }

  // Try direct URL first (Cloudinary secure_url or custom url field)
  const directUrl = file.secure_url || file.url || (isRemoteUrl(file.path) ? file.path : null);
  if (directUrl) {
    console.log(`✅ Using direct URL from file object: ${directUrl.substring(0, 80)}...`);
    return directUrl;
  }

  // Check if it's already a local upload URL
  if (isLocalUploadUrl(file.path)) {
    console.log(`✅ Using local upload URL: ${file.path}`);
    return file.path;
  }

  // Try using public_id for Cloudinary
  const publicId = file.public_id || file.file_id;
  if (publicId) {
    const cloudinaryUrl = cloudinary.url(publicId, {
      secure: true,
      resource_type: getResourceType(file),
      type: "upload"
    });
    console.log(`✅ Generated Cloudinary URL from public_id "${publicId}": ${cloudinaryUrl.substring(0, 80)}...`);
    return cloudinaryUrl;
  }

  // Try using path as public ID (sometimes the path contains the public ID)
  if (file.path && !looksLikeFilesystemPath(file.path)) {
    const cloudinaryUrl = cloudinary.url(file.path, {
      secure: true,
      resource_type: getResourceType(file),
      type: "upload"
    });
    console.log(`✅ Generated Cloudinary URL from path: ${cloudinaryUrl.substring(0, 80)}...`);
    return cloudinaryUrl;
  }

  // Fallback to local storage path
  const fallbackUrl = file.filename ? `/uploads/${folder}/${file.filename}` : null;
  if (fallbackUrl) {
    console.log(`⚠️  Using fallback local path: ${fallbackUrl}`);
  } else {
    console.error('❌ Could not generate URL for file:', {
      filename: file.filename,
      secure_url: file.secure_url ? 'present' : 'missing',
      url: file.url ? 'present' : 'missing',
      public_id: file.public_id ? 'present' : 'missing',
      path: file.path ? file.path.substring(0, 50) : 'missing'
    });
  }
  
  return fallbackUrl;
};

module.exports = {
  getUploadedFileUrl
};
