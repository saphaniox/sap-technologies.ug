const cloudinaryLib = require('cloudinary');
const cloudinary = cloudinaryLib.v2;
const cloudinaryStorageModule = require('multer-storage-cloudinary');
const CloudinaryStorage = cloudinaryStorageModule.CloudinaryStorage || cloudinaryStorageModule;

// Configure Cloudinary immediately at module load time
if (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true
    });
    console.log('✅ Cloudinary configured at module load');
}

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

const extractPublicId = (url) => {
    if (!url || !url.includes('cloudinary.com')) {
        return null;
    }
    
    try {
        // Example URL: https://res.cloudinary.com/cloud-name/image/upload/v1234567890/folder/filename.jpg
        const parts = url.split('/');
        const uploadIndex = parts.indexOf('upload');
        if (uploadIndex === -1) return null;

        let pathParts = parts.slice(uploadIndex + 1);
        const versionIndex = pathParts.findIndex(part => /^v\d+$/.test(part));
        if (versionIndex !== -1) {
            pathParts = pathParts.slice(versionIndex + 1);
        }

        const publicIdWithExt = pathParts.join('/');
        const extensionIndex = publicIdWithExt.lastIndexOf('.');

        return extensionIndex === -1
            ? publicIdWithExt
            : publicIdWithExt.substring(0, extensionIndex);
    } catch (error) {
        console.error('Error extracting public ID:', error);
        return null;
    }
};

const uploadBuffer = async (buffer, folder, options = {}) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: `sap-technologies/${folder}`,
                resource_type: 'auto',
                timeout: Number(process.env.CLOUDINARY_UPLOAD_TIMEOUT_MS) || 120000,
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

const getOptimizedUrl = (publicId, transformations = {}) => {
    return cloudinary.url(publicId, {
        secure: true,
        quality: 'auto:good',
        fetch_format: 'auto',
        ...transformations
    });
};


// Helper: Check if Cloudinary is configured
const isCloudinaryConfigured = () => {
    // Check environment variables
    const hasEnvVars = !!(
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
    );

    if (!hasEnvVars) {
        console.error('❌ Cloudinary environment variables are missing!');
        if (process.env.NODE_ENV === 'production') {
            console.error('⛔ Cloudinary is required in production. Server may not function correctly!');
        }
        console.warn('⚠️ Falling back to local storage');
        return false;
    }

    // Cloudinary is already configured at module load time above
    return true;
};

const getWatermarkUrl = () => {
    if (process.env.SAPTECH_WATERMARK_URL) {
        return process.env.SAPTECH_WATERMARK_URL;
    }

    const clientUrl = process.env.CLIENT_URL || '';
    if (clientUrl && !/localhost|127\.0\.0\.1/i.test(clientUrl)) {
        return `${clientUrl.replace(/\/$/, '')}/images/logo-watermark.png`;
    }

    const defaultLogoUrl = 'https://saptechug.com';
    return `${defaultLogoUrl}/images/logo-watermark.png`;
};

const imageTransformation = (width, height, crop = 'limit', options = {}) => {
    const baseTransformation = [{
        width,
        height,
        crop,
        quality: 'auto:good',
        fetch_format: 'auto'
    }];

    if (!options.watermark) {
        return baseTransformation;
    }

    return [
        ...baseTransformation,
        {
            overlay: { url: getWatermarkUrl() },
            width: Math.round(Math.max(58, Math.min(width * 0.11, 150))),
            opacity: 24,
            gravity: 'center'
        }
    ];
};

const cloudinaryStorageClient = cloudinaryLib;
const cloudinaryUploadTimeout = Number(process.env.CLOUDINARY_UPLOAD_TIMEOUT_MS) || 120000;

// Storage configs for different folders (used by multer)
const storageConfigs = {
    profilePics: isCloudinaryConfigured()
        ? new CloudinaryStorage({
            cloudinary: cloudinaryStorageClient,
            params: {
                folder: 'sap-technologies/profile-pics',
                resource_type: 'image',
                transformation: imageTransformation(400, 400),
                timeout: cloudinaryUploadTimeout,
            },
        })
        : null,
    services: isCloudinaryConfigured()
        ? new CloudinaryStorage({
            cloudinary: cloudinaryStorageClient,
            params: {
                folder: 'sap-technologies/services',
                resource_type: 'image',
                transformation: imageTransformation(800, 600, 'limit', { watermark: true }),
                timeout: cloudinaryUploadTimeout,
            },
        })
        : null,
    projects: isCloudinaryConfigured()
        ? new CloudinaryStorage({
            cloudinary: cloudinaryStorageClient,
            params: {
                folder: 'sap-technologies/projects',
                resource_type: 'image',
                transformation: imageTransformation(1200, 800, 'limit', { watermark: true }),
                timeout: cloudinaryUploadTimeout,
            },
        })
        : null,
    products: isCloudinaryConfigured()
        ? new CloudinaryStorage({
            cloudinary: cloudinaryStorageClient,
            params: {
                folder: 'sap-technologies/products',
                resource_type: 'image',
                transformation: imageTransformation(800, 800, 'limit', { watermark: true }),
                timeout: cloudinaryUploadTimeout,
            },
        })
        : null,
    signatures: isCloudinaryConfigured()
        ? new CloudinaryStorage({
            cloudinary: cloudinaryStorageClient,
            params: {
                folder: 'sap-technologies/signatures',
                resource_type: 'image',
                transformation: imageTransformation(600, 200),
                timeout: cloudinaryUploadTimeout,
            },
        })
        : null,
    partners: isCloudinaryConfigured()
        ? new CloudinaryStorage({
            cloudinary: cloudinaryStorageClient,
            params: {
                folder: 'sap-technologies/partners',
                resource_type: 'image',
                transformation: imageTransformation(600, 600),
                timeout: cloudinaryUploadTimeout,
            },
        })
        : null,
    awards: isCloudinaryConfigured()
        ? new CloudinaryStorage({
            cloudinary: cloudinaryStorageClient,
            params: {
                folder: 'sap-technologies/awards',
                resource_type: 'image',
                transformation: imageTransformation(800, 800, 'limit', { watermark: true }),
                timeout: cloudinaryUploadTimeout,
            },
        })
        : null,
    software: isCloudinaryConfigured()
        ? new CloudinaryStorage({
            cloudinary: cloudinaryStorageClient,
            params: {
                folder: 'sap-technologies/software',
                resource_type: 'image',
                transformation: imageTransformation(1200, 800, 'limit', { watermark: true }),
                timeout: cloudinaryUploadTimeout,
            },
        })
        : null,
    iot: isCloudinaryConfigured()
        ? new CloudinaryStorage({
            cloudinary: cloudinaryStorageClient,
            params: (req, file, cb) => {
                const isVideo = file.mimetype.startsWith('video/');
                let params;
                if (isVideo) {
                    params = {
                        folder: 'sap-technologies/iot',
                        resource_type: 'video',
                        eager: [{ quality: 'auto:good', fetch_format: 'mp4' }],
                        eager_async: true,
                        timeout: cloudinaryUploadTimeout
                    };
                } else {
                    params = {
                        folder: 'sap-technologies/iot',
                        resource_type: 'image',
                        transformation: imageTransformation(1920, 1080, 'limit', { watermark: true }),
                        timeout: cloudinaryUploadTimeout
                    };
                }

                cb(null, params);
            }
        })
        : null,
};

module.exports = {
    cloudinary,
    cloudinaryLib,
    isCloudinaryConfigured,
    storageConfigs,
    deleteFromCloudinary,
    extractPublicId,
    uploadBuffer,
    getOptimizedUrl
};
