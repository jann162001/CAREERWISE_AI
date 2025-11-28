const express = require('express');
const router = express.Router();
const Interview = require('../models/Interview');

// Create/Schedule an interview
router.post('/schedule', async (req, res) => {
    try {
        const { applicationId, userId, jobId, scheduledById, scheduledByName, interviewDate, interviewLocation, interviewNotes } = req.body;

        const interview = new Interview({
            application: applicationId,
            user: userId,
            job: jobId,
            scheduledBy: scheduledById,
            scheduledByName,
            interviewDate,
            interviewLocation,
            interviewNotes
        });

        await interview.save();

        res.json({
            success: true,
            message: 'Interview scheduled successfully',
            interview
        });
    } catch (error) {
        console.error('❌ Error scheduling interview:', error);
        res.status(500).json({
            success: false,
            message: 'Error scheduling interview',
            error: error.message
        });
    }
});

// Get interviews for a specific user
router.get('/user/:userId', async (req, res) => {
    try {
        const interviews = await Interview.find({ user: req.params.userId })
            .populate('scheduledBy', 'fullName username email')
            .populate('job', 'jobTitle company location')
            .populate('application', 'status appliedDate')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            interviews
        });
    } catch (error) {
        console.error('❌ Error fetching interviews:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching interviews',
            error: error.message
        });
    }
});

// Get interview count for a specific user
router.get('/user/:userId/count', async (req, res) => {
    try {
        const count = await Interview.countDocuments({ user: req.params.userId });

        res.json({
            success: true,
            count
        });
    } catch (error) {
        console.error('❌ Error counting interviews:', error);
        res.status(500).json({
            success: false,
            message: 'Error counting interviews',
            error: error.message
        });
    }
});

module.exports = router;
