const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Profile = require('../models/Profile');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (file.fieldname === 'profilePicture') {
            cb(null, 'public/uploads/profiles/');
        } else if (file.fieldname === 'resumeFile') {
            cb(null, 'public/uploads/resumes/');
        } else if (file.fieldname === 'resume') {
            cb(null, 'public/uploads/resumes/');
        } else if (file.fieldname === 'certificates') {
            cb(null, 'public/uploads/certificates/');
        }
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        if (file.fieldname === 'profilePicture') {
            // Accept images only
            if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
                return cb(new Error('Only image files are allowed!'), false);
            }
        } else if (file.fieldname === 'resumeFile' || file.fieldname === 'resume' || file.fieldname === 'certificates') {
            // Accept PDF files only
            if (!file.originalname.match(/\.(pdf)$/)) {
                return cb(new Error('Only PDF files are allowed!'), false);
            }
        }
        cb(null, true);
    }
});

// Create or update user profile
router.post('/create', upload.fields([
    { name: 'profilePicture', maxCount: 1 },
    { name: 'resumeFile', maxCount: 1 },
    { name: 'certificates', maxCount: 10 }
]), async (req, res) => {
    try {
        // Check if user is authenticated
        if (!req.session.userId) {
            console.log('Profile creation failed: Not authenticated');
            return res.status(401).json({ 
                success: false, 
                message: 'Unauthorized - User must be logged in' 
            });
        }

        // Check if profile already exists
        let profile = await Profile.findOne({ userId: req.session.userId });

        const profileData = JSON.parse(req.body.profileData || '{}');
        
        // Add file paths if files were uploaded
        if (req.files) {
            if (req.files.profilePicture) {
                profileData.profilePicture = '/uploads/profiles/' + req.files.profilePicture[0].filename;
            }
            if (req.files.resumeFile) {
                profileData.resume = {
                    filename: req.files.resumeFile[0].originalname,
                    fileUrl: '/uploads/resumes/' + req.files.resumeFile[0].filename,
                    uploadedAt: new Date()
                };
            }
            if (req.files.certificates && req.files.certificates.length > 0) {
                profileData.certificates = req.files.certificates.map(file => ({
                    filename: file.originalname,
                    fileUrl: '/uploads/certificates/' + file.filename,
                    uploadedAt: new Date()
                }));
            }
        }

        if (profile) {
            // Update existing profile
            Object.assign(profile, profileData);
        } else {
            // Create new profile
            profile = new Profile({
                userId: req.session.userId,
                ...profileData
            });
        }

        await profile.save();

        res.status(201).json({ 
            success: true, 
            message: 'Profile saved successfully',
            profile: {
                id: profile._id,
                completion: profile.calculateCompletion()
            }
        });
    } catch (error) {
        console.error('Profile creation error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error saving profile: ' + error.message
        });
    }
});

// Get user profile
router.get('/me', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ 
                success: false, 
                message: 'Not authenticated' 
            });
        }

        const profile = await Profile.findOne({ userId: req.session.userId });
        
        if (!profile) {
            return res.status(404).json({ 
                success: false, 
                message: 'Profile not found',
                hasProfile: false
            });
        }

        res.json({ 
            success: true, 
            profile: profile,
            completion: profile.calculateCompletion()
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching profile' 
        });
    }
});

// Check if user has completed profile
router.get('/status', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ 
                success: false, 
                message: 'Not authenticated' 
            });
        }

        const profile = await Profile.findOne({ userId: req.session.userId });
        
        res.json({ 
            success: true, 
            hasProfile: !!profile,
            completion: profile ? profile.calculateCompletion() : 0
        });
    } catch (error) {
        console.error('Profile status error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error checking profile status' 
        });
    }
});

// Upload resume only
router.post('/upload-resume', upload.single('resume'), async (req, res) => {
    try {
        // Use session userId instead of form data for security
        const userId = req.session.userId || req.body.userId;

        console.log('📤 Resume upload request received');
        console.log('Session userId:', req.session.userId);
        console.log('Body userId:', req.body.userId);
        console.log('Using userId:', userId);

        if (!userId) {
            console.log('❌ No userId provided');
            return res.status(400).json({ 
                success: false, 
                message: 'User ID is required. Please log in again.' 
            });
        }

        if (!req.file) {
            console.log('❌ No file uploaded');
            return res.status(400).json({ 
                success: false, 
                message: 'No file uploaded' 
            });
        }

        console.log('📁 File received:', req.file.originalname, 'Size:', req.file.size, 'bytes');

        // Find profile - using userId field, not user
        const profile = await Profile.findOne({ userId: userId });
        
        if (!profile) {
            console.log('❌ Profile not found for userId:', userId);
            return res.status(404).json({ 
                success: false, 
                message: 'Profile not found. Please create a profile first.' 
            });
        }

        console.log('✅ Profile found, updating resume...');

        // Update resume
        profile.resume = {
            filename: req.file.originalname,
            fileUrl: `/uploads/resumes/${req.file.filename}`,
            uploadedAt: new Date()
        };

        await profile.save();

        console.log('✅ Resume uploaded successfully for user:', userId);
        console.log('📄 Resume details:', profile.resume);

        res.json({ 
            success: true, 
            message: 'Resume uploaded successfully',
            resume: profile.resume
        });
    } catch (error) {
        console.error('❌ Resume upload error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error uploading resume: ' + error.message 
        });
    }
});

// Analyze Resume with AI
router.post('/analyze-resume', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ 
                success: false, 
                message: 'Not authenticated' 
            });
        }

        const userId = req.session.userId;
        const profile = await Profile.findOne({ userId });

        if (!profile || !profile.resume) {
            return res.status(404).json({ 
                success: false, 
                message: 'No resume found to analyze' 
            });
        }

        // Simulated AI Analysis (In production, you would integrate with actual AI/ML service)
        // This creates a mock analysis based on the profile data
        
        // Extract skills from profile
        const skills = profile.skills || [];
        
        // Generate mock work experience
        const workExperience = [];
        if (profile.workExperience && profile.workExperience.length > 0) {
            profile.workExperience.forEach(exp => {
                workExperience.push({
                    title: exp.jobTitle || 'Position',
                    years: exp.duration || 'N/A',
                    tasks: [
                        exp.responsibilities || 'Performed various duties',
                        'Collaborated with team members',
                        'Achieved project goals'
                    ]
                });
            });
        } else {
            workExperience.push({
                title: 'Professional Experience',
                years: '1-2 years',
                tasks: [
                    'Add your work experience to improve analysis',
                    'Include job titles and responsibilities',
                    'Quantify your achievements'
                ]
            });
        }

        // Generate education data
        const education = profile.education || [];
        const educationData = education.length > 0 ? education.map(edu => ({
            degree: edu.degree || 'Degree',
            school: edu.institution || 'Institution',
            graduationYear: edu.graduationYear || 'Year'
        })) : [{
            degree: 'Add Your Degree',
            school: 'Add Your School',
            graduationYear: 'Year'
        }];

        // Calculate overall score based on profile completeness
        let score = 60; // Base score
        if (skills.length > 0) score += 10;
        if (skills.length >= 5) score += 5;
        if (workExperience.length > 0) score += 10;
        if (education.length > 0) score += 10;
        if (profile.bio && profile.bio.length > 50) score += 5;

        // Generate job match percentage
        const jobMatchPercentage = Math.min(85, 50 + (skills.length * 5));

        // Generate grammar suggestions
        const grammarIssues = [];
        if (!profile.bio || profile.bio.length < 50) {
            grammarIssues.push({
                type: 'Missing Content',
                suggestion: 'Add a professional bio to your profile'
            });
        }

        // Generate improvement suggestions
        const suggestions = [];
        if (skills.length < 5) {
            suggestions.push('Add more skills relevant to your field (aim for at least 5-10 skills)');
        }
        if (workExperience.length === 0) {
            suggestions.push('Add your work experience with specific achievements and responsibilities');
        }
        if (education.length === 0) {
            suggestions.push('Include your educational background');
        }
        if (!profile.bio || profile.bio.length < 50) {
            suggestions.push('Write a compelling professional bio (at least 50 words)');
        }
        suggestions.push('Use action verbs to describe your achievements');
        suggestions.push('Quantify your accomplishments with numbers and metrics');
        suggestions.push('Keep your resume updated with recent projects and skills');

        const analysis = {
            overallScore: Math.min(score, 100),
            scoreDescription: score >= 80 ? 'Excellent! Your resume is strong.' : 
                             score >= 60 ? 'Good! Some improvements would help.' : 
                             'Needs improvement. Follow the suggestions below.',
            skills: skills,
            workExperience: workExperience,
            education: educationData,
            jobMatchPercentage: jobMatchPercentage,
            matchAnalysis: `Your resume shows ${jobMatchPercentage}% match with typical job requirements in your field. ${skills.length > 0 ? 'Your skills align well with industry standards.' : 'Add more relevant skills to improve your match rate.'}`,
            grammarIssues: grammarIssues,
            suggestions: suggestions
        };

        res.json({ 
            success: true, 
            analysis: analysis 
        });

    } catch (error) {
        console.error('Resume analysis error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error analyzing resume' 
        });
    }
});

// Career Guidance Endpoint
router.post('/career-guidance', async (req, res) => {
    try {
        console.log('🎯 Career guidance request received');
        
        if (!req.session.userId) {
            console.log('❌ Not authenticated');
            return res.status(401).json({ 
                success: false, 
                message: 'Not authenticated' 
            });
        }

        const userId = req.session.userId;
        console.log('👤 User ID:', userId);
        
        const profile = await Profile.findOne({ userId });
        const { desiredJob } = req.body;
        
        console.log('📋 Profile found:', !!profile);
        console.log('🎯 Desired job:', desiredJob);

        if (!profile) {
            console.log('❌ Profile not found');
            return res.status(404).json({ 
                success: false, 
                message: 'Profile not found' 
            });
        }



        // Use the same job match logic as /api/jobs/matches/list
        const Job = require('../models/Job');
        const activeJobs = await Job.find({ status: 'Active' }).populate('postedBy', 'fullName');
        const matchThreshold = 40;
        const matches = [];
        let topMatchScore = 0;
        activeJobs.forEach(job => {
            const matchScore = job.calculateMatchScore(profile);
            if (matchScore > topMatchScore) topMatchScore = matchScore;
            if (matchScore >= matchThreshold) {
                matches.push({
                    job: job,
                    matchScore: matchScore
                });
            }
        });
        matches.sort((a, b) => b.matchScore - a.matchScore);
        // Prepare job recommendations (top 3 matches)
        const jobRecommendations = matches.slice(0, 3).map(m => ({
            title: m.job.jobTitle,
            matchPercentage: m.matchScore,
            company: m.job.company,
            reason: `Matched using your profile and preferences`,
            requiredSkills: m.job.requiredSkills ? m.job.requiredSkills.map(s => s.name) : []
        }));

        // Skill Gap Analysis: compare required skills of top job with user's skills
        let skillGap = null;
        if (matches.length > 0) {
            const userSkills = (profile.skills || []).map(s => typeof s === 'string' ? s : s.name.toLowerCase());
            const topJob = matches[0].job;
            const requiredSkills = (topJob.requiredSkills || []).map(s => s.name.toLowerCase());
            const missingSkills = requiredSkills.filter(skill => !userSkills.includes(skill));
            skillGap = {
                targetRole: topJob.jobTitle,
                description: `To become a ${topJob.jobTitle}, you'll need to develop these additional skills`,
                currentSkills: userSkills.length > 0 ? userSkills : ['Communication', 'Problem Solving', 'Teamwork'],
                missingSkills: missingSkills.length > 0 ? missingSkills : ['Expand your skill set for this role']
            };
        }

        // Strengths & Weaknesses: based on profile and skill gap
        let strengthsWeaknesses = null;
        if (matches.length > 0) {
            strengthsWeaknesses = {
                strengths: [
                    (profile.skills && profile.skills.length >= 5) ? 'Diverse skill set that shows versatility' : 'Foundation skills in place',
                    profile.workExperience?.length > 0 ? 'Proven work experience in the field' : 'Educational background established',
                    'Motivated to learn and grow professionally',
                    'Taking initiative in career development'
                ],
                weaknesses: [
                    (profile.skills && profile.skills.length < 5) ? 'Limited skills - consider expanding your toolkit' : 'Could benefit from more specialized expertise',
                    !profile.resume ? 'No resume uploaded - important for job applications' : 'Keep resume updated regularly',
                    (skillGap && skillGap.missingSkills.length > 0) ? `Missing key skills: ${skillGap.missingSkills.slice(0, 2).join(', ')}` : 'Stay current with industry trends',
                    'Networking and personal branding could be strengthened'
                ]
            };
        }

        // Career Match Score: only if there are matches
        let careerMatchScore = matches.length > 0 ? matches[0].matchScore : null;
        let matchDescription = '';
        if (careerMatchScore === null) {
            matchDescription = 'No relevant jobs found for your profile. Please update your profile or check back later.';
        } else if (careerMatchScore >= 80) {
            matchDescription = 'Excellent! You\'re well-positioned for your target roles.';
        } else if (careerMatchScore >= 60) {
            matchDescription = 'Good match! Focus on filling skill gaps to improve.';
        } else {
            matchDescription = 'Keep building your skills and experience to reach your career goals.';
        }

        const guidance = {
            careerMatchScore: careerMatchScore !== null ? careerMatchScore : '--',
            matchDescription,
            jobRecommendations,
            skillGap,
            strengthsWeaknesses
        };

        console.log('✅ Career guidance generated successfully');
        console.log('📊 Career match score:', careerMatchScore);
        
        res.json({ 
            success: true, 
            guidance 
        });

    } catch (error) {
        console.error('❌ Career guidance error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error generating career guidance' 
        });
    }
});

module.exports = router;
