/**
 * Migrate Local Images to Cloudinary
 * 
 * This script:
 * 1. Finds all local images in uploads/ folders
 * 2. Uploads them to Cloudinary
 * 3. Updates database records with new Cloudinary URLs
 * 4. Preserves original filenames for tracking
 * 
 * Run this once to migrate all existing images to cloud storage
 */

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
const { uploadBuffer, cloudinary } = require('./src/config/cloudinary');

// Import models
const Product = require('./src/models/Product');
const Partner = require('./src/models/Partner');
const Service = require('./src/models/Service');
const Project = require('./src/models/Project');

// ANSI colors
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    blue: '\x1b[34m'
};

// Statistics
const stats = {
    products: { total: 0, migrated: 0, failed: 0, skipped: 0 },
    partners: { total: 0, migrated: 0, failed: 0, skipped: 0 },
    services: { total: 0, migrated: 0, failed: 0, skipped: 0 },
    projects: { total: 0, migrated: 0, failed: 0, skipped: 0 }
};

/**
 * Upload local image to Cloudinary
 */
async function uploadToCloudinary(localPath, folder, fileName) {
    try {
        // Read file
        const fileBuffer = await fs.readFile(localPath);
        
        // Upload to Cloudinary
        const result = await uploadBuffer(fileBuffer, folder, {
            public_id: fileName.replace(/\.[^/.]+$/, ""), // Remove extension
            overwrite: false
        });
        
        return result.secure_url;
    } catch (error) {
        console.error(colors.red + `  ❌ Upload failed: ${error.message}` + colors.reset);
        throw error;
    }
}

/**
 * Check if URL is already Cloudinary URL
 */
function isCloudinaryUrl(url) {
    return url && typeof url === 'string' && url.includes('cloudinary.com');
}

/**
 * Extract filename from local path
 */
function extractFilename(imagePath) {
    if (!imagePath) return null;
    const parts = imagePath.split('/');
    return parts[parts.length - 1];
}

/**
 * Migrate Products
 */
async function migrateProducts() {
    console.log(colors.bright + colors.blue + '\n📦 Migrating Products...' + colors.reset);
    
    const products = await Product.find({});
    stats.products.total = products.length;
    
    for (const product of products) {
        if (!product.image) {
            stats.products.skipped++;
            continue;
        }
        
        // Skip if already Cloudinary URL
        if (isCloudinaryUrl(product.image)) {
            console.log(colors.yellow + `  ⏭️  Skipped (already on Cloudinary): ${product.name}` + colors.reset);
            stats.products.skipped++;
            continue;
        }
        
        try {
            const filename = extractFilename(product.image);
            if (!filename) {
                stats.products.skipped++;
                continue;
            }
            
            const localPath = path.join(__dirname, 'uploads', 'products', filename);
            
            // Check if file exists
            try {
                await fs.access(localPath);
            } catch {
                console.log(colors.yellow + `  ⚠️  File not found: ${filename}` + colors.reset);
                stats.products.failed++;
                continue;
            }
            
            console.log(colors.cyan + `  📤 Uploading: ${product.name} (${filename})` + colors.reset);
            
            // Upload to Cloudinary
            const cloudinaryUrl = await uploadToCloudinary(localPath, 'products', filename);
            
            // Update database
            product.image = cloudinaryUrl;
            await product.save();
            
            console.log(colors.green + `  ✅ Migrated: ${product.name}` + colors.reset);
            stats.products.migrated++;
            
        } catch (error) {
            console.error(colors.red + `  ❌ Failed to migrate ${product.name}: ${error.message}` + colors.reset);
            stats.products.failed++;
        }
    }
}

/**
 * Migrate Partners
 */
async function migratePartners() {
    console.log(colors.bright + colors.blue + '\n🤝 Migrating Partners...' + colors.reset);
    
    const partners = await Partner.find({});
    stats.partners.total = partners.length;
    
    for (const partner of partners) {
        if (!partner.logo) {
            stats.partners.skipped++;
            continue;
        }
        
        // Skip if already Cloudinary URL
        if (isCloudinaryUrl(partner.logo)) {
            console.log(colors.yellow + `  ⏭️  Skipped (already on Cloudinary): ${partner.name}` + colors.reset);
            stats.partners.skipped++;
            continue;
        }
        
        try {
            const filename = extractFilename(partner.logo);
            if (!filename) {
                stats.partners.skipped++;
                continue;
            }
            
            const localPath = path.join(__dirname, 'uploads', 'partners', filename);
            
            // Check if file exists
            try {
                await fs.access(localPath);
            } catch {
                console.log(colors.yellow + `  ⚠️  File not found: ${filename}` + colors.reset);
                stats.partners.failed++;
                continue;
            }
            
            console.log(colors.cyan + `  📤 Uploading: ${partner.name} (${filename})` + colors.reset);
            
            // Upload to Cloudinary
            const cloudinaryUrl = await uploadToCloudinary(localPath, 'partners', filename);
            
            // Update database
            partner.logo = cloudinaryUrl;
            await partner.save();
            
            console.log(colors.green + `  ✅ Migrated: ${partner.name}` + colors.reset);
            stats.partners.migrated++;
            
        } catch (error) {
            console.error(colors.red + `  ❌ Failed to migrate ${partner.name}: ${error.message}` + colors.reset);
            stats.partners.failed++;
        }
    }
}

/**
 * Migrate Services
 */
async function migrateServices() {
    console.log(colors.bright + colors.blue + '\n🛠️  Migrating Services...' + colors.reset);
    
    const services = await Service.find({});
    stats.services.total = services.length;
    
    for (const service of services) {
        if (!service.image) {
            stats.services.skipped++;
            continue;
        }
        
        // Skip if already Cloudinary URL
        if (isCloudinaryUrl(service.image)) {
            console.log(colors.yellow + `  ⏭️  Skipped (already on Cloudinary): ${service.title}` + colors.reset);
            stats.services.skipped++;
            continue;
        }
        
        try {
            const filename = extractFilename(service.image);
            if (!filename) {
                stats.services.skipped++;
                continue;
            }
            
            const localPath = path.join(__dirname, 'uploads', 'services', filename);
            
            // Check if file exists
            try {
                await fs.access(localPath);
            } catch {
                console.log(colors.yellow + `  ⚠️  File not found: ${filename}` + colors.reset);
                stats.services.failed++;
                continue;
            }
            
            console.log(colors.cyan + `  📤 Uploading: ${service.title} (${filename})` + colors.reset);
            
            // Upload to Cloudinary
            const cloudinaryUrl = await uploadToCloudinary(localPath, 'services', filename);
            
            // Update database
            service.image = cloudinaryUrl;
            await service.save();
            
            console.log(colors.green + `  ✅ Migrated: ${service.title}` + colors.reset);
            stats.services.migrated++;
            
        } catch (error) {
            console.error(colors.red + `  ❌ Failed to migrate ${service.title}: ${error.message}` + colors.reset);
            stats.services.failed++;
        }
    }
}

/**
 * Migrate Projects (if they have images)
 */
async function migrateProjects() {
    console.log(colors.bright + colors.blue + '\n🚀 Migrating Projects...' + colors.reset);
    
    const projects = await Project.find({});
    stats.projects.total = projects.length;
    
    for (const project of projects) {
        // Projects might have multiple images or different structure
        // Skip if no images field or already migrated
        if (!project.images || project.images.length === 0) {
            stats.projects.skipped++;
            continue;
        }
        
        // Check if all images are already Cloudinary URLs
        const allCloudinary = project.images.every(img => isCloudinaryUrl(img));
        if (allCloudinary) {
            console.log(colors.yellow + `  ⏭️  Skipped (already on Cloudinary): ${project.title}` + colors.reset);
            stats.projects.skipped++;
            continue;
        }
        
        console.log(colors.yellow + `  ℹ️  Projects migration not yet implemented` + colors.reset);
        stats.projects.skipped++;
    }
}

/**
 * Print summary statistics
 */
function printSummary() {
    console.log(colors.bright + colors.cyan + '\n╔════════════════════════════════════════════════════════════╗' + colors.reset);
    console.log(colors.bright + colors.cyan + '║                  Migration Summary                         ║' + colors.reset);
    console.log(colors.bright + colors.cyan + '╚════════════════════════════════════════════════════════════╝\n' + colors.reset);
    
    const categories = ['products', 'partners', 'services', 'projects'];
    
    categories.forEach(category => {
        const stat = stats[category];
        console.log(colors.bright + `📊 ${category.toUpperCase()}:` + colors.reset);
        console.log(colors.cyan + `   Total: ${stat.total}` + colors.reset);
        console.log(colors.green + `   ✅ Migrated: ${stat.migrated}` + colors.reset);
        console.log(colors.yellow + `   ⏭️  Skipped: ${stat.skipped}` + colors.reset);
        console.log(colors.red + `   ❌ Failed: ${stat.failed}` + colors.reset);
        console.log('');
    });
    
    const totalMigrated = Object.values(stats).reduce((sum, s) => sum + s.migrated, 0);
    const totalFailed = Object.values(stats).reduce((sum, s) => sum + s.failed, 0);
    
    console.log(colors.bright + colors.green + `🎉 Successfully migrated ${totalMigrated} images to Cloudinary!` + colors.reset);
    if (totalFailed > 0) {
        console.log(colors.red + `⚠️  ${totalFailed} images failed to migrate` + colors.reset);
    }
    console.log('');
}

/**
 * Main migration function
 */
async function migrateImagesToCloudinary() {
    console.log(colors.bright + colors.blue + '╔════════════════════════════════════════════════════════════╗' + colors.reset);
    console.log(colors.bright + colors.blue + '║        SAP Technologies - Cloudinary Migration             ║' + colors.reset);
    console.log(colors.bright + colors.blue + '╚════════════════════════════════════════════════════════════╝\n' + colors.reset);
    
    try {
        // Connect to database
        console.log(colors.yellow + '📡 Connecting to database...' + colors.reset);
        await mongoose.connect(process.env.MONGODB_URI);
        console.log(colors.green + '✅ Connected to MongoDB\n' + colors.reset);
        
        // Run migrations
        await migrateProducts();
        await migratePartners();
        await migrateServices();
        await migrateProjects();
        
        // Print summary
        printSummary();
        
        console.log(colors.cyan + '💡 Next steps:' + colors.reset);
        console.log('  1. Add Cloudinary credentials to Render environment variables');
        console.log('  2. Deploy the updated code to Render');
        console.log('  3. Your images will now load from Cloudinary CDN!\n');
        
    } catch (error) {
        console.error(colors.red + '\n❌ Migration failed:', error.message + colors.reset);
        console.error(error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log(colors.yellow + '📡 Database connection closed' + colors.reset);
    }
}

// Run migration
migrateImagesToCloudinary()
    .then(() => {
        console.log(colors.green + '\n✅ Migration completed successfully!' + colors.reset);
        process.exit(0);
    })
    .catch(error => {
        console.error(colors.red + '\n❌ Migration error:', error.message + colors.reset);
        process.exit(1);
    });
