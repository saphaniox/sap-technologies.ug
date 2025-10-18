/**
 * Fix all certificate paths in database
 * This script removes full absolute paths and keeps only filenames
 */

require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');

// Import models
const { AwardCategory } = require('../models/Award');

async function fixCertificatePaths() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Find all nominations with certificates
        const awards = await AwardCategory.find({
            'nominations.certificateFile': { $exists: true, $ne: null }
        });

        console.log(`\n📊 Found ${awards.length} awards with nominations that have certificates`);

        let fixedCount = 0;
        let alreadyCorrectCount = 0;
        let totalNominations = 0;

        for (const award of awards) {
            let awardModified = false;

            for (const nomination of award.nominations) {
                if (nomination.certificateFile) {
                    totalNominations++;
                    const originalPath = nomination.certificateFile;

                    // Check if it's a full path (contains slashes or backslashes)
                    if (originalPath.includes('/') || originalPath.includes('\\')) {
                        // Extract just the filename
                        const filename = path.basename(originalPath);
                        
                        console.log(`\n🔧 Fixing path for nominee: ${nomination.nomineeName}`);
                        console.log(`   Old: ${originalPath}`);
                        console.log(`   New: ${filename}`);

                        nomination.certificateFile = filename;
                        awardModified = true;
                        fixedCount++;
                    } else {
                        console.log(`✅ Already correct: ${originalPath} (${nomination.nomineeName})`);
                        alreadyCorrectCount++;
                    }
                }
            }

            // Save if modified
            if (awardModified) {
                await award.save();
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('📊 MIGRATION SUMMARY');
        console.log('='.repeat(60));
        console.log(`Total nominations with certificates: ${totalNominations}`);
        console.log(`Fixed paths: ${fixedCount}`);
        console.log(`Already correct: ${alreadyCorrectCount}`);
        console.log('='.repeat(60));

        if (fixedCount > 0) {
            console.log('\n✅ Certificate paths have been fixed!');
            console.log('💡 All paths now use filenames only');
            console.log('📁 Files will be served from: /api/certificates/download/:filename');
        } else {
            console.log('\n✅ All certificate paths were already correct!');
        }

    } catch (error) {
        console.error('❌ Error fixing certificate paths:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n👋 Disconnected from MongoDB');
    }
}

// Run the migration
fixCertificatePaths();
