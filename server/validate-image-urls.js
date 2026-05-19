#!/usr/bin/env node

/**
 * URL Validation Helper
 * Run this to validate all image URLs in the database
 */

require('dotenv').config();
const mongoose = require('mongoose');

const validateUrls = async () => {
    try {
        console.log('🔍 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected');

        // Check software
        const Software = mongoose.model('Software', new mongoose.Schema({}), 'softwares');
        const softwareCount = await Software.countDocuments({});
        console.log(`\n📦 Software collection: ${softwareCount} documents`);

        if (softwareCount > 0) {
            const softwareWithImages = await Software.find({
                images: { $exists: true, $ne: [] }
            }).limit(3);

            console.log(`Found ${softwareWithImages.length} software with images:`);
            softwareWithImages.forEach(sw => {
                console.log(`\n  📝 ${sw.name}`);
                sw.images?.forEach((img, idx) => {
                    const isValid = img?.url && img.url.startsWith('http');
                    const status = isValid ? '✅' : '❌';
                    console.log(`    ${status} Image ${idx + 1}: ${img?.url?.substring(0, 60)}...`);
                });
            });
        }

        // Check products
        const Product = mongoose.model('Product', new mongoose.Schema({}), 'products');
        const productCount = await Product.countDocuments({});
        console.log(`\n📦 Product collection: ${productCount} documents`);

        if (productCount > 0) {
            const productsWithImages = await Product.find({
                images: { $exists: true, $ne: [] }
            }).limit(3);

            console.log(`Found ${productsWithImages.length} products with images:`);
            productsWithImages.forEach(prod => {
                console.log(`\n  📝 ${prod.name}`);
                prod.images?.forEach((img, idx) => {
                    const isValid = img?.url && img.url.startsWith('http');
                    const status = isValid ? '✅' : '❌';
                    console.log(`    ${status} Image ${idx + 1}: ${img?.url?.substring(0, 60)}...`);
                });
            });
        }

        // Check IoT
        const IoT = mongoose.model('IoT', new mongoose.Schema({}), 'iots');
        const iotCount = await IoT.countDocuments({});
        console.log(`\n📦 IoT collection: ${iotCount} documents`);

        if (iotCount > 0) {
            const iotWithMedia = await IoT.find({
                images: { $exists: true, $ne: [] }
            }).limit(3);

            console.log(`Found ${iotWithMedia.length} IoT projects with images:`);
            iotWithMedia.forEach(iot => {
                console.log(`\n  📝 ${iot.title}`);
                iot.images?.forEach((img, idx) => {
                    const isValid = img?.url && img.url.startsWith('http');
                    const status = isValid ? '✅' : '❌';
                    console.log(`    ${status} Image ${idx + 1}: ${img?.url?.substring(0, 60)}...`);
                });
            });
        }

        await mongoose.disconnect();
        console.log('\n✅ Validation complete');
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

validateUrls();
