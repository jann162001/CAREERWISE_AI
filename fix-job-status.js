// Fix Job Status Script
// Run with: node fix-job-status.js
// This will update all jobs to Active status

require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/authdb';

async function fixJobStatus() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('✅ Connected to MongoDB\n');
        
        const Job = require('./src/models/Job');
        
        // Check current status
        console.log('📊 Current Job Status:');
        console.log('='.repeat(50));
        
        const totalJobs = await Job.countDocuments({});
        const activeJobs = await Job.countDocuments({ status: 'Active' });
        const draftJobs = await Job.countDocuments({ status: 'Draft' });
        const closedJobs = await Job.countDocuments({ status: 'Closed' });
        const onHoldJobs = await Job.countDocuments({ status: 'On Hold' });
        const nullStatus = await Job.countDocuments({ status: null });
        
        console.log(`Total jobs: ${totalJobs}`);
        console.log(`Active: ${activeJobs}`);
        console.log(`Draft: ${draftJobs}`);
        console.log(`Closed: ${closedJobs}`);
        console.log(`On Hold: ${onHoldJobs}`);
        console.log(`Null/Undefined: ${nullStatus}`);
        
        // Show all jobs with their current status
        const allJobs = await Job.find({}).select('jobTitle company status');
        console.log('\n📋 All Jobs:');
        allJobs.forEach((job, index) => {
            console.log(`${index + 1}. ${job.jobTitle} at ${job.company} - Status: ${job.status || 'UNDEFINED'}`);
        });
        
        // Ask if user wants to fix
        console.log('\n\n🔧 FIXING JOB STATUSES...');
        console.log('='.repeat(50));
        
        // Update all non-Active jobs to Active
        const result = await Job.updateMany(
            { 
                $or: [
                    { status: { $ne: 'Active' } },
                    { status: null },
                    { status: { $exists: false } }
                ]
            },
            { $set: { status: 'Active' } }
        );
        
        console.log(`\n✅ Updated ${result.modifiedCount} jobs to Active status`);
        
        // Show new status
        const newActiveCount = await Job.countDocuments({ status: 'Active' });
        console.log(`✅ Total active jobs now: ${newActiveCount}`);
        
        // Show updated jobs
        const updatedJobs = await Job.find({ status: 'Active' }).select('jobTitle company status');
        console.log('\n📋 All Active Jobs:');
        updatedJobs.forEach((job, index) => {
            console.log(`${index + 1}. ${job.jobTitle} at ${job.company}`);
        });
        
        console.log('\n\n✅ Job status fix complete!');
        console.log('✅ All jobs are now Active and will show to users');
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error('\nFull error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

// Run the fix
fixJobStatus();
