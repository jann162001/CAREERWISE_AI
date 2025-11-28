const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const Application = require('../models/Application');

// Create a new job (Admin only)
router.post('/create', async (req, res) => {
    try {
        // Check if admin is authenticated
        if (!req.session.adminId) {
            console.log('Job creation failed: Not authenticated');
            return res.status(401).json({ 
                success: false, 
                message: 'Unauthorized - Admin access required' 
            });
        }

        console.log('Creating job with data:', {
            jobTitle: req.body.jobTitle,
            company: req.body.company,
            workArrangement: req.body.workArrangement,
            jobType: req.body.jobType,
            experienceLevel: req.body.experienceLevel
        });

        const jobData = {
            jobTitle: req.body.jobTitle,
            company: req.body.company,
            companyLogo: req.body.companyLogo,
            description: req.body.description,
            responsibilities: req.body.responsibilities ? 
                (typeof req.body.responsibilities === 'string' ? 
                    req.body.responsibilities.split('\n').filter(r => r.trim()) : 
                    req.body.responsibilities) : [],
            location: {
                city: req.body.city || '',
                state: req.body.state || '',
                country: req.body.country || '',
                isRemote: req.body.workArrangement === 'Remote' || req.body.isRemote || false
            },
            workArrangement: req.body.workArrangement,
            jobType: req.body.jobType,
            industry: req.body.industry || '',
            department: req.body.department || '',
            experienceLevel: req.body.experienceLevel,
            yearsOfExperienceRequired: {
                min: parseInt(req.body.minExperience) || 0,
                max: req.body.maxExperience ? parseInt(req.body.maxExperience) : undefined
            },
            educationRequired: {
                degree: req.body.educationDegree || 'Not Required',
                fieldOfStudy: req.body.fieldOfStudy ? 
                    req.body.fieldOfStudy.split(',').map(f => f.trim()).filter(f => f) : []
            },
            requiredSkills: req.body.requiredSkills ? 
                req.body.requiredSkills.split(',').map(skill => ({
                    name: skill.trim(),
                    required: true
                })).filter(s => s.name) : [],
            preferredSkills: req.body.preferredSkills ? 
                req.body.preferredSkills.split(',').map(s => s.trim()).filter(s => s) : [],
            requiredCertifications: req.body.requiredCertifications ? 
                req.body.requiredCertifications.split(',').map(c => c.trim()).filter(c => c) : [],
            preferredCertifications: req.body.preferredCertifications ? 
                req.body.preferredCertifications.split(',').map(c => c.trim()).filter(c => c) : [],
            salary: {
                min: req.body.minSalary ? parseFloat(req.body.minSalary) : undefined,
                max: req.body.maxSalary ? parseFloat(req.body.maxSalary) : undefined,
                currency: req.body.currency || 'USD',
                payPeriod: req.body.payPeriod || 'Annual'
            },
            benefits: req.body.benefits ? 
                req.body.benefits.split(',').map(b => b.trim()).filter(b => b) : [],
            applicationDeadline: req.body.applicationDeadline || undefined,
            numberOfOpenings: parseInt(req.body.numberOfOpenings) || 1,
            contactEmail: req.body.contactEmail || '',
            contactPhone: req.body.contactPhone || '',
            applicationUrl: req.body.applicationUrl || '',
            status: req.body.status || 'Active',
            postedBy: req.session.adminId
        };

        // Generate keywords from job title and required skills
        const keywords = [];
        if (req.body.jobTitle) {
            keywords.push(...req.body.jobTitle.toLowerCase().split(' '));
        }
        if (req.body.requiredSkills) {
            keywords.push(...req.body.requiredSkills.toLowerCase().split(',').map(s => s.trim()));
        }
        jobData.keywords = [...new Set(keywords)];

        const job = new Job(jobData);
        await job.save();

        console.log('✅ Job created successfully:', {
            _id: job._id,
            jobTitle: job.jobTitle,
            company: job.company,
            status: job.status
        });

        // Verify it was saved
        const savedJob = await Job.findById(job._id);
        console.log('✅ Verification - Job exists in DB:', savedJob ? 'YES' : 'NO');

        res.status(201).json({ 
            success: true, 
            message: 'Job posted successfully',
            job: job
        });
    } catch (error) {
        console.error('Create job error:', error);
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
        res.status(500).json({ 
            success: false, 
            message: 'Error creating job post: ' + error.message,
            error: error.message 
        });
    }
});

// Get all jobs (Public - for users and admin)
router.get('/all', async (req, res) => {
    try {
        const { 
            status, 
            jobType, 
            workArrangement, 
            experienceLevel,
            search,
            page = 1,
            limit = req.session.adminId ? 100 : 10
        } = req.query;

        const query = {};
        
        // Filter by status (default to Active for public view)
        if (status) {
            query.status = status;
        } else if (!req.session.adminId) {
            // Non-admin users only see Active jobs
            query.status = 'Active';
        }

        // Additional filters
        if (jobType) query.jobType = jobType;
        if (workArrangement) query.workArrangement = workArrangement;
        if (experienceLevel) query.experienceLevel = experienceLevel;
        
        // Search functionality
        if (search) {
            query.$or = [
                { jobTitle: { $regex: search, $options: 'i' } },
                { company: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { keywords: { $in: [new RegExp(search, 'i')] } }
            ];
        }

        const skip = (page - 1) * limit;
        
        console.log('📊 Fetching jobs with query:', query);
        console.log('📊 Page:', page, 'Limit:', limit, 'Skip:', skip);
        
        const jobs = await Job.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(skip)
            .populate('postedBy', 'fullName username');

        const total = await Job.countDocuments(query);
        
        // Calculate actual application count for each job
        const jobsWithCounts = await Promise.all(jobs.map(async (job) => {
            const applicationCount = await Application.countDocuments({ job: job._id });
            const jobObject = job.toObject();
            jobObject.applications = applicationCount;
            return jobObject;
        }));
        
        console.log('📊 Query results:', {
            foundJobs: jobs.length,
            totalInDB: total,
            page: parseInt(page),
            limit: parseInt(limit)
        });

        res.json({ 
            success: true, 
            jobs: jobsWithCounts,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get jobs error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching jobs',
            error: error.message 
        });
    }
});

// Get single job by ID
router.get('/:id', async (req, res) => {
    try {
        const job = await Job.findById(req.params.id)
            .populate('postedBy', 'fullName username email');

        if (!job) {
            return res.status(404).json({ 
                success: false, 
                message: 'Job not found' 
            });
        }

        // Increment view count
        job.views += 1;
        await job.save();

        res.json({ 
            success: true, 
            job 
        });
    } catch (error) {
        console.error('Get job error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching job',
            error: error.message 
        });
    }
});

// Update job (Admin only)
router.put('/:id', async (req, res) => {
    try {
        console.log('Update job request body:', req.body);
        if (!req.session.adminId) {
            return res.status(401).json({ 
                success: false, 
                message: 'Unauthorized - Admin access required' 
            });
        }

        const job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({ 
                success: false, 
                message: 'Job not found' 
            });
        }

        // Update fields
        Object.keys(req.body).forEach(key => {
            if (req.body[key] !== undefined) {
                job[key] = req.body[key];
            }
        });

        try {
            await job.save();
        } catch (saveError) {
            console.error('Job save validation error:', saveError);
            return res.status(400).json({
                success: false,
                message: 'Job validation failed',
                error: saveError.message,
                details: saveError.errors
            });
        }

        return res.json({ 
            success: true, 
            message: 'Job updated successfully',
            job 
        });
    } catch (error) {
        console.error('Update job error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error updating job',
            error: error.message,
            stack: error.stack,
            requestBody: req.body
        });
    }
});

// Delete job (Admin only)
router.delete('/:id', async (req, res) => {
    try {
        if (!req.session.adminId) {
            return res.status(401).json({ 
                success: false, 
                message: 'Unauthorized - Admin access required' 
            });
        }

        const job = await Job.findByIdAndDelete(req.params.id);

        if (!job) {
            return res.status(404).json({ 
                success: false, 
                message: 'Job not found' 
            });
        }

        res.json({ 
            success: true, 
            message: 'Job deleted successfully' 
        });
    } catch (error) {
        console.error('Delete job error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error deleting job',
            error: error.message 
        });
    }
});

// Get job matches for user based on profile
router.get('/matches/count', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ 
                success: false, 
                message: 'Unauthorized - User must be logged in' 
            });
        }

        const Profile = require('../models/Profile');
        
        // Get user's profile
        const profile = await Profile.findOne({ userId: req.session.userId });
        
        if (!profile) {
            return res.json({ 
                success: true, 
                matchCount: 0,
                message: 'No profile found. Create a profile to see job matches.'
            });
        }

        // Get all active jobs
        const activeJobs = await Job.find({ status: 'Active' });
        
        // Calculate match score for each job
        let matchCount = 0;
        const matchThreshold = 40; // Jobs with 40%+ match are considered matches (lowered for better results)
        
        activeJobs.forEach(job => {
            const matchScore = job.calculateMatchScore(profile);
            if (matchScore >= matchThreshold) {
                matchCount++;
            }
        });

        res.json({ 
            success: true, 
            matchCount,
            totalJobs: activeJobs.length,
            threshold: matchThreshold
        });
    } catch (error) {
        console.error('Get matches count error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error calculating job matches',
            error: error.message 
        });
    }
});

// Get detailed list of job matches for user
router.get('/matches/list', async (req, res) => {
    try {
        if (!req.session.userId) {
            console.log('❌ No userId in session');
            return res.status(401).json({ 
                success: false, 
                message: 'Unauthorized - User must be logged in' 
            });
        }

        const Profile = require('../models/Profile');
        
        // Get user's profile
        const profile = await Profile.findOne({ userId: req.session.userId });
        
        if (!profile) {
            console.log('❌ No profile found for userId:', req.session.userId);
            return res.json({ 
                success: true, 
                matches: [],
                message: 'No profile found. Create a profile to see job matches.'
            });
        }

        console.log('✅ Profile found:', {
            fullName: profile.fullName,
            skills: profile.skills?.length || 0,
            education: profile.education?.length || 0,
            desiredJobTitles: profile.jobPreferences?.desiredJobTitles?.length || 0,
            desiredIndustries: profile.jobPreferences?.desiredIndustries?.length || 0
        });

        // Get all active jobs
        const activeJobs = await Job.find({ status: 'Active' }).populate('postedBy', 'fullName');
        console.log('📋 Active jobs found:', activeJobs.length);
        
        // Calculate match score for each job and filter
        const matchThreshold = 40;
        const matches = [];
        
        activeJobs.forEach(job => {
            const matchScore = job.calculateMatchScore(profile);
            console.log(`🎯 Job: "${job.jobTitle}" - Match Score: ${matchScore.toFixed(2)}%`);
            
            if (matchScore >= matchThreshold) {
                matches.push({
                    job: job,
                    matchScore: matchScore
                });
            }
        });

        // Sort by match score (highest first)
        matches.sort((a, b) => b.matchScore - a.matchScore);

        console.log('✨ Total matches above threshold:', matches.length);

        res.json({ 
            success: true, 
            matches: matches,
            totalMatches: matches.length
        });
    } catch (error) {
        console.error('Get matches list error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching job matches',
            error: error.message 
        });
    }
});

// TEST ENDPOINT: Get all jobs without pagination (for debugging)
router.get('/debug/all', async (req, res) => {
    try {
        const allJobs = await Job.find({}).select('jobTitle company status createdAt');
        const activeJobs = await Job.find({ status: 'Active' }).select('jobTitle company status createdAt');
        
        console.log('🔍 DEBUG: Total jobs in database:', allJobs.length);
        console.log('🔍 DEBUG: Active jobs:', activeJobs.length);
        
        res.json({
            success: true,
            totalJobs: allJobs.length,
            activeJobs: activeJobs.length,
            allJobs: allJobs.map(j => ({
                id: j._id,
                title: j.jobTitle,
                company: j.company,
                status: j.status,
                createdAt: j.createdAt
            })),
            activeJobsList: activeJobs.map(j => ({
                id: j._id,
                title: j.jobTitle,
                company: j.company,
                status: j.status,
                createdAt: j.createdAt
            }))
        });
    } catch (error) {
        console.error('Debug endpoint error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Save a job to user's profile
router.post('/:id/save', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ 
                success: false, 
                message: 'Unauthorized - User must be logged in' 
            });
        }

        const Profile = require('../models/Profile');
        const profile = await Profile.findOne({ userId: req.session.userId });
        
        if (!profile) {
            return res.status(404).json({ 
                success: false, 
                message: 'Profile not found' 
            });
        }

        const jobId = req.params.id;
        
        // Check if job exists
        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({ 
                success: false, 
                message: 'Job not found' 
            });
        }

        // Check if already saved
        if (profile.savedJobs.includes(jobId)) {
            return res.json({ 
                success: true, 
                message: 'Job already saved',
                alreadySaved: true
            });
        }

        // Add to saved jobs
        profile.savedJobs.push(jobId);
        await profile.save();

        console.log('✅ Job saved:', jobId, 'by user:', req.session.userId);

        res.json({ 
            success: true, 
            message: 'Job saved successfully',
            savedJobsCount: profile.savedJobs.length
        });
    } catch (error) {
        console.error('Save job error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error saving job',
            error: error.message 
        });
    }
});

// Unsave a job from user's profile
router.delete('/:id/save', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ 
                success: false, 
                message: 'Unauthorized - User must be logged in' 
            });
        }

        const Profile = require('../models/Profile');
        const profile = await Profile.findOne({ userId: req.session.userId });
        
        if (!profile) {
            return res.status(404).json({ 
                success: false, 
                message: 'Profile not found' 
            });
        }

        const jobId = req.params.id;
        
        // Remove from saved jobs
        profile.savedJobs = profile.savedJobs.filter(id => id.toString() !== jobId);
        await profile.save();

        console.log('❌ Job unsaved:', jobId, 'by user:', req.session.userId);

        res.json({ 
            success: true, 
            message: 'Job removed from saved',
            savedJobsCount: profile.savedJobs.length
        });
    } catch (error) {
        console.error('Unsave job error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error removing saved job',
            error: error.message 
        });
    }
});

// Get user's saved jobs
router.get('/saved/list', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ 
                success: false, 
                message: 'Unauthorized - User must be logged in' 
            });
        }

        const Profile = require('../models/Profile');
        const profile = await Profile.findOne({ userId: req.session.userId })
            .populate({
                path: 'savedJobs',
                populate: { path: 'postedBy', select: 'fullName' }
            });
        
        if (!profile) {
            return res.json({ 
                success: true, 
                savedJobs: [],
                message: 'No profile found'
            });
        }

        // Filter out any null jobs (in case job was deleted)
        const savedJobs = profile.savedJobs.filter(job => job !== null);

        console.log('📋 Saved jobs for user:', req.session.userId, '- Count:', savedJobs.length);

        res.json({ 
            success: true, 
            savedJobs: savedJobs,
            totalSaved: savedJobs.length
        });
    } catch (error) {
        console.error('Get saved jobs error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching saved jobs',
            error: error.message 
        });
    }
});

// Get saved jobs count
router.get('/saved/count', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ 
                success: false, 
                message: 'Unauthorized - User must be logged in' 
            });
        }

        const Profile = require('../models/Profile');
        const profile = await Profile.findOne({ userId: req.session.userId });
        
        if (!profile) {
            return res.json({ 
                success: true, 
                savedCount: 0
            });
        }

        res.json({ 
            success: true, 
            savedCount: profile.savedJobs ? profile.savedJobs.length : 0
        });
    } catch (error) {
        console.error('Get saved count error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching saved jobs count',
            error: error.message 
        });
    }
});

// Check if job is saved by user
router.get('/:id/is-saved', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.json({ 
                success: true, 
                isSaved: false
            });
        }

        const Profile = require('../models/Profile');
        const profile = await Profile.findOne({ userId: req.session.userId });
        
        if (!profile) {
            return res.json({ 
                success: true, 
                isSaved: false
            });
        }

        const isSaved = profile.savedJobs.includes(req.params.id);

        res.json({ 
            success: true, 
            isSaved: isSaved
        });
    } catch (error) {
        console.error('Check saved status error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error checking saved status',
            error: error.message 
        });
    }
});

// Get job statistics (Admin only)
router.get('/stats/overview', async (req, res) => {
    try {
        if (!req.session.adminId) {
            return res.status(401).json({ 
                success: false, 
                message: 'Unauthorized - Admin access required' 
            });
        }

        const totalJobs = await Job.countDocuments();
        const activeJobs = await Job.countDocuments({ status: 'Active' });
        const draftJobs = await Job.countDocuments({ status: 'Draft' });
        const closedJobs = await Job.countDocuments({ status: 'Closed' });

        const totalViews = await Job.aggregate([
            { $group: { _id: null, total: { $sum: '$views' } } }
        ]);

        const totalApplications = await Job.aggregate([
            { $group: { _id: null, total: { $sum: '$applications' } } }
        ]);

        res.json({ 
            success: true, 
            stats: {
                totalJobs,
                activeJobs,
                draftJobs,
                closedJobs,
                totalViews: totalViews[0]?.total || 0,
                totalApplications: totalApplications[0]?.total || 0
            }
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching statistics',
            error: error.message 
        });
    }
});

module.exports = router;
