/**
 * Migration Script: Fix Certificate File Paths
 * 
 * This script fixes nomination records where certificateFile contains
 * full absolute paths instead of just the filename.
 * 
 * Example:
 * Before: /opt/render/project/src/server/uploads/certificates/certificate_SAPH-25-PAR-MGPO6757.pdf
 * After: certificate_SAPH-25-PAR-MGPO6757.pdf
 * 
 * Usage: node src/utils/fixCertificatePaths.js
 */

const mongoose = require('mongoose');
const path = require('path');
const Award = require('../models/Award');
require('dotenv').config();

/**
 * Fix certificate file paths in all nominations
 */
async function fixCertificatePaths() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Find all nominations with certificateFile
    const nominations = await Award.Nomination.find({ 
      certificateFile: { $exists: true, $ne: null, $ne: '' } 
    });
    
    console.log(`📊 Found ${nominations.length} nominations with certificates`);
    
    let fixedCount = 0;
    let alreadyCorrectCount = 0;
    
    for (const nomination of nominations) {
      const originalPath = nomination.certificateFile;
      const filename = path.basename(originalPath);
      
      // Check if it's already just a filename (no path separators)
      if (originalPath === filename) {
        console.log(`✅ Already correct: ${nomination.nomineeName} - ${filename}`);
        alreadyCorrectCount++;
        continue;
      }
      
      // Update to just the filename
      nomination.certificateFile = filename;
      await nomination.save();
      
      console.log(`🔧 Fixed: ${nomination.nomineeName}`);
      console.log(`   Before: ${originalPath}`);
      console.log(`   After:  ${filename}`);
      fixedCount++;
    }
    
    console.log('\n✅ Migration completed successfully!');
    console.log(`📈 Fixed: ${fixedCount} nominations`);
    console.log(`✅ Already correct: ${alreadyCorrectCount} nominations`);
    console.log(`📊 Total: ${nominations.length} nominations`);
    
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
  fixCertificatePaths()
    .then(() => {
      console.log('🎉 All done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { fixCertificatePaths };
