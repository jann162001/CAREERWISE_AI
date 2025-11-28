const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    // Basic Job Information
    jobTitle: {
        type: String,
        required: true
    },
    company: {
        type: String,
        required: true
    },
    companyLogo: {
        type: String // URL
    },
    
    // Job Details
    description: {
        type: String,
        required: true
    },
    responsibilities: [String],
    
    // Location & Work Arrangement
    location: {
        city: String,
        state: String,
        country: String,
        isRemote: {
            type: Boolean,
            default: false
        }
    },
    workArrangement: {
        type: String,
        enum: ['On-site', 'Remote', 'Hybrid'],
        required: true
    },
    
    // Job Type & Category
    jobType: {
        type: String,
        enum: ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'],
        required: true
    },
    industry: {
        type: String // e.g., "Technology", "Healthcare", "Finance"
    },
    department: {
        type: String // e.g., "Engineering", "Marketing", "Sales"
    },
    
    // Experience Requirements
    experienceLevel: {
        type: String,
        enum: ['Entry Level', 'Mid Level', 'Senior Level', 'Lead/Manager', 'Executive'],
        required: true
    },
    yearsOfExperienceRequired: {
        min: {
            type: Number,
            default: 0
        },
        max: Number
    },
    
    // Education Requirements
    educationRequired: {
        degree: {
            type: String,
            enum: ['High School', 'Associate', 'Bachelor\'s', 'Master\'s', 'PhD', 'Not Required']
        },
        fieldOfStudy: [String]
    },
    
    // Skills Requirements
    requiredSkills: [{
        name: String,
        required: {
            type: Boolean,
            default: true
        }
    }],
    preferredSkills: [String],
    
    // Certifications
    requiredCertifications: [String],
    preferredCertifications: [String],
    
    // Compensation
    salary: {
        min: Number,
        max: Number,
        currency: {
            type: String,
            default: 'USD'
        },
        payPeriod: {
            type: String,
            enum: ['Hourly', 'Annual'],
            default: 'Annual'
        }
    },
    
    // Benefits
    benefits: [String], // e.g., "Health Insurance", "401k", "Remote Work", etc.
    
    // Application Details
    applicationDeadline: {
        type: Date
    },
    numberOfOpenings: {
        type: Number,
        default: 1
    },
    
    // Contact Information
    contactEmail: {
        type: String
    },
    contactPhone: {
        type: String
    },
    applicationUrl: {
        type: String // External application URL
    },
    
    // Job Status
    status: {
        type: String,
        enum: ['Draft', 'Active', 'Closed', 'On Hold'],
        default: 'Active'
    },
    
    // Metadata
    postedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true
    },
    views: {
        type: Number,
        default: 0
    },
    applications: {
        type: Number,
        default: 0
    },
    
    // Matching Keywords (for search optimization)
    keywords: [String],
    
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt timestamp before saving
jobSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Method to calculate match score with a user profile
jobSchema.methods.calculateMatchScore = function(userProfile) {
    let score = 0;
    let totalWeight = 0;
    
    // 1. Skills Match (25% weight) - Most Important
    const skillWeight = 25;
    totalWeight += skillWeight;
    if (this.requiredSkills && this.requiredSkills.length > 0 && userProfile.skills && userProfile.skills.length > 0) {
        const userSkillNames = userProfile.skills.map(s => s.name.toLowerCase().trim());
        const requiredSkillNames = this.requiredSkills.map(s => s.name.toLowerCase().trim());
        
        let matchedSkills = 0;
        requiredSkillNames.forEach(reqSkill => {
            // Check for exact match or partial match
            const hasMatch = userSkillNames.some(userSkill => 
                userSkill === reqSkill || 
                userSkill.includes(reqSkill) || 
                reqSkill.includes(userSkill)
            );
            if (hasMatch) matchedSkills++;
        });
        
        const skillMatchPercentage = matchedSkills / requiredSkillNames.length;
        score += skillMatchPercentage * skillWeight;
    }
    
    // 2. Education Field Match (20% weight)
    const educationWeight = 20;
    totalWeight += educationWeight;
    if (userProfile.education && userProfile.education.length > 0) {
        let educationScore = 0;
        
        // Check degree level match
        if (this.educationRequired && this.educationRequired.degree) {
            const degreeHierarchy = ['High School', 'Associate', 'Bachelor\'s', 'Master\'s', 'PhD', 'Not Required'];
            const requiredDegree = this.educationRequired.degree;
            
            if (requiredDegree === 'Not Required') {
                educationScore += 0.5; // 50% if no degree required
            } else {
                const requiredIndex = degreeHierarchy.indexOf(requiredDegree);
                const userHighestDegree = userProfile.education.reduce((highest, edu) => {
                    const eduIndex = degreeHierarchy.indexOf(edu.degree);
                    return eduIndex > highest ? eduIndex : highest;
                }, -1);
                
                if (userHighestDegree >= requiredIndex) {
                    educationScore += 0.5; // 50% for degree level
                } else if (userHighestDegree >= 0) {
                    educationScore += 0.2; // 20% for having some education
                }
            }
        }
        
        // Check field of study match
        if (this.educationRequired && this.educationRequired.fieldOfStudy && this.educationRequired.fieldOfStudy.length > 0) {
            const requiredFields = this.educationRequired.fieldOfStudy.map(f => f.toLowerCase().trim());
            const userFields = userProfile.education.map(e => e.fieldOfStudy ? e.fieldOfStudy.toLowerCase().trim() : '');
            
            const hasFieldMatch = requiredFields.some(reqField => 
                userFields.some(userField => 
                    userField.includes(reqField) || reqField.includes(userField)
                )
            );
            
            if (hasFieldMatch) {
                educationScore += 0.5; // 50% for field match
            }
        } else {
            educationScore += 0.5; // 50% if no specific field required
        }
        
        score += educationScore * educationWeight;
    }
    
    // 3. Industry Match (15% weight)
    const industryWeight = 15;
    totalWeight += industryWeight;
    if (this.industry && userProfile.jobPreferences && userProfile.jobPreferences.desiredIndustries) {
        const jobIndustry = this.industry.toLowerCase().trim();
        const userIndustries = userProfile.jobPreferences.desiredIndustries.map(i => i.toLowerCase().trim());
        
        const hasIndustryMatch = userIndustries.some(userInd => 
            userInd.includes(jobIndustry) || jobIndustry.includes(userInd)
        );
        
        if (hasIndustryMatch) {
            score += industryWeight;
        }
    }
    
    // 4. Job Title Match (15% weight)
    const titleWeight = 15;
    totalWeight += titleWeight;
    if (this.jobTitle && userProfile.jobPreferences && userProfile.jobPreferences.desiredJobTitles) {
        const jobTitle = this.jobTitle.toLowerCase().trim();
        const userTitles = userProfile.jobPreferences.desiredJobTitles.map(t => t.toLowerCase().trim());
        
        // Check for exact or partial match
        const hasTitleMatch = userTitles.some(userTitle => 
            jobTitle.includes(userTitle) || 
            userTitle.includes(jobTitle) ||
            // Check for keyword matches
            jobTitle.split(' ').some(word => userTitle.split(' ').includes(word))
        );
        
        if (hasTitleMatch) {
            score += titleWeight;
        } else if (userProfile.professionalTitle) {
            // Check against user's current professional title
            const profTitle = userProfile.professionalTitle.toLowerCase().trim();
            if (jobTitle.includes(profTitle) || profTitle.includes(jobTitle)) {
                score += titleWeight * 0.7; // 70% match for professional title
            }
        }
    }
    
    // 5. Experience Level & Years Match (10% weight)
    const experienceWeight = 10;
    totalWeight += experienceWeight;
    let experienceScore = 0;
    
    // Check experience level
    if (this.experienceLevel === userProfile.experienceLevel) {
        experienceScore += 0.6; // 60% for exact level match
    } else {
        const levels = ['Entry Level', 'Mid Level', 'Senior Level', 'Lead/Manager', 'Executive'];
        const jobLevelIndex = levels.indexOf(this.experienceLevel);
        const userLevelIndex = levels.indexOf(userProfile.experienceLevel);
        const difference = Math.abs(jobLevelIndex - userLevelIndex);
        
        if (difference === 1) {
            experienceScore += 0.4; // 40% for one level difference
        } else if (difference === 2) {
            experienceScore += 0.2; // 20% for two levels difference
        }
    }
    
    // Check years of experience
    if (this.yearsOfExperienceRequired && userProfile.yearsOfExperience !== undefined) {
        const userYears = userProfile.yearsOfExperience;
        const minRequired = this.yearsOfExperienceRequired.min || 0;
        const maxRequired = this.yearsOfExperienceRequired.max || 999;
        
        if (userYears >= minRequired && userYears <= maxRequired) {
            experienceScore += 0.4; // 40% for years in range
        } else if (userYears >= minRequired - 1 && userYears <= maxRequired + 1) {
            experienceScore += 0.2; // 20% for close to range
        }
    }
    
    score += experienceScore * experienceWeight;
    
    // 6. Work Arrangement Match (10% weight)
    const workArrangementWeight = 10;
    totalWeight += workArrangementWeight;
    if (userProfile.jobPreferences && userProfile.jobPreferences.workArrangement) {
        if (userProfile.jobPreferences.workArrangement.includes(this.workArrangement)) {
            score += workArrangementWeight;
        } else if (this.workArrangement === 'Hybrid' && 
                  (userProfile.jobPreferences.workArrangement.includes('Remote') || 
                   userProfile.jobPreferences.workArrangement.includes('On-site'))) {
            score += workArrangementWeight * 0.5; // 50% for hybrid flexibility
        }
    }
    
    // 7. Job Type Match (5% weight)
    const jobTypeWeight = 5;
    totalWeight += jobTypeWeight;
    if (userProfile.jobPreferences && userProfile.jobPreferences.jobTypes) {
        if (userProfile.jobPreferences.jobTypes.includes(this.jobType)) {
            score += jobTypeWeight;
        }
    }
    
    // Calculate final percentage
    const matchPercentage = totalWeight > 0 ? Math.round((score / totalWeight) * 100) : 0;
    return matchPercentage;
};

module.exports = mongoose.model('Job', jobSchema);
