/**
 * Check Certificate model for path issues
 */

require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');

// Import Certificate model
const Certificate = require('../models/Certificate');

async function checkCertificates() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Find all certificates
        const certificates = await Certificate.find({});
        console.log(`\n📊 Found ${certificates.length} certificates in database`);

        if (certificates.length === 0) {
            console.log('\n⚠️  No certificates found in database');
            return;
        }

        let needsFix = 0;
        let alreadyCorrect = 0;

        certificates.forEach((cert, index) => {
            console.log(`\n--- Certificate ${index + 1} ---`);
            console.log(`Certificate ID: ${cert.certificateId}`);
            console.log(`Type: ${cert.type}`);
            console.log(`Nominee: ${cert.recipientName}`);
            console.log(`Filename: ${cert.filename || 'NOT SET'}`);
            console.log(`Verification URL: ${cert.verificationUrl || 'NOT SET'}`);

            if (cert.filename) {
                if (cert.filename.includes('/') || cert.filename.includes('\\')) {
                    console.log(`❌ Needs fix: Full path detected`);
                    needsFix++;
                } else {
                    console.log(`✅ OK: Filename only`);
                    alreadyCorrect++;
                }
            }
        });

        console.log('\n' + '='.repeat(60));
        console.log('📊 SUMMARY');
        console.log('='.repeat(60));
        console.log(`Total certificates: ${certificates.length}`);
        console.log(`Needs fixing: ${needsFix}`);
        console.log(`Already correct: ${alreadyCorrect}`);
        console.log('='.repeat(60));

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n👋 Disconnected from MongoDB');
    }
}

checkCertificates();
