/**
 * Cloudinary Configuration
 * 
 * Manages cloud storage for images, PDFs, and other file uploads.
 * Provides automatic optimization, CDN delivery, and transformation capabilities.
 * 
 * Features:
 * - Automatic image optimization (format, quality, size)
 * - CDN-based delivery for fast global access
 * - Image transformations (resize, crop, filters)
 * - Secure URL generation
 * - Organized folder structure
 * 
 * Environment Variables Required:
 * - CLOUDINARY_CLOUD_NAME: Your Cloudinary cloud name
 * - CLOUDINARY_API_KEY: Your Cloudinary API key
 * - CLOUDINARY_API_SECRET: Your Cloudinary API secret
 * 
 * @module config/cloudinary
 */

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

/**
 * Initialize Cloudinary with environment credentials
 */
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true // Always use HTTPS
});

/**
 * Check if Cloudinary is properly configured
 */
const isCloudinaryConfigured = () => {
    const configured = !!(
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
    );
    
    if (configured) {
        console.log('✅ Cloudinary configured:', process.env.CLOUDINARY_CLOUD_NAME);
    } else {
        console.warn('⚠️  Cloudinary not configured - using local storage');
    }
    
    return configured;
};

/**
 * Create Cloudinary storage configurations for different upload types
 */
const createCloudinaryStorage = (folder, allowedFormats = ['jpg', 'jpeg', 'png', 'gif', 'webp']) => {
    return new CloudinaryStorage({
        cloudinary: cloudinary,
        params: async (req, file) => {
            // Generate unique filename
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const filename = file.fieldname + '-' + uniqueSuffix;
            
            return {
                folder: `sap-technologies/${folder}`, // Organize by folder
                allowed_formats: allowedFormats,
                public_id: filename,
                resource_type: 'auto', // Automatically detect resource type
                transformation: folder === 'products' || folder === 'partners' || folder === 'services'
                    ? [
                        { width: 1200, height: 800, crop: 'limit' }, // Max dimensions
                        { quality: 'auto:good' }, // Automatic quality optimization
                        { fetch_format: 'auto' } // Automatic format selection (WebP when supported)
                    ]
                    : folder === 'profile-pics'
                    ? [
                        { width: 500, height: 500, crop: 'fill', gravity: 'face' },
                        { quality: 'auto:good' },
                        { fetch_format: 'auto' }
                    ]
                    : undefined // No transformation for certificates, PDFs, etc.
            };
        }
    });
};

/**
 * Storage configurations for different upload types
 */
const storageConfigs = {
    products: createCloudinaryStorage('products', ['jpg', 'jpeg', 'png', 'webp']),
    services: createCloudinaryStorage('services', ['jpg', 'jpeg', 'png', 'webp']),
    partners: createCloudinaryStorage('partners', ['jpg', 'jpeg', 'png', 'webp']),
    projects: createCloudinaryStorage('projects', ['jpg', 'jpeg', 'png', 'webp']),
    'profile-pics': createCloudinaryStorage('profile-pics', ['jpg', 'jpeg', 'png', 'webp']),
    awards: createCloudinaryStorage('awards', ['jpg', 'jpeg', 'png', 'webp']),
    certificates: createCloudinaryStorage('certificates', ['pdf', 'jpg', 'jpeg', 'png']),
    signatures: createCloudinaryStorage('signatures', ['png', 'jpg', 'jpeg'])
};

/**
 * Delete file from Cloudinary
 * @param {string} publicId - The public ID of the file to delete
 * @param {string} resourceType - Type of resource ('image', 'raw', 'video')
 */
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
    try {
        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType
        });
        
        if (result.result === 'ok') {
            console.log(`✅ Deleted from Cloudinary: ${publicId}`);
            return true;
        } else {
            console.warn(`⚠️  Failed to delete from Cloudinary: ${publicId}`, result);
            return false;
        }
    } catch (error) {
        console.error(`❌ Error deleting from Cloudinary: ${publicId}`, error.message);
        return false;
    }
};

/**
 * Extract public ID from Cloudinary URL
 * @param {string} url - Cloudinary URL
 * @returns {string|null} - Public ID or null if not a Cloudinary URL
 */
const extractPublicId = (url) => {
    if (!url || !url.includes('cloudinary.com')) {
        return null;
    }
    
    try {
        // Example URL: https://res.cloudinary.com/cloud-name/image/upload/v1234567890/folder/filename.jpg
        const parts = url.split('/');
        const uploadIndex = parts.indexOf('upload');
        if (uploadIndex === -1) return null;
        
        // Get everything after 'upload/vXXXXXXXXXX/'
        const pathParts = parts.slice(uploadIndex + 2); // Skip 'upload' and version
        const publicIdWithExt = pathParts.join('/');
        
        // Remove file extension
        const publicId = publicIdWithExt.substring(0, publicIdWithExt.lastIndexOf('.'));
        return publicId;
    } catch (error) {
        console.error('Error extracting public ID:', error);
        return null;
    }
};

/**
 * Upload file buffer to Cloudinary (for direct uploads without multer)
 * @param {Buffer} buffer - File buffer
 * @param {string} folder - Destination folder
 * @param {object} options - Additional options
 */
const uploadBuffer = async (buffer, folder, options = {}) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: `sap-technologies/${folder}`,
                resource_type: 'auto',
                ...options
            },
            (error, result) => {
                if (error) {
                    console.error(`❌ Cloudinary upload error (${folder}):`, error);
                    reject(error);
                } else {
                    console.log(`✅ Uploaded to Cloudinary: ${result.secure_url}`);
                    resolve(result);
                }
            }
        );
        
        uploadStream.end(buffer);
    });
};

/**
 * Get optimized image URL with transformations
 * @param {string} publicId - Cloudinary public ID
 * @param {object} transformations - Transformation options
 */
const getOptimizedUrl = (publicId, transformations = {}) => {
    return cloudinary.url(publicId, {
        secure: true,
        quality: 'auto:good',
        fetch_format: 'auto',
        ...transformations
    });
};

module.exports = {
    cloudinary,
    isCloudinaryConfigured,
    storageConfigs,
    deleteFromCloudinary,
    extractPublicId,
    uploadBuffer,
    getOptimizedUrl
};
