require('dotenv').config();
const { isCloudinaryConfigured } = require('./src/config/cloudinary');

/**
 * Verify Cloudinary Integration Script
 * 
 * This script checks all upload configurations to ensure they're properly
 * set up to use Cloudinary when configured.
 */

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║     Cloudinary Integration Verification                   ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

// Check if Cloudinary is configured
const cloudinaryConfigured = isCloudinaryConfigured();

console.log('📊 Configuration Status:\n');
console.log(`   CLOUDINARY_CLOUD_NAME: ${process.env.CLOUDINARY_CLOUD_NAME || '❌ NOT SET'}`);
console.log(`   CLOUDINARY_API_KEY: ${process.env.CLOUDINARY_API_KEY ? '✅ SET' : '❌ NOT SET'}`);
console.log(`   CLOUDINARY_API_SECRET: ${process.env.CLOUDINARY_API_SECRET ? '✅ SET' : '❌ NOT SET'}`);
console.log(`\n   Cloudinary Status: ${cloudinaryConfigured ? '✅ CONFIGURED' : '❌ NOT CONFIGURED'}\n`);

if (!cloudinaryConfigured) {
  console.log('⚠️  WARNING: Cloudinary is NOT configured!');
  console.log('   All uploads will use LOCAL STORAGE (not recommended for production)\n');
  console.log('📝 To fix this, add these environment variables:');
  console.log('   CLOUDINARY_CLOUD_NAME=dctjrjh4h');
  console.log('   CLOUDINARY_API_KEY=549869326956641');
  console.log('   CLOUDINARY_API_SECRET=phBVcCAykqTNVSILmALIyVokdbI\n');
  process.exit(1);
}

console.log('✅ Cloudinary is configured!\n');

// Check all upload configurations
console.log('📦 Checking Upload Configurations:\n');

const uploadConfigs = [
  { name: 'Profile Pictures', file: './src/config/multer.js', export: 'default' },
  { name: 'Products', file: './src/config/fileUpload.js', export: 'productUpload' },
  { name: 'Services', file: './src/config/fileUpload.js', export: 'serviceUpload' },
  { name: 'Projects', file: './src/config/fileUpload.js', export: 'projectUpload' },
  { name: 'Partners', file: './src/config/fileUpload.js', export: 'partnerUpload' },
  { name: 'Awards/Nominees', file: './src/config/awardsUpload.js', export: 'default' },
  { name: 'Signatures', file: './src/config/fileUpload.js', export: 'signatureUpload' }
];

let allPassed = true;

for (const config of uploadConfigs) {
  try {
    const module = require(config.file);
    const uploader = config.export === 'default' ? module : module[config.export];
    
    if (uploader) {
      // Check if it's using Cloudinary by examining the storage
      const usingCloudinary = uploader.storage && uploader.storage.constructor.name !== 'DiskStorage';
      
      if (usingCloudinary) {
        console.log(`   ✅ ${config.name.padEnd(25)} → Cloudinary`);
      } else {
        console.log(`   ❌ ${config.name.padEnd(25)} → Local Storage`);
        allPassed = false;
      }
    } else {
      console.log(`   ⚠️  ${config.name.padEnd(25)} → Export not found`);
      allPassed = false;
    }
  } catch (error) {
    console.log(`   ❌ ${config.name.padEnd(25)} → Error: ${error.message}`);
    allPassed = false;
  }
}

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║                    Verification Result                    ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

if (allPassed) {
  console.log('🎉 SUCCESS! All uploads are configured to use Cloudinary!\n');
  console.log('📝 Next Steps:');
  console.log('   1. Add these same Cloudinary credentials to Render:');
  console.log('      CLOUDINARY_CLOUD_NAME=dctjrjh4h');
  console.log('      CLOUDINARY_API_KEY=549869326956641');
  console.log('      CLOUDINARY_API_SECRET=phBVcCAykqTNVSILmALIyVokdbI');
  console.log('   2. Deploy your code to Render');
  console.log('   3. Upload images via admin panel');
  console.log('   4. Images will automatically go to Cloudinary CDN!\n');
  process.exit(0);
} else {
  console.log('❌ FAILED! Some uploads are still using local storage.\n');
  console.log('Please check the configurations above and ensure all upload');
  console.log('middlewares are using the Cloudinary storage configs.\n');
  process.exit(1);
}
