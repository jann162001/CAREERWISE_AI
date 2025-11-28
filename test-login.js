require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

async function testLogin() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/authdb');
        console.log('✅ Connected to MongoDB');

        // Find a user
        const user = await User.findOne({ username: 'Jann Adolf' });
        
        if (!user) {
            console.log('❌ User not found');
            process.exit(1);
        }

        console.log('✅ User found:', user.username);
        console.log('Email:', user.email);
        console.log('Has password:', !!user.password);
        console.log('Password hash length:', user.password ? user.password.length : 0);

        // Test password comparison
        const testPassword = 'test123'; // Replace with your actual password
        const isMatch = await user.comparePassword(testPassword);
        console.log(`\nPassword "${testPassword}" matches:`, isMatch);

        mongoose.connection.close();
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

testLogin();
