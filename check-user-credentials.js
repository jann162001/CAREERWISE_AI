require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

async function checkUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/authdb');
        console.log('✅ Connected to MongoDB\n');

        const users = await User.find({});
        
        console.log('📋 All Users in Database:\n');
        console.log('='.repeat(50));
        
        for (const user of users) {
            console.log(`\n👤 Username: ${user.username}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Full Name: ${user.fullName}`);
            console.log(`   Role: ${user.role}`);
            console.log(`   Has Password: ${!!user.password}`);
            console.log(`   Password Hash: ${user.password ? user.password.substring(0, 20) + '...' : 'NONE'}`);
            console.log(`   Google ID: ${user.googleId || 'None'}`);
            console.log(`   Created: ${user.createdAt}`);
        }
        
        console.log('\n' + '='.repeat(50));
        console.log('\n💡 Try logging in with:');
        console.log('   Username: "Jann Adolf" or "Jann"');
        console.log('   Email: Check the email shown above');
        console.log('   Password: Use the password you set during signup');
        
        mongoose.connection.close();
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkUsers();
