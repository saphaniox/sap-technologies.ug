// Script to promote test user to admin
const mongoose = require('mongoose');
require('dotenv').config();

const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', userSchema, 'users');

async function promoteToAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');
        
        const result = await User.updateOne(
            { email: 'testadmin@test.com' },
            { $set: { role: 'admin' } }
        );
        
        if (result.matchedCount === 0) {
            console.log('❌ User not found');
        } else {
            console.log('✅ User promoted to admin successfully!');
        }
        
        await mongoose.disconnect();
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

promoteToAdmin();
