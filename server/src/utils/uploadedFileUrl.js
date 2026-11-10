const path = require("path");

const isRemoteUrl = (value = "") => /^https?:\/\//i.test(value);
const isLocalUploadUrl = (value = "") => value.startsWith("/uploads/");
const looksLikeFilesystemPath = (value = "") => (
  path.isAbsolute(value) ||
  value.includes("\\") ||
  value.startsWith("./") ||
  value.startsWith("../")
);

const getUploadedFileUrl = (file, folder = "uploads") => {
  if (!file) {
    console.warn('⚠️  getUploadedFileUrl called with null/undefined file');
    return null;
  }

  // Keep existing remote references readable while all new uploads use VPS storage.
  const directUrl = file.url || (isRemoteUrl(file.path) ? file.path : null);
  if (directUrl) {
    console.log(`✅ Using direct URL from file object: ${directUrl.substring(0, 80)}...`);
    return directUrl;
  }

  // Check if it's already a local upload URL
  if (isLocalUploadUrl(file.path)) {
    console.log(`✅ Using local upload URL: ${file.path}`);
    return file.path;
  }

  // Fallback to local storage path
  const fallbackUrl = file.filename
    ? `/uploads/${folder}/${path.basename(file.filename)}`
    : file.path && !looksLikeFilesystemPath(file.path)
      ? `/uploads/${folder}/${path.basename(file.path)}`
      : null;
  if (fallbackUrl) {
    console.log(`⚠️  Using fallback local path: ${fallbackUrl}`);
  } else {
    console.error('❌ Could not generate URL for file:', {
      filename: file.filename,
      url: file.url ? 'present' : 'missing',
      path: file.path ? file.path.substring(0, 50) : 'missing'
    });
  }
  
  return fallbackUrl;
};

module.exports = {
  getUploadedFileUrl
};
