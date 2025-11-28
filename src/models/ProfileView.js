const mongoose = require('mongoose');

const profileViewSchema = new mongoose.Schema({
    profileOwner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    viewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true
    },
    viewerName: {
        type: String,
        required: true
    },
    viewerType: {
        type: String,
        enum: ['Admin', 'Recruiter'],
        default: 'Admin'
    },
    viewedAt: {
        type: Date,
        default: Date.now
    },
    application: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Application'
    }
});

// Index for faster queries
profileViewSchema.index({ profileOwner: 1, viewedAt: -1 });

module.exports = mongoose.model('ProfileView', profileViewSchema);
