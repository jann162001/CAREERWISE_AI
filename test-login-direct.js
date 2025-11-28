require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

async function testDirectLogin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/authdb');
        console.log('✅ Connected to MongoDB\n');

        // Test login with username
        const username = 'Jann Adolf';
        const password = 'password123'; // UPDATE THIS WITH YOUR ACTUAL PASSWORD
        
        console.log('🔐 Testing login for:', username);
        console.log('Password:', '*'.repeat(password.length));
        console.log('\n' + '='.repeat(50));
        
        // Find user
        const user = await User.findOne({ 
            $or: [{ username: username }, { email: username }] 
        });

        if (!user) {
            console.log('❌ User not found');
            mongoose.connection.close();
            return;
        }

        console.log('✅ User found:', user.username);
        console.log('   Email:', user.email);
        console.log('   Has password:', !!user.password);
        
        // Test password
        try {
            const isMatch = await user.comparePassword(password);
            console.log('\n🔑 Password match:', isMatch);
            
            if (isMatch) {
                console.log('\n✅ LOGIN SUCCESSFUL!');
                console.log('   User ID:', user._id);
                console.log('   Username:', user.username);
                console.log('   Role:', user.role);
            } else {
                console.log('\n❌ PASSWORD INCORRECT');
                console.log('💡 Make sure you are using the correct password');
            }
        } catch (error) {
            console.error('\n❌ Error comparing password:', error.message);
            console.error('Full error:', error);
        }

        mongoose.connection.close();
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

testDirectLogin();
