const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');

// Admin Signup route
router.post('/signup', async (req, res) => {
    try {
        const { fullName, username, email, password } = req.body;

        // Validation
        if (!fullName || !username || !email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide all required fields' 
            });
        }

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ 
            $or: [{ email }, { username }] 
        });

        if (existingAdmin) {
            return res.status(400).json({ 
                success: false, 
                message: 'Username or email already exists' 
            });
        }

        // Create new admin
        const admin = new Admin({
            fullName,
            username,
            email,
            password
        });

        await admin.save();

        // Create session
        req.session.adminId = admin._id;
        req.session.adminUsername = admin.username;
        req.session.isAdmin = true;

        res.status(201).json({ 
            success: true, 
            message: 'Admin account created successfully',
            admin: {
                id: admin._id,
                fullName: admin.fullName,
                username: admin.username,
                email: admin.email
            }
        });
    } catch (error) {
        console.error('Admin signup error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error creating admin account. Please try again.' 
        });
    }
});

// Admin Login route
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validation
        if (!username || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide username and password' 
            });
        }

        // Find admin
        const admin = await Admin.findOne({ 
            $or: [{ username }, { email: username }] 
        });

        if (!admin) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid username or password' 
            });
        }

        // Check password
        const isMatch = await admin.comparePassword(password);

        if (!isMatch) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid username or password' 
            });
        }

        // Create session
        req.session.adminId = admin._id;
        req.session.adminUsername = admin.username;
        req.session.isAdmin = true;

        res.json({ 
            success: true, 
            message: 'Login successful',
            admin: {
                id: admin._id,
                fullName: admin.fullName,
                username: admin.username,
                email: admin.email
            }
        });
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error logging in. Please try again.' 
        });
    }
});

// Admin Logout route
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                message: 'Error logging out' 
            });
        }
        res.json({ 
            success: true, 
            message: 'Logged out successfully' 
        });
    });
});

// Get current admin
router.get('/current', async (req, res) => {
    try {
        if (!req.session.adminId) {
            return res.status(401).json({ 
                success: false, 
                message: 'Not authenticated' 
            });
        }

        const admin = await Admin.findById(req.session.adminId).select('-password');
        
        if (!admin) {
            return res.status(404).json({ 
                success: false, 
                message: 'Admin not found' 
            });
        }

        res.json({ 
            success: true, 
            admin: {
                id: admin._id,
                fullName: admin.fullName,
                username: admin.username,
                email: admin.email,
                role: admin.role,
                createdAt: admin.createdAt
            }
        });
    } catch (error) {
        console.error('Get admin error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching admin data' 
        });
    }
});

module.exports = router;
