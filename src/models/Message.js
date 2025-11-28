const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    participants: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'participants.userType'
        },
        userType: {
            type: String,
            enum: ['User', 'Admin']
        },
        username: String
    }],
    job: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job'
    },
    application: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Application'
    },
    messages: [{
        sender: {
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                refPath: 'messages.sender.userType'
            },
            userType: {
                type: String,
                enum: ['User', 'Admin']
            },
            username: String
        },
        content: String,
        timestamp: {
            type: Date,
            default: Date.now
        },
        read: {
            type: Boolean,
            default: false
        }
    }],
    lastMessage: {
        content: String,
        timestamp: Date
    },
    unreadCount: {
        user: {
            type: Number,
            default: 0
        },
        admin: {
            type: Number,
            default: 0
        }
    }
}, {
    timestamps: true
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
