/**
 * Migration Script: Update Award Categories with Professional Icon Names
 * 
 * This script maps emoji icons to professional SVG icon names for better
 * scalability, consistency, and professional appearance.
 * 
 * Usage: node src/utils/migrateAwardIcons.js
 */

const mongoose = require('mongoose');
const Award = require('../models/Award');
require('dotenv').config();

// Emoji to Icon Name Mapping
const ICON_MAPPING = {
  '🏆': 'trophy',      // Trophy - Excellence & Achievement
  '⭐': 'star',        // Star - Excellence & Recognition
  '🥇': 'medal',       // Medal - Awards & Honor
  '👑': 'crown',       // Crown - Leadership & Prestige
  '🚀': 'rocket',      // Rocket - Innovation & Growth
  '💡': 'lightbulb',   // Lightbulb - Innovation & Ideas
  '❤️': 'heart',       // Heart - Community & Social Impact
  '💙': 'heart',       // Heart alternative
  '🤝': 'users',       // Handshake -> Users - Community & People
  '👥': 'users',       // Users - Community & People
  '🌍': 'globe',       // Globe - Global Impact
  '🌎': 'globe',       // Globe alternative
  '🌏': 'globe',       // Globe alternative
  '🇺🇬': 'flag',       // Uganda Flag -> Flag - Regional/National
  '🏴': 'flag',        // Flag alternative
  '📊': 'chart',       // Chart - Data & Analytics
  '📈': 'chart',       // Chart alternative
  '🛡️': 'shield',      // Shield - Security & Trust
  '🎯': 'target',      // Target - Goals & Achievement
  '💼': 'briefcase',   // Briefcase - Business & Enterprise
  '✨': 'sparkles',    // Sparkles - Excellence & Quality
  '✅': 'check',       // Checkmark - Approval & Completion
  '✔️': 'check',       // Checkmark alternative
  '⏳': 'clock',       // Hourglass -> Clock - Pending/Time
  '⏰': 'clock',       // Clock alternative
  '🗳️': 'ballot',      // Ballot - Voting
  '📋': 'ballot',      // Clipboard -> Ballot alternative
};

// Intelligent Icon Suggestions Based on Category Names
const CATEGORY_NAME_MAPPING = {
  // Innovation & Technology
  'innovation': 'rocket',
  'tech': 'lightbulb',
  'startup': 'rocket',
  'digital': 'lightbulb',
  
  // Leadership & Excellence
  'leader': 'crown',
  'executive': 'crown',
  'excellence': 'star',
  'best': 'trophy',
  'outstanding': 'sparkles',
  
  // Community & Social
  'community': 'users',
  'social': 'heart',
  'impact': 'heart',
  'volunteer': 'users',
  
  // Business & Enterprise
  'business': 'briefcase',
  'entrepreneur': 'briefcase',
  'enterprise': 'briefcase',
  
  // Achievement & Recognition
  'achievement': 'medal',
  'award': 'trophy',
  'winner': 'trophy',
  'recognition': 'star',
  
  // Global & International
  'global': 'globe',
  'international': 'globe',
  'world': 'globe',
  
  // Regional & National
  'uganda': 'flag',
  'local': 'flag',
  'regional': 'flag',
  'national': 'flag',
  
  // Data & Analytics
  'data': 'chart',
  'analytics': 'chart',
  'metrics': 'chart',
  
  // Goals & Performance
  'performance': 'target',
  'goal': 'target',
  'objective': 'target',
};

/**
 * Suggest icon based on category name
 */
function suggestIconFromName(categoryName) {
  const lowerName = categoryName.toLowerCase();
  
  for (const [keyword, iconName] of Object.entries(CATEGORY_NAME_MAPPING)) {
    if (lowerName.includes(keyword)) {
      return iconName;
    }
  }
  
  return 'trophy'; // Default
}

/**
 * Migrate award categories to use iconName field
 */
async function migrateAwardIcons() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Get all categories
    const categories = await Award.AwardCategory.find({});
    console.log(`📊 Found ${categories.length} categories to migrate`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const category of categories) {
      let iconName = category.iconName;
      
      // If iconName already set and valid, skip
      if (iconName && iconName !== 'trophy') {
        console.log(`⏭️  Skipping "${category.name}" - already has iconName: ${iconName}`);
        skippedCount++;
        continue;
      }
      
      // Try to map from existing emoji icon
      if (category.icon && ICON_MAPPING[category.icon]) {
        iconName = ICON_MAPPING[category.icon];
        console.log(`🔄 Mapping "${category.name}": ${category.icon} → ${iconName}`);
      } 
      // Otherwise, suggest based on category name
      else {
        iconName = suggestIconFromName(category.name);
        console.log(`💡 Suggesting "${category.name}" → ${iconName} (based on name)`);
      }
      
      // Update category
      category.iconName = iconName;
      await category.save();
      updatedCount++;
    }
    
    console.log('\n✅ Migration completed successfully!');
    console.log(`📈 Updated: ${updatedCount} categories`);
    console.log(`⏭️  Skipped: ${skippedCount} categories`);
    
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
  migrateAwardIcons()
    .then(() => {
      console.log('🎉 All done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { migrateAwardIcons, ICON_MAPPING, CATEGORY_NAME_MAPPING };
