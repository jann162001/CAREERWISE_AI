const express = require('express');
const router = express.Router();
const User = require('../models/User');
const passport = require('../config/passport');

// Google OAuth routes
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication
    req.session.userId = req.user._id;
    req.session.username = req.user.username;
    res.redirect('http://localhost:3003'); // Redirect to React app (landing page)
  }
);

// ...removed OTP signup route...

// ...removed OTP signup verification route...

// ...removed OTP login route...

// ...removed OTP login verification route...

// Signup route
router.post('/signup', async (req, res) => {
    try {
        console.log('📝 Signup attempt:', { fullName: req.body.fullName, username: req.body.username, email: req.body.email, role: req.body.role });
        const { fullName, username, email, password, role } = req.body;

        // Validation
        if (!fullName || !username || !email || !password) {
            console.log('❌ Validation failed - missing fields');
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide all required fields' 
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ 
            $or: [{ email }, { username }] 
        });

        if (existingUser) {
            console.log('❌ User already exists:', existingUser.username);
            return res.status(400).json({ 
                success: false, 
                message: 'Username or email already exists' 
            });
        }

        // Create new user
        const user = new User({
            fullName,
            username,
            email,
            password,
            role: role || 'User' // Default to 'User' if not provided
        });

        await user.save();
        console.log('✅ User created successfully:', user.username);

        // Create session
        req.session.userId = user._id;
        req.session.username = user.username;

        res.status(201).json({ 
            success: true, 
            message: 'Account created successfully',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                fullName: user.fullName,
                role: user.role
            }
        });
    } catch (error) {
        console.error('❌ Signup error:', error.message);
        console.error('Full error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error creating account. Please try again.' 
        });
    }
});

// Login route
router.post('/login', async (req, res) => {
    try {
        console.log('🔐 Login attempt:', { email: req.body.email, username: req.body.username });
        const { username, email, password } = req.body;

        // Validation
        if ((!username && !email) || !password) {
            console.log('❌ Validation failed - missing credentials');
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide email/username and password' 
            });
        }

        // Find user by username or email
        const user = await User.findOne({ 
            $or: [{ username: username || email }, { email: email || username }] 
        });

        if (!user) {
            console.log('❌ User not found');
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid username or password' 
            });
        }

        console.log('👤 User found:', user.username);

        // Check password
        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            console.log('❌ Password mismatch');
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid username or password' 
            });
        }

        console.log('✅ Login successful:', user.username);

        // Create session
        req.session.userId = user._id;
        req.session.username = user.username;

        res.json({ 
            success: true, 
            message: 'Login successful',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                fullName: user.fullName,
                role: user.role
            }
        });
    } catch (error) {
        console.error('❌ Login error:', error.message);
        console.error('Full error:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ 
            success: false, 
            message: 'An error occurred. Please try again.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Logout route
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

// Get current user
router.get('/user', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ 
                success: false, 
                message: 'Not authenticated' 
            });
        }

        const user = await User.findById(req.session.userId).select('-password');
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        res.json({ 
            success: true, 
            user: {
                id: user._id,
                fullName: user.fullName,
                username: user.username,
                email: user.email,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching user data' 
        });
    }
});

module.exports = router;
