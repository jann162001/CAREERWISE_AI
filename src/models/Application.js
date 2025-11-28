const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    job: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
        required: true
    },
    status: {
        type: String,
        enum: ['New', 'Under Review', 'Shortlisted', 'For Interview', 'Interviewed', 'For Job Offer', 'Hired', 'Rejected', 'Withdrawn'],
        default: 'New'
    },
    coverLetter: {
        type: String,
        maxlength: 2000
    },
    resume: {
        filename: String,
        fileUrl: String,
        uploadedAt: Date
    },
    portfolio: {
        type: String,
        maxlength: 500
    },
    expectedSalary: {
        type: String,
        maxlength: 100
    },
    availableStartDate: {
        type: Date
    },
    appliedDate: {
        type: Date,
        default: Date.now
    },
    reviewedDate: {
        type: Date
    },
    interviewDate: {
        type: Date
    },
    interviewLocation: {
        type: String,
        maxlength: 300
    },
    interviewNotes: {
        type: String,
        maxlength: 1000
    },
    notes: [{
        author: {
            type: String,
            required: true
        },
        content: {
            type: String,
            required: true,
            maxlength: 1000
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    timeline: [{
        action: {
            type: String,
            required: true
        },
        by: {
            type: String,
            required: true
        },
        date: {
            type: Date,
            default: Date.now
        },
        details: String
    }]
}, {
    timestamps: true
});

// Add timeline entry on status change
applicationSchema.pre('save', function(next) {
    if (this.isModified('status') && !this.isNew) {
        this.timeline.push({
            action: `Status changed to ${this.status}`,
            by: 'Admin',
            date: new Date(),
            details: `Application status updated`
        });
    }
    next();
});

const Application = mongoose.model('Application', applicationSchema);

module.exports = Application;
