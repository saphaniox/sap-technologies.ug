const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

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

    try {
        // Configure cloudinary client
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
            secure: true
        });

        // Log configuration for debugging
        console.log('🔧 Cloudinary Configuration:');
        console.log('   Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
        console.log('   API Key:', process.env.CLOUDINARY_API_KEY?.substring(0, 6) + '...');
        
        // Return true - we'll handle connection errors at upload time
        return true;
    } catch (error) {
        console.error('❌ Error configuring Cloudinary:', error.message);
        return false;
    }
};

// Storage configs for different folders (used by multer)
const storageConfigs = {
    profilePics: isCloudinaryConfigured()
        ? new CloudinaryStorage({
            cloudinary,
            params: {
                folder: 'sap-technologies/profile-pics',
                resource_type: 'image',
                allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
                transformation: [{ width: 400, height: 400, crop: 'limit' }],
            },
        })
        : null,
    services: isCloudinaryConfigured()
        ? new CloudinaryStorage({
            cloudinary,
            params: {
                folder: 'sap-technologies/services',
                resource_type: 'image',
                allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
                transformation: [{ width: 800, height: 600, crop: 'limit' }],
            },
        })
        : null,
    projects: isCloudinaryConfigured()
        ? new CloudinaryStorage({
            cloudinary,
            params: {
                folder: 'sap-technologies/projects',
                resource_type: 'image',
                allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
                transformation: [{ width: 1200, height: 800, crop: 'limit' }],
            },
        })
        : null,
    products: isCloudinaryConfigured()
        ? new CloudinaryStorage({
            cloudinary,
            params: {
                folder: 'sap-technologies/products',
                resource_type: 'image',
                allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
                transformation: [{ width: 800, height: 800, crop: 'limit' }],
            },
        })
        : null,
    signatures: isCloudinaryConfigured()
        ? new CloudinaryStorage({
            cloudinary,
            params: {
                folder: 'sap-technologies/signatures',
                resource_type: 'image',
                allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
                transformation: [{ width: 600, height: 200, crop: 'limit' }],
            },
        })
        : null,
    partners: isCloudinaryConfigured()
        ? new CloudinaryStorage({
            cloudinary,
            params: {
                folder: 'sap-technologies/partners',
                resource_type: 'image',
                allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
                transformation: [{ width: 600, height: 600, crop: 'limit' }],
            },
        })
        : null,
    awards: isCloudinaryConfigured()
        ? new CloudinaryStorage({
            cloudinary,
            params: {
                folder: 'sap-technologies/awards',
                resource_type: 'image',
                allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
                transformation: [{ width: 800, height: 800, crop: 'limit' }],
            },
        })
        : null,
    software: isCloudinaryConfigured()
        ? new CloudinaryStorage({
            cloudinary,
            params: {
                folder: 'sap-technologies/software',
                resource_type: 'image',
                allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
                transformation: [{ width: 1200, height: 800, crop: 'limit' }],
            },
        })
        : null,
    iot: isCloudinaryConfigured()
        ? new CloudinaryStorage({
            cloudinary,
            params: {
                folder: 'sap-technologies/iot',
                resource_type: 'image',
                allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
                transformation: [{ width: 1920, height: 1080, crop: 'limit' }],
            },
        })
        : null,
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
