const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');
const Profile = require('../models/Profile');
const multer = require('multer');
const path = require('path');

// Configure multer for resume uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/applications/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'application-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /pdf|doc|docx/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Only PDF, DOC, and DOCX files are allowed!'));
        }
    }
});

// POST /api/applications/apply - Submit job application
router.post('/apply', upload.single('resume'), async (req, res) => {
    try {
        const { userId, jobId } = req.body;

        console.log('📝 New application received:', { userId, jobId });

        // Check if user already applied
        const existingApplication = await Application.findOne({ user: userId, job: jobId });
        if (existingApplication) {
            return res.status(400).json({ message: 'You have already applied to this job' });
        }

        // Check if job exists
        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        // Get user info
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Get user profile for resume - use userId field
        const profile = await Profile.findOne({ userId: userId });
        
        const applicationData = {
            user: userId,
            job: jobId,
            timeline: [{
                action: 'Application submitted',
                by: 'Applicant',
                date: new Date(),
                details: `Applied for ${job.title} position at ${job.company}`
            }]
        };

        // Use uploaded resume or profile resume
        if (req.file) {
            applicationData.resume = {
                filename: req.file.originalname,
                fileUrl: `/uploads/applications/${req.file.filename}`,
                uploadedAt: new Date()
            };
        } else if (profile?.resume) {
            applicationData.resume = profile.resume;
        } else {
            return res.status(400).json({ message: 'Please upload your resume' });
        }

        const application = new Application(applicationData);
        await application.save();

        // Don't create automatic message conversation - let admin start it
        console.log('✅ Application submitted successfully:', application._id);

        res.status(201).json({
            message: 'Application submitted successfully!',
            application
        });
    } catch (error) {
        console.error('❌ Error submitting application:', error);
        res.status(500).json({ message: 'Error submitting application', error: error.message });
    }
});

// GET /api/applications/all - Get all applications (Admin)
router.get('/all', async (req, res) => {
    try {
        const { status, jobId, search, sortBy } = req.query;

        console.log('📥 GET /api/applications/all called');
        console.log('Query params:', { status, jobId, search, sortBy });

        let query = {};
        
        // Filter by status
        if (status && status !== 'all') {
            query.status = status;
        }

        // Filter by job
        if (jobId) {
            query.job = jobId;
        }

        console.log('🔍 MongoDB query:', query);

        let applications = await Application.find(query)
            .populate('user', 'fullName username email')
            .populate('job', 'jobTitle title company location')
            .sort({ appliedDate: -1 });

        console.log(`✅ Found ${applications.length} applications in database`);
        
        // Fetch profile data for each application
        for (let app of applications) {
            if (app.user && app.user._id) {
                const profile = await Profile.findOne({ userId: app.user._id });
                app._doc.profile = profile;
            }
        }
        
        if (applications.length > 0) {
            console.log('Sample application with profile:', JSON.stringify(applications[0], null, 2));
        }

        // Search by name or email
        if (search) {
            const searchLower = search.toLowerCase();
            applications = applications.filter(app => 
                app.user?.fullName?.toLowerCase().includes(searchLower) ||
                app.user?.username?.toLowerCase().includes(searchLower) ||
                app.user?.email?.toLowerCase().includes(searchLower) ||
                app.job?.jobTitle?.toLowerCase().includes(searchLower) ||
                app.job?.title?.toLowerCase().includes(searchLower) ||
                app.job?.company?.toLowerCase().includes(searchLower)
            );
        }

        // Sort
        if (sortBy === 'date-asc') {
            applications.sort((a, b) => new Date(a.appliedDate) - new Date(b.appliedDate));
        } else if (sortBy === 'date-desc') {
            applications.sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate));
        }

        console.log(`📋 Returning ${applications.length} applications to client`);

        res.json({ applications: applications });
    } catch (error) {
        console.error('❌ Error fetching applications:', error);
        res.status(500).json({ message: 'Error fetching applications', error: error.message });
    }
});

// GET /api/applications/:id - Get single application details
router.get('/:id', async (req, res) => {
    try {
        console.log('🔍 GET /api/applications/:id called with ID:', req.params.id);
        
        const application = await Application.findById(req.params.id)
            .populate('user', 'username email fullName')
            .populate('job');

        console.log('📋 Found application:', application ? 'YES' : 'NO');
        
        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        console.log('👤 User in application:', application.user);
        console.log('💼 Job in application:', application.job);

        // Get user's profile data - Profile model uses 'userId' field
        console.log('🔍 Searching for profile with userId:', application.user._id);
        const profile = await Profile.findOne({ userId: application.user._id });
        console.log('📝 Found profile:', profile ? 'YES' : 'NO');
        
        // DEBUG: Let's see ALL profiles to understand the issue
        const allProfiles = await Profile.find({}).limit(5);
        console.log('🗂️ Total profiles in database:', await Profile.countDocuments());
        console.log('🗂️ Sample profiles (first 5):', allProfiles.map(p => ({
            userId: p.userId,
            fullName: p.fullName,
            phoneNumber: p.phoneNumber
        })));
        
        if (profile) {
            console.log('📝 Profile data:', {
                phoneNumber: profile.phoneNumber,
                location: profile.location,
                professionalTitle: profile.professionalTitle,
                skills: profile.skills?.length || 0,
                education: profile.education?.length || 0,
                workExperience: profile.workExperience?.length || 0
            });
        }

        const result = {
            ...application.toObject(),
            profile
        };

        console.log('✅ Sending response with profile:', result.profile ? 'YES' : 'NO');

        res.json(result);
    } catch (error) {
        console.error('❌ Error fetching application:', error);
        res.status(500).json({ message: 'Error fetching application', error: error.message });
    }
});

// PUT /api/applications/:id/status - Update application status
router.put('/:id/status', async (req, res) => {
    try {
        const { status, adminName } = req.body;

        const application = await Application.findById(req.params.id);
        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        const oldStatus = application.status;
        application.status = status;

        // Update reviewed date if moving from New
        if (oldStatus === 'New' && status !== 'New') {
            application.reviewedDate = new Date();
        }

        // Add to timeline
        application.timeline.push({
            action: `Status changed from ${oldStatus} to ${status}`,
            by: adminName || 'Admin',
            date: new Date(),
            details: `Application status updated`
        });

        await application.save();

        console.log(`✅ Application ${application._id} status updated: ${oldStatus} → ${status}`);

        res.json({
            message: 'Status updated successfully',
            application
        });
    } catch (error) {
        console.error('❌ Error updating status:', error);
        res.status(500).json({ message: 'Error updating status', error: error.message });
    }
});

// PUT /api/applications/:id/notes - Add note to application
router.put('/:id/notes', async (req, res) => {
    try {
        const { author, content } = req.body;

        const application = await Application.findById(req.params.id);
        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        application.notes.push({
            author,
            content,
            createdAt: new Date()
        });

        application.timeline.push({
            action: 'Note added',
            by: author,
            date: new Date(),
            details: content.substring(0, 50) + (content.length > 50 ? '...' : '')
        });

        await application.save();

        console.log(`📝 Note added to application ${application._id} by ${author}`);

        res.json({
            message: 'Note added successfully',
            application
        });
    } catch (error) {
        console.error('❌ Error adding note:', error);
        res.status(500).json({ message: 'Error adding note', error: error.message });
    }
});

// PUT /api/applications/:id/interview - Schedule interview
router.put('/:id/interview', async (req, res) => {
    try {
        const { interviewDate, interviewLocation, interviewNotes, adminName } = req.body;

        const application = await Application.findById(req.params.id)
            .populate('user', 'username email')
            .populate('job', 'title company');

        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        application.interviewDate = new Date(interviewDate);
        application.interviewLocation = interviewLocation;
        application.interviewNotes = interviewNotes;
        application.status = 'For Interview';

        application.timeline.push({
            action: 'Interview scheduled',
            by: adminName || 'Admin',
            date: new Date(),
            details: `Interview on ${new Date(interviewDate).toLocaleDateString()} at ${interviewLocation}`
        });

        await application.save();

        console.log(`📅 Interview scheduled for application ${application._id}`);

        res.json({
            message: 'Interview scheduled successfully',
            application
        });
    } catch (error) {
        console.error('❌ Error scheduling interview:', error);
        res.status(500).json({ message: 'Error scheduling interview', error: error.message });
    }
});

// GET /api/applications/export/csv - Export applications as CSV
router.get('/export/csv', async (req, res) => {
    try {
        const applications = await Application.find()
            .populate('user', 'username email')
            .populate('job', 'title company location')
            .populate({
                path: 'user',
                populate: {
                    path: 'profile',
                    model: 'Profile'
                }
            })
            .sort({ appliedDate: -1 });

        // Create CSV header
        const csvHeader = 'Applicant Name,Email,Job Title,Company,Status,Applied Date,Phone,Skills,Experience,Education\n';

        // Create CSV rows
        const csvRows = applications.map(app => {
            const profile = app.user?.profile;
            return [
                app.user?.username || 'N/A',
                app.user?.email || 'N/A',
                app.job?.title || 'N/A',
                app.job?.company || 'N/A',
                app.status,
                new Date(app.appliedDate).toLocaleDateString(),
                profile?.phone || 'N/A',
                profile?.skills?.join('; ') || 'N/A',
                profile?.experience || 'N/A',
                profile?.education || 'N/A'
            ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
        }).join('\n');

        const csv = csvHeader + csvRows;

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=applications.csv');
        res.send(csv);

        console.log(`📊 Exported ${applications.length} applications to CSV`);
    } catch (error) {
        console.error('❌ Error exporting applications:', error);
        res.status(500).json({ message: 'Error exporting applications', error: error.message });
    }
});

// GET /api/applications/user/:userId - Get user's applications
router.get('/user/:userId', async (req, res) => {
    try {
        const applications = await Application.find({ user: req.params.userId })
            .populate('job')
            .sort({ appliedDate: -1 });

        res.json(applications);
    } catch (error) {
        console.error('❌ Error fetching user applications:', error);
        res.status(500).json({ message: 'Error fetching applications', error: error.message });
    }
});

// GET /api/applications/stats/summary - Get application statistics
router.get('/stats/summary', async (req, res) => {
    try {
        const total = await Application.countDocuments();
        const newApps = await Application.countDocuments({ status: 'New' });
        const underReview = await Application.countDocuments({ status: 'Under Review' });
        const shortlisted = await Application.countDocuments({ status: 'Shortlisted' });
        const forInterview = await Application.countDocuments({ status: 'For Interview' });
        const hired = await Application.countDocuments({ status: 'Hired' });
        const rejected = await Application.countDocuments({ status: 'Rejected' });

        res.json({
            total,
            new: newApps,
            underReview,
            shortlisted,
            forInterview,
            hired,
            rejected
        });
    } catch (error) {
        console.error('❌ Error fetching stats:', error);
        res.status(500).json({ message: 'Error fetching statistics', error: error.message });
    }
});

// PUT /api/applications/:id/withdraw - Withdraw application
router.put('/:id/withdraw', async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        const application = await Application.findById(id);
        
        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        // Check if user owns this application
        if (application.user.toString() !== userId) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Update status to Withdrawn
        application.status = 'Withdrawn';
        application.timeline.push({
            action: 'Application withdrawn',
            by: 'Applicant',
            date: new Date(),
            details: 'Applicant canceled their application'
        });

        await application.save();

        console.log('✅ Application withdrawn:', id);

        res.json({
            success: true,
            message: 'Application withdrawn successfully',
            application
        });
    } catch (error) {
        console.error('❌ Error withdrawing application:', error);
        res.status(500).json({ message: 'Error withdrawing application', error: error.message });
    }
});

module.exports = router;
