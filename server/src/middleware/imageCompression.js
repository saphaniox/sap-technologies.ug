const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

/**
 * Image compression middleware using sharp
 * Compresses images while maintaining quality
 * @param {Object} options - Compression options
 * @param {number} options.quality - JPEG/WebP quality (1-100)
 * @param {number} options.maxWidth - Maximum width in pixels
 * @param {number} options.maxHeight - Maximum height in pixels
 * @param {boolean} options.convertToWebP - Convert to WebP format
 */
const compressImage = (options = {}) => {
  const {
    quality = 80,
    maxWidth = 1920,
    maxHeight = 1080,
    convertToWebP = false
  } = options;

  return async (req, res, next) => {
    // If no files uploaded, continue
    if (!req.files || req.files.length === 0) {
      if (!req.file) {
        return next();
      }
      // Handle single file
      req.files = [req.file];
    }

    try {
      const compressionPromises = req.files.map(async (file) => {
        // Only compress images
        if (!file.mimetype.startsWith("image/")) {
          return file;
        }

        // Skip GIFs as sharp doesn't handle animated GIFs well
        if (file.mimetype === "image/gif") {
          console.log(`⏭️  Skipping GIF compression: ${file.filename}`);
          return file;
        }

        const originalPath = file.path;
        const originalSize = file.size;
        const ext = convertToWebP ? ".webp" : path.extname(file.filename);
        const compressedFilename = file.filename.replace(path.extname(file.filename), `-compressed${ext}`);
        const compressedPath = path.join(path.dirname(originalPath), compressedFilename);

        try {
          // Compress image
          let sharpInstance = sharp(originalPath)
            .resize(maxWidth, maxHeight, {
              fit: "inside",
              withoutEnlargement: true
            });

          // Apply format-specific compression
          if (convertToWebP || file.mimetype === "image/webp") {
            sharpInstance = sharpInstance.webp({ quality });
          } else if (file.mimetype === "image/png") {
            sharpInstance = sharpInstance.png({
              quality,
              compressionLevel: 9,
              adaptiveFiltering: true
            });
          } else {
            // Default to JPEG for other formats
            sharpInstance = sharpInstance.jpeg({ quality, progressive: true });
          }

          await sharpInstance.toFile(compressedPath);

          // Get compressed file size
          const compressedStats = fs.statSync(compressedPath);
          const compressedSize = compressedStats.size;
          const compressionRatio = ((1 - compressedSize / originalSize) * 100).toFixed(2);

          // If compression saved significant space (>10%), use compressed version
          if (compressedSize < originalSize * 0.9) {
            // Delete original
            fs.unlinkSync(originalPath);
            
            // Update file object
            file.path = compressedPath;
            file.filename = compressedFilename;
            file.size = compressedSize;
            file.isCompressed = true;
            
            console.log(`✅ Compressed ${file.originalname}: ${(originalSize / 1024).toFixed(2)}KB → ${(compressedSize / 1024).toFixed(2)}KB (saved ${compressionRatio}%)`);
          } else {
            // Compression didn't help much, keep original
            fs.unlinkSync(compressedPath);
            console.log(`⏭️  Kept original ${file.originalname} (compression saved <10%)`);
          }
        } catch (compressionError) {
          console.error(`❌ Error compressing ${file.filename}:`, compressionError.message);
          // Keep original file if compression fails
        }

        return file;
      });

      await Promise.all(compressionPromises);
      next();
    } catch (error) {
      console.error("Image compression middleware error:", error);
      // Continue even if compression fails
      next();
    }
  };
};

/**
 * Preset compression configurations
 */
const compressionPresets = {
  // High quality for portfolios, IoT projects
  highQuality: compressImage({ quality: 85, maxWidth: 2560, maxHeight: 1440 }),
  
  // Standard quality for general use
  standard: compressImage({ quality: 80, maxWidth: 1920, maxHeight: 1080 }),
  
  // Optimized for web (smaller file sizes)
  web: compressImage({ quality: 75, maxWidth: 1920, maxHeight: 1080, convertToWebP: false }),
  
  // Thumbnails and small images
  thumbnail: compressImage({ quality: 70, maxWidth: 800, maxHeight: 600 }),
  
  // Profile pictures
  profile: compressImage({ quality: 80, maxWidth: 512, maxHeight: 512 })
};

module.exports = {
  compressImage,
  compressionPresets
};
