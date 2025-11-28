const express = require('express');
const router = express.Router();
const ProfileView = require('../models/ProfileView');
const User = require('../models/User');
const Profile = require('../models/Profile');

// POST /api/profile-views/track - Track a profile view
router.post('/track', async (req, res) => {
    try {
        const { profileOwnerId, viewerId, viewerName, applicationId } = req.body;

        console.log('📊 Tracking profile view:', { profileOwnerId, viewerId, viewerName });

        // Check if already viewed in the last hour (avoid duplicate counts)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const recentView = await ProfileView.findOne({
            profileOwner: profileOwnerId,
            viewedBy: viewerId,
            viewedAt: { $gte: oneHourAgo }
        });

        if (recentView) {
            console.log('⏭️ View already tracked within last hour');
            return res.json({ success: true, message: 'View already tracked', viewId: recentView._id });
        }

        // Create new profile view
        const profileView = new ProfileView({
            profileOwner: profileOwnerId,
            viewedBy: viewerId,
            viewerName: viewerName,
            application: applicationId || null
        });

        await profileView.save();

        console.log('✅ Profile view tracked successfully');
        res.json({ success: true, message: 'Profile view tracked', viewId: profileView._id });
    } catch (error) {
        console.error('❌ Error tracking profile view:', error);
        res.status(500).json({ success: false, message: 'Error tracking profile view', error: error.message });
    }
});

// GET /api/profile-views/user/:userId - Get profile views for a user
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        console.log('📊 Fetching profile views for user:', userId);

        const views = await ProfileView.find({ profileOwner: userId })
            .populate('viewedBy', 'fullName username email')
            .populate('application', 'job status')
            .populate({
                path: 'application',
                populate: {
                    path: 'job',
                    select: 'jobTitle company'
                }
            })
            .sort({ viewedAt: -1 });

        console.log(`✅ Found ${views.length} profile views`);

        res.json({ success: true, views, count: views.length });
    } catch (error) {
        console.error('❌ Error fetching profile views:', error);
        res.status(500).json({ success: false, message: 'Error fetching profile views', error: error.message });
    }
});

// GET /api/profile-views/user/:userId/count - Get profile view count for a user
router.get('/user/:userId/count', async (req, res) => {
    try {
        const { userId } = req.params;

        const count = await ProfileView.countDocuments({ profileOwner: userId });

        res.json({ success: true, count });
    } catch (error) {
        console.error('❌ Error fetching profile view count:', error);
        res.status(500).json({ success: false, message: 'Error fetching profile view count', error: error.message });
    }
});

module.exports = router;
