const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const Application = require('../models/Application');
const User = require('../models/User');

// Job Performance Report
router.get('/job-performance', async (req, res) => {
    try {
        console.log('📊 Generating Job Performance Report');
        
        const totalJobs = await Job.countDocuments();
        const activeJobs = await Job.countDocuments({ status: 'Active' });
        
        // Get all jobs with application counts
        const jobs = await Job.find();
        let totalViews = 0;
        let totalApplications = 0;
        
        const jobsWithStats = await Promise.all(jobs.map(async (job) => {
            const applicationCount = await Application.countDocuments({ job: job._id });
            totalViews += job.views || 0;
            totalApplications += applicationCount;
            
            return {
                jobTitle: job.jobTitle,
                company: job.company,
                views: job.views || 0,
                applications: applicationCount
            };
        }));
        
        // Sort by applications + views and get top 10
        const topPerformingJobs = jobsWithStats
            .sort((a, b) => (b.applications + b.views) - (a.applications + a.views))
            .slice(0, 10);
        
        res.json({
            totalJobs,
            activeJobs,
            totalViews,
            totalApplications,
            topPerformingJobs
        });
    } catch (error) {
        console.error('Error generating job performance report:', error);
        res.status(500).json({ message: 'Error generating report', error: error.message });
    }
});

// User Activity Report
router.get('/user-activity', async (req, res) => {
    try {
        console.log('👥 Generating User Activity Report');
        
        const totalUsers = await User.countDocuments();
        const totalApplications = await Application.countDocuments();
        
        // Get users with their application counts
        const applications = await Application.find()
            .populate('user', 'fullName email username createdAt');
        
        const userMap = new Map();
        applications.forEach(app => {
            if (app.user) {
                const userId = app.user._id.toString();
                if (!userMap.has(userId)) {
                    userMap.set(userId, {
                        fullName: app.user.fullName || app.user.username,
                        email: app.user.email,
                        applicationCount: 0,
                        lastActive: app.appliedDate
                    });
                }
                const userData = userMap.get(userId);
                userData.applicationCount++;
                if (new Date(app.appliedDate) > new Date(userData.lastActive)) {
                    userData.lastActive = app.appliedDate;
                }
            }
        });
        
        const activeApplicants = userMap.size;
        const avgApplicationsPerUser = activeApplicants > 0 ? totalApplications / activeApplicants : 0;
        
        // Get recent activity (top 10 most active users)
        const recentActivity = Array.from(userMap.values())
            .sort((a, b) => new Date(b.lastActive) - new Date(a.lastActive))
            .slice(0, 10);
        
        res.json({
            totalUsers,
            activeApplicants,
            totalApplications,
            avgApplicationsPerUser,
            recentActivity
        });
    } catch (error) {
        console.error('Error generating user activity report:', error);
        res.status(500).json({ message: 'Error generating report', error: error.message });
    }
});

// Monthly Summary Report
router.get('/monthly-summary', async (req, res) => {
    try {
        console.log('📅 Generating Monthly Summary Report');
        
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        
        const monthlyJobs = await Job.countDocuments({
            createdAt: { $gte: startOfMonth, $lte: endOfMonth }
        });
        
        const monthlyApplications = await Application.countDocuments({
            appliedDate: { $gte: startOfMonth, $lte: endOfMonth }
        });
        
        const newUsers = await User.countDocuments({
            createdAt: { $gte: startOfMonth, $lte: endOfMonth }
        });
        
        // Calculate total page views from jobs
        const jobs = await Job.find();
        let totalPageViews = 0;
        jobs.forEach(job => {
            totalPageViews += job.views || 0;
        });
        
        // Get status breakdown
        const statusBreakdown = {
            new: await Application.countDocuments({ status: 'New' }),
            underReview: await Application.countDocuments({ status: 'Under Review' }),
            interviewed: await Application.countDocuments({ status: 'Interviewed' }),
            accepted: await Application.countDocuments({ status: 'Accepted' })
        };
        
        res.json({
            monthlyJobs,
            monthlyApplications,
            newUsers,
            totalPageViews,
            statusBreakdown
        });
    } catch (error) {
        console.error('Error generating monthly summary report:', error);
        res.status(500).json({ message: 'Error generating report', error: error.message });
    }
});

module.exports = router;
