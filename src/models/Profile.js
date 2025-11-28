const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    // Personal Information
    fullName: {
        type: String,
        required: true
    },
    profilePicture: {
        type: String // Path to uploaded profile picture
    },
    phoneNumber: {
        type: String
    },
    location: {
        city: String,
        state: String,
        country: String
    },
    
    // Professional Information
    professionalTitle: {
        type: String // e.g., "Software Developer", "Marketing Manager"
    },
    yearsOfExperience: {
        type: Number,
        default: 0
    },
    experienceLevel: {
        type: String,
        enum: ['Entry Level', 'Mid Level', 'Senior Level', 'Lead/Manager', 'Executive'],
        default: 'Entry Level'
    },
    
    // Education
    education: [{
        degree: String, // e.g., "Bachelor's", "Master's", "PhD"
        fieldOfStudy: String,
        institution: String,
        graduationYear: Number
    }],
    
    // Skills & Expertise
    skills: [{
        name: String,
        proficiency: {
            type: String,
            enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert']
        }
    }],
    
    // Work Experience
    workExperience: [{
        jobTitle: String,
        company: String,
        location: String,
        startDate: Date,
        endDate: Date,
        currentlyWorking: Boolean,
        description: String
    }],
    
    // Certifications
    certifications: [{
        name: String,
        issuingOrganization: String,
        issueDate: Date,
        expiryDate: Date
    }],
    
    // Job Preferences
    jobPreferences: {
        desiredJobTitles: [String],
        desiredIndustries: [String],
        jobTypes: [{
            type: String,
            enum: ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance']
        }],
        workArrangement: [{
            type: String,
            enum: ['On-site', 'Remote', 'Hybrid']
        }],
        willingToRelocate: {
            type: Boolean,
            default: false
        },
        expectedSalary: {
            min: Number,
            max: Number,
            currency: {
                type: String,
                default: 'USD'
            }
        }
    },
    
    // Additional Information
    languages: [{
        language: String,
        proficiency: {
            type: String,
            enum: ['Basic', 'Conversational', 'Fluent', 'Native']
        }
    }],
    resume: {
        filename: String,
        fileUrl: String,
        uploadedAt: Date
    },
    portfolio: {
        type: String // URL
    },
    linkedin: {
        type: String // URL
    },
    github: {
        type: String // URL
    },
    
    // Saved Jobs
    savedJobs: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job'
    }],
    
    // Profile Status
    profileCompletion: {
        type: Number,
        default: 0 // Percentage
    },
    isPublic: {
        type: Boolean,
        default: true
    },
    
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
profileSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Calculate profile completion percentage
profileSchema.methods.calculateCompletion = function() {
    let score = 0;
    const weights = {
        basicInfo: 15,      // fullName, phoneNumber, location
        professional: 15,   // professionalTitle, yearsOfExperience
        education: 10,
        skills: 15,
        workExperience: 15,
        certifications: 5,
        jobPreferences: 15,
        additional: 10      // languages, resume, portfolio
    };
    
    // Basic Info
    if (this.fullName && this.phoneNumber && this.location.city) {
        score += weights.basicInfo;
    }
    
    // Professional
    if (this.professionalTitle && this.yearsOfExperience >= 0) {
        score += weights.professional;
    }
    
    // Education
    if (this.education && this.education.length > 0) {
        score += weights.education;
    }
    
    // Skills
    if (this.skills && this.skills.length >= 3) {
        score += weights.skills;
    }
    
    // Work Experience
    if (this.workExperience && this.workExperience.length > 0) {
        score += weights.workExperience;
    }
    
    // Certifications
    if (this.certifications && this.certifications.length > 0) {
        score += weights.certifications;
    }
    
    // Job Preferences
    if (this.jobPreferences.desiredJobTitles && this.jobPreferences.desiredJobTitles.length > 0) {
        score += weights.jobPreferences;
    }
    
    // Additional
    let additionalCount = 0;
    if (this.languages && this.languages.length > 0) additionalCount++;
    if (this.resume && this.resume.fileUrl) additionalCount++;
    if (this.portfolio || this.linkedin || this.github) additionalCount++;
    if (additionalCount >= 2) {
        score += weights.additional;
    }
    
    this.profileCompletion = score;
    return score;
};

module.exports = mongoose.model('Profile', profileSchema);
