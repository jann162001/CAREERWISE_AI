const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
    application: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Application',
        required: true
    },
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
    scheduledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true
    },
    scheduledByName: {
        type: String,
        required: true
    },
    interviewDate: {
        type: Date,
        required: true
    },
    interviewLocation: {
        type: String,
        maxlength: 300
    },
    interviewNotes: {
        type: String,
        maxlength: 1000
    },
    status: {
        type: String,
        enum: ['Scheduled', 'Completed', 'Cancelled', 'Rescheduled'],
        default: 'Scheduled'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for efficient queries
interviewSchema.index({ user: 1, createdAt: -1 });
interviewSchema.index({ application: 1 });

module.exports = mongoose.model('Interview', interviewSchema);
