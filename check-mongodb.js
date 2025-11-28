// MongoDB Diagnostic Script
// Run with: node check-mongodb.js

require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/authdb';

async function checkDatabase() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        console.log('URI:', MONGODB_URI);
        
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('✅ Connected to MongoDB\n');
        
        // Get database name
        const dbName = mongoose.connection.db.databaseName;
        console.log('📊 Database:', dbName);
        
        // List all collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('\n📁 Collections in database:', collections.length);
        collections.forEach(col => {
            console.log('  -', col.name);
        });
        
        // Check Jobs collection
        console.log('\n\n🔍 JOBS COLLECTION:');
        console.log('='.repeat(50));
        
        const Job = require('./src/models/Job');
        
        const totalJobs = await Job.countDocuments({});
        console.log('Total jobs:', totalJobs);
        
        const activeJobs = await Job.countDocuments({ status: 'Active' });
        console.log('Active jobs:', activeJobs);
        
        const draftJobs = await Job.countDocuments({ status: 'Draft' });
        console.log('Draft jobs:', draftJobs);
        
        const closedJobs = await Job.countDocuments({ status: 'Closed' });
        console.log('Closed jobs:', closedJobs);
        
        // Get all jobs
        if (totalJobs > 0) {
            console.log('\n📋 All Jobs in Database:');
            const allJobs = await Job.find({}).select('jobTitle company status createdAt').sort({ createdAt: -1 });
            
            allJobs.forEach((job, index) => {
                console.log(`\n${index + 1}. ${job.jobTitle} at ${job.company}`);
                console.log(`   Status: ${job.status}`);
                console.log(`   Created: ${job.createdAt}`);
                console.log(`   ID: ${job._id}`);
            });
        } else {
            console.log('\n⚠️  No jobs found in database!');
            console.log('   This means either:');
            console.log('   1. No jobs have been created yet');
            console.log('   2. Jobs are in a different database');
            console.log('   3. Collection name is different');
        }
        
        // Check Users
        console.log('\n\n🔍 USERS COLLECTION:');
        console.log('='.repeat(50));
        
        const User = require('./src/models/User');
        const totalUsers = await User.countDocuments({});
        console.log('Total users:', totalUsers);
        
        if (totalUsers > 0) {
            const users = await User.find({}).select('fullName username email role');
            users.forEach((user, index) => {
                console.log(`${index + 1}. ${user.fullName} (${user.username}) - ${user.role}`);
            });
        }
        
        // Check Profiles
        console.log('\n\n🔍 PROFILES COLLECTION:');
        console.log('='.repeat(50));
        
        const Profile = require('./src/models/Profile');
        const totalProfiles = await Profile.countDocuments({});
        console.log('Total profiles:', totalProfiles);
        
        if (totalProfiles > 0) {
            const profiles = await Profile.find({}).select('fullName userId skills education');
            profiles.forEach((profile, index) => {
                console.log(`${index + 1}. ${profile.fullName}`);
                console.log(`   Skills: ${profile.skills?.length || 0}`);
                console.log(`   Education: ${profile.education?.length || 0}`);
            });
        }
        
        // Check Admins
        console.log('\n\n🔍 ADMINS COLLECTION:');
        console.log('='.repeat(50));
        
        const Admin = require('./src/models/Admin');
        const totalAdmins = await Admin.countDocuments({});
        console.log('Total admins:', totalAdmins);
        
        if (totalAdmins > 0) {
            const admins = await Admin.find({}).select('fullName username email');
            admins.forEach((admin, index) => {
                console.log(`${index + 1}. ${admin.fullName} (${admin.username})`);
            });
        }
        
        console.log('\n\n✅ Database check complete!');
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error('\nFull error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

// Run the check
checkDatabase();
