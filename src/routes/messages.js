const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const Admin = require('../models/Admin');

// POST /api/messages/start - Start or get existing conversation
router.post('/start', async (req, res) => {
    try {
        const { userId, adminId, applicationId, jobId } = req.body;

        // Check if conversation already exists between these participants
        let conversation = await Message.findOne({
            'participants.userId': { $all: [userId, adminId] }
        }).populate('job', 'jobTitle company')
          .populate('application', 'status');

        if (conversation) {
            return res.json({ conversation, isNew: false });
        }

        // Get user and admin details
        const user = await User.findById(userId);
        const admin = await Admin.findById(adminId);

        if (!user || !admin) {
            return res.status(404).json({ message: 'User or Admin not found' });
        }

        // Create new conversation
        conversation = new Message({
            participants: [
                {
                    userId: userId,
                    userType: 'User',
                    username: user.username || user.fullName
                },
                {
                    userId: adminId,
                    userType: 'Admin',
                    username: admin.username || admin.fullName
                }
            ],
            job: jobId || null,
            application: applicationId || null,
            messages: [],
            lastMessage: {
                content: 'Conversation started',
                timestamp: new Date()
            },
            unreadCount: {
                user: 0,
                admin: 0
            }
        });

        await conversation.save();

        // Populate fields before sending
        conversation = await Message.findById(conversation._id)
            .populate('job', 'jobTitle company')
            .populate('application', 'status');

        res.status(201).json({ conversation, isNew: true });
    } catch (error) {
        console.error('❌ Error starting conversation:', error);
        res.status(500).json({ message: 'Error starting conversation', error: error.message });
    }
});

// GET /api/messages/conversations/:userId - Get all conversations for a user
router.get('/conversations/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { userType } = req.query; // 'User' or 'Admin'

        let query;
        if (userType === 'Admin') {
            // Admin sees all conversations where they are a participant
            query = { 
                'participants': { 
                    $elemMatch: { 
                        userId: userId, 
                        userType: 'Admin' 
                    } 
                } 
            };
        } else {
            // User sees only their conversations
            query = { 
                'participants': { 
                    $elemMatch: { 
                        userId: userId, 
                        userType: 'User' 
                    } 
                } 
            };
        }

        const conversations = await Message.find(query)
            .populate('job', 'jobTitle company')
            .populate('application', 'status')
            .sort({ 'lastMessage.timestamp': -1 });

        // Get participant details for each conversation
        const conversationsWithDetails = await Promise.all(conversations.map(async (conv) => {
            const convObj = conv.toObject();
            
            // Find the other participant (not the current user)
            const otherParticipant = convObj.participants.find(p => 
                p.userId && p.userId.toString() !== userId
            );
            
            if (otherParticipant) {
                // Fetch full user/admin details
                let participantDetails;
                if (otherParticipant.userType === 'User') {
                    const User = require('../models/User');
                    participantDetails = await User.findById(otherParticipant.userId).select('username fullName email');
                } else {
                    const Admin = require('../models/Admin');
                    participantDetails = await Admin.findById(otherParticipant.userId).select('username fullName email');
                }
                
                convObj.otherParticipant = {
                    ...otherParticipant,
                    details: participantDetails
                };
            }
            
            return convObj;
        }));

        res.json(conversationsWithDetails);
    } catch (error) {
        console.error('❌ Error fetching conversations:', error);
        res.status(500).json({ message: 'Error fetching conversations', error: error.message });
    }
});

// GET /api/messages/conversation/:conversationId - Get specific conversation with messages
router.get('/conversation/:conversationId', async (req, res) => {
    try {
        const { conversationId } = req.params;

        const conversation = await Message.findById(conversationId)
            .populate('job', 'title company location')
            .populate('application', 'status resume');

        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found' });
        }

        res.json(conversation);
    } catch (error) {
        console.error('❌ Error fetching conversation:', error);
        res.status(500).json({ message: 'Error fetching conversation', error: error.message });
    }
});

// POST /api/messages/conversation/:conversationId/send - Send a message in conversation
router.post('/conversation/:conversationId/send', async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { senderId, senderType, senderUsername, content } = req.body;

        const conversation = await Message.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found' });
        }

        const newMessage = {
            sender: {
                userId: senderId,
                userType: senderType,
                username: senderUsername
            },
            content,
            timestamp: new Date(),
            read: false
        };

        conversation.messages.push(newMessage);
        conversation.lastMessage = {
            content,
            timestamp: new Date()
        };

        // Update unread count
        if (senderType === 'User') {
            conversation.unreadCount.admin += 1;
        } else {
            conversation.unreadCount.user += 1;
        }

        await conversation.save();

        res.status(201).json({
            message: 'Message sent successfully',
            conversation
        });
    } catch (error) {
        console.error('❌ Error sending message:', error);
        res.status(500).json({ message: 'Error sending message', error: error.message });
    }
});

// PUT /api/messages/conversation/:conversationId/read - Mark messages as read
router.put('/conversation/:conversationId/read', async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { userType } = req.body; // 'User' or 'Admin'

        const conversation = await Message.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found' });
        }

        // Mark all messages from the other party as read
        conversation.messages.forEach(msg => {
            if (msg.sender.userType !== userType && !msg.read) {
                msg.read = true;
            }
        });

        // Reset unread count for this user
        if (userType === 'User') {
            conversation.unreadCount.user = 0;
        } else {
            conversation.unreadCount.admin = 0;
        }

        await conversation.save();

        res.json({
            message: 'Messages marked as read',
            conversation
        });
    } catch (error) {
        console.error('❌ Error marking messages as read:', error);
        res.status(500).json({ message: 'Error marking messages as read', error: error.message });
    }
});

// GET /api/messages/unread/:userId - Get unread message count
router.get('/unread/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { userType } = req.query;

        let query;
        if (userType === 'Admin') {
            query = { 'participants.userType': 'Admin', 'unreadCount.admin': { $gt: 0 } };
        } else {
            query = { 'participants.userId': userId, 'participants.userType': 'User', 'unreadCount.user': { $gt: 0 } };
        }

        const conversations = await Message.find(query);
        const totalUnread = conversations.reduce((sum, conv) => {
            return sum + (userType === 'Admin' ? conv.unreadCount.admin : conv.unreadCount.user);
        }, 0);

        res.json({ unreadCount: totalUnread, conversations: conversations.length });
    } catch (error) {
        console.error('❌ Error fetching unread count:', error);
        res.status(500).json({ message: 'Error fetching unread count', error: error.message });
    }
});

module.exports = router;
