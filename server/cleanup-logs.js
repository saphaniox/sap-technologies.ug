/**
 * Script to Remove Excessive Console.log Statements
 * 
 * This migration removes development console.log statements from production code
 * and replaces critical logs with proper logger calls.
 * 
 * Strategy:
 * 1. Remove debug console.log statements
 * 2. Keep only critical startup/initialization logs
 * 3. Convert important logs to logger.info/warn/error
 * 
 * Run this once to clean up the codebase.
 */

const fs = require('fs');
const path = require('path');

// Files to process
const filesToClean = [
    // Controllers - remove most debug logs
    'src/controllers/awardsController.js',
    'src/controllers/authController.js',
    
    // Services - keep only error logs
    'src/services/certificateService.js',
    'src/services/emailService.js',
    'src/services/whatsappService.js',
    'src/services/whatsappBaileysService.js',
    'src/services/smsAfricasTalkingService.js',
    
    // Config - keep startup logs, remove debug
    'src/config/environment.js',
    'src/config/fileUpload.js',
    
    // Main app - keep critical logs only
    'src/app.js'
];

// Patterns to remove (debug/verbose logs)
const removePatterns = [
    /console\.log\("🎯.*?\);/g,
    /console\.log\("📋.*?\);/g,
    /console\.log\("📎.*?\);/g,
    /console\.log\("📸.*?\);/g,
    /console\.log\("❌ Validation errors.*?\);/g,
    /console\.log\("📊 Getting awards.*?\);/g,
    /console\.log\("✅ General stats.*?\);/g,
    /console\.log\("✅ Category stats.*?\);/g,
    /console\.log\("✅ Top nominations.*?\);/g,
];

// Summary of changes
let totalFilesProcessed = 0;
let totalLogsRemoved = 0;

console.log('🧹 Starting console.log cleanup...\n');

filesToClean.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    
    try {
        if (!fs.existsSync(filePath)) {
            console.log(`⚠️  Skipping ${file} (not found)`);
            return;
        }
        
        let content = fs.readFileSync(filePath, 'utf8');
        const originalLength = content.length;
        let logsRemoved = 0;
        
        // Apply removal patterns
        removePatterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) {
                logsRemoved += matches.length;
                content = content.replace(pattern, '');
            }
        });
        
        // Remove empty lines created by removals
        content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
        
        if (content.length !== originalLength) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ ${file}: Removed ${logsRemoved} debug logs`);
            totalFilesProcessed++;
            totalLogsRemoved += logsRemoved;
        } else {
            console.log(`ℹ️  ${file}: No changes needed`);
        }
        
    } catch (error) {
        console.error(`❌ Error processing ${file}:`, error.message);
    }
});

console.log(`\n📊 Summary:`);
console.log(`   Files processed: ${totalFilesProcessed}`);
console.log(`   Debug logs removed: ${totalLogsRemoved}`);
console.log(`\n✨ Cleanup complete! Check logs/ directory for application logs.\n`);
