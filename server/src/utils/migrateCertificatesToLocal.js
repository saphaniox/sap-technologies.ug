/**
 * Migration Script: Switch Certificates from Cloudinary to Local Storage
 * 
 * This script updates all nominations with Cloudinary certificate URLs
 * to use local API download URLs instead.
 * 
 * Reason: Cloudinary's raw/PDF files require authentication even with
 * access_mode: 'public', causing HTTP 401 errors for public access.
 * 
 * Solution: Use local API endpoint /api/certificates/download/:filename
 * which serves PDFs publicly without authentication.
 * 
 * Usage: node src/utils/migrateCertificatesToLocal.js
 */

const mongoose = require('mongoose');
const path = require('path');
const Award = require('../models/Award');
require('dotenv').config();

/**
 * Switch certificates from Cloudinary to local storage URLs
 */
async function migrateCertificatesToLocal() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Find all nominations with certificateUrl containing cloudinary
    const nominations = await Award.Nomination.find({ 
      certificateUrl: { $regex: 'cloudinary', $options: 'i' }
    });
    
    console.log(`📊 Found ${nominations.length} nominations with Cloudinary certificates`);
    
    if (nominations.length === 0) {
      console.log('✅ No migrations needed!');
      return;
    }
    
    let updatedCount = 0;
    
    for (const nomination of nominations) {
      const originalUrl = nomination.certificateUrl;
      const filename = path.basename(nomination.certificateFile);
      
      // Update to local API URL
      nomination.certificateUrl = `/api/certificates/download/${filename}`;
      nomination.certificateCloudinaryId = null; // Clear Cloudinary ID
      
      await nomination.save();
      
      console.log(`🔄 Updated: ${nomination.nomineeName}`);
      console.log(`   Before: ${originalUrl}`);
      console.log(`   After:  ${nomination.certificateUrl}`);
      updatedCount++;
    }
    
    console.log('\n✅ Migration completed successfully!');
    console.log(`📈 Updated: ${updatedCount} certificates`);
    console.log('🎯 All certificates now use local API URLs for public access');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run migration
if (require.main === module) {
  migrateCertificatesToLocal()
    .then(() => {
      console.log('🎉 All done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { migrateCertificatesToLocal };
