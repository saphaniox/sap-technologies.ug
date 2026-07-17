const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const repoRoot = path.join(__dirname, "../../..");
const defaultWatermarkPath = path.join(repoRoot, "sap-technologies-official/public/images/logo-watermark.png");
const watermarkPath = process.env.SAPTECH_WATERMARK_PATH || defaultWatermarkPath;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const getTargetDimensions = (metadata, maxWidth, maxHeight) => {
  const originalWidth = metadata.width || maxWidth;
  const originalHeight = metadata.height || maxHeight;
  const scale = Math.min(1, maxWidth / originalWidth, maxHeight / originalHeight);

  return {
    width: Math.max(1, Math.round(originalWidth * scale)),
    height: Math.max(1, Math.round(originalHeight * scale))
  };
};

const createWatermarkLayer = async (targetWidth, targetHeight) => {
  if (!fs.existsSync(watermarkPath) || targetWidth < 180 || targetHeight < 140) {
    return null;
  }

  const logoWidth = Math.round(clamp(targetWidth * 0.11, 58, 150));
  const input = await sharp(watermarkPath)
    .resize({ width: logoWidth, withoutEnlargement: true })
    .png()
    .toBuffer();
  const metadata = await sharp(input).metadata();

  return {
    input,
    left: Math.max(0, Math.round((targetWidth - (metadata.width || logoWidth)) / 2)),
    top: Math.max(0, Math.round((targetHeight - (metadata.height || logoWidth)) / 2)),
    opacity: 0.24
  };
};

/**
 * Image compression middleware using sharp
 * Compresses images while maintaining quality
 * @param {Object} options - Compression options
 * @param {number} options.quality - JPEG/WebP quality (1-100)
 * @param {number} options.maxWidth - Maximum width in pixels
 * @param {number} options.maxHeight - Maximum height in pixels
 * @param {boolean} options.convertToWebP - Convert to WebP format
 * @param {boolean} options.watermark - Add the SAPTech logo to uploaded content photos
 */
const compressImage = (options = {}) => {
  const {
    quality = 80,
    maxWidth = 1920,
    maxHeight = 1080,
    convertToWebP = false,
    watermark = false
  } = options;

  return async (req, res, next) => {
    // Support both multer.array() (req.files is Array) and multer.fields() (req.files is Object)
    let imagesToCompress = [];

    if (req.file) {
      imagesToCompress = [req.file];
    } else if (Array.isArray(req.files) && req.files.length > 0) {
      imagesToCompress = req.files;
    } else if (req.files && typeof req.files === 'object' && !Array.isArray(req.files)) {
      // multer.fields() format — only compress image fields, skip videos
      imagesToCompress = Object.values(req.files).flat();
    }

    if (imagesToCompress.length === 0) {
      return next();
    }

    try {
      const compressionPromises = imagesToCompress.map(async (file) => {
        // Only compress images
        if (!file.mimetype.startsWith("image/")) {
          return file;
        }

        // Cloudinary storage returns remote URLs/public IDs after upload. Sharp
        // should only process real local fallback files; Cloudinary handles
        // remote optimization through upload/delivery transformations.
        if (!file.path || /^https?:\/\//i.test(file.path) || !fs.existsSync(file.path)) {
          return file;
        }

        // Keep unwatermarked GIFs untouched so animation is preserved. Watermarked
        // content GIFs are rendered as a static optimized image with the logo.
        if (file.mimetype === "image/gif" && !watermark && !convertToWebP) {
          console.log(`⏭️  Skipping GIF compression: ${file.filename}`);
          return file;
        }

        const originalPath = file.path;
        const originalSize = file.size;
        const sourceExt = path.extname(file.filename);
        const outputFormat = convertToWebP || file.mimetype === "image/webp"
          ? "webp"
          : file.mimetype === "image/png"
            ? "png"
            : "jpeg";
        const outputExt = outputFormat === "webp" ? ".webp" : outputFormat === "png" ? ".png" : ".jpg";
        const compressedFilename = file.filename.replace(sourceExt, `-compressed${outputExt}`);
        const compressedPath = path.join(path.dirname(originalPath), compressedFilename);

        try {
          const metadata = await sharp(originalPath).metadata();
          const targetDimensions = getTargetDimensions(metadata, maxWidth, maxHeight);

          // Compress image
          let sharpInstance = sharp(originalPath)
            .resize(maxWidth, maxHeight, {
              fit: "inside",
              withoutEnlargement: true
            });
          let watermarkApplied = false;

          if (watermark) {
            const watermarkLayer = await createWatermarkLayer(targetDimensions.width, targetDimensions.height);
            if (watermarkLayer) {
              sharpInstance = sharpInstance.composite([watermarkLayer]);
              watermarkApplied = true;
            }
          }

          // Apply format-specific compression
          if (outputFormat === "webp") {
            sharpInstance = sharpInstance.webp({ quality });
          } else if (outputFormat === "png") {
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

          // Watermarked uploads must keep the processed file even if the file size grows.
          if (watermarkApplied || compressedSize < originalSize * 0.9) {
            // Delete original
            fs.unlinkSync(originalPath);
            
            // Update file object
            file.path = compressedPath;
            file.filename = compressedFilename;
            file.size = compressedSize;
            file.isCompressed = true;
            file.mimetype = outputFormat === "webp"
              ? "image/webp"
              : outputFormat === "png"
                ? "image/png"
                : "image/jpeg";
            
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
  highQuality: compressImage({ quality: 82, maxWidth: 2560, maxHeight: 1440, convertToWebP: true }),
  highQualityWatermarked: compressImage({ quality: 82, maxWidth: 2560, maxHeight: 1440, convertToWebP: true, watermark: true }),
  
  // Standard quality for general use
  standard: compressImage({ quality: 78, maxWidth: 1920, maxHeight: 1080, convertToWebP: true }),
  standardWatermarked: compressImage({ quality: 78, maxWidth: 1920, maxHeight: 1080, convertToWebP: true, watermark: true }),
  
  // Optimized for web (smaller file sizes)
  web: compressImage({ quality: 75, maxWidth: 1920, maxHeight: 1080, convertToWebP: true }),
  webWatermarked: compressImage({ quality: 75, maxWidth: 1920, maxHeight: 1080, convertToWebP: true, watermark: true }),
  
  // Thumbnails and small images
  thumbnail: compressImage({ quality: 70, maxWidth: 800, maxHeight: 600 }),
  thumbnailWatermarked: compressImage({ quality: 70, maxWidth: 800, maxHeight: 600, watermark: true }),
  gallery: compressImage({ quality: 80, maxWidth: 1600, maxHeight: 1000, convertToWebP: true, watermark: true }),
  
  // Profile pictures
  profile: compressImage({ quality: 80, maxWidth: 512, maxHeight: 512 })
};

module.exports = {
  compressImage,
  compressionPresets
};
