require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

async function testDatabase() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/authdb');
        console.log('✅ Connected to MongoDB successfully!');
        console.log('📊 Database:', mongoose.connection.name);
        console.log('🔗 Connection URI:', process.env.MONGODB_URI);
        console.log('');

        // Get all users
        const users = await User.find({}).select('-password');
        console.log(`📝 Total users in database: ${users.length}`);
        console.log('');

        if (users.length > 0) {
            console.log('👥 Users:');
            users.forEach((user, index) => {
                console.log(`\n${index + 1}. Username: ${user.username}`);
                console.log(`   Email: ${user.email}`);
                console.log(`   User ID: ${user._id}`);
                console.log(`   Created: ${user.createdAt}`);
            });
        } else {
            console.log('ℹ️  No users found in the database yet.');
            console.log('   Try signing up through the web interface!');
        }

        // Get collection stats
        console.log('\n📈 Collection Statistics:');
        const stats = await mongoose.connection.db.collection('users').stats();
        console.log(`   Documents: ${stats.count}`);
        console.log(`   Storage Size: ${(stats.size / 1024).toFixed(2)} KB`);
        console.log(`   Indexes: ${stats.nindexes}`);

    } catch (error) {
        console.error('❌ Error connecting to database:', error.message);
        if (error.message.includes('ECONNREFUSED')) {
            console.log('\n💡 Tip: Make sure MongoDB is running!');
            console.log('   Start MongoDB service or run: mongod');
        }
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

testDatabase();
