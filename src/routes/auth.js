const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { createOTP, sendEmailOTP, sendSMSOTP, verifyOTP, incrementAttempt } = require('../utils/otpService');
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

// Request OTP for Signup
router.post('/request-otp-signup', async (req, res) => {
    try {
        const { email, phoneNumber } = req.body;

        if (!email && !phoneNumber) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email or phone number'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [
                email ? { email } : null,
                phoneNumber ? { phoneNumber } : null
            ].filter(Boolean)
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email or phone number already registered'
            });
        }

        // Create OTP
        const otpResult = await createOTP({
            email,
            phoneNumber,
            purpose: 'signup'
        });

        if (!otpResult.success) {
            return res.status(500).json(otpResult);
        }

        // Send OTP
        if (email) {
            await sendEmailOTP(email, otpResult.otp, 'signup');
        }
        if (phoneNumber) {
            await sendSMSOTP(phoneNumber, otpResult.otp, 'signup');
        }

        res.json({
            success: true,
            message: 'OTP sent successfully',
            email,
            phoneNumber
        });
    } catch (error) {
        console.error('❌ Request OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send OTP'
        });
    }
});

// Verify OTP for Signup
router.post('/verify-otp-signup', async (req, res) => {
    try {
        const { email, phoneNumber, otp } = req.body;

        if (!otp) {
            return res.status(400).json({
                success: false,
                message: 'Please provide OTP'
            });
        }

        // Verify OTP
        const verifyResult = await verifyOTP({
            email,
            phoneNumber,
            otp,
            purpose: 'signup'
        });

        if (!verifyResult.success) {
            await incrementAttempt({ email, phoneNumber, otp });
            return res.status(400).json(verifyResult);
        }

        res.json({
            success: true,
            message: 'OTP verified successfully. Please complete your registration.'
        });
    } catch (error) {
        console.error('❌ Verify OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify OTP'
        });
    }
});

// Request OTP for Login
router.post('/request-otp-login', async (req, res) => {
    try {
        const { email, phoneNumber } = req.body;

        if (!email && !phoneNumber) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email or phone number'
            });
        }

        // Find user
        const user = await User.findOne({
            $or: [
                email ? { email } : null,
                phoneNumber ? { phoneNumber } : null
            ].filter(Boolean)
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Create OTP
        const otpResult = await createOTP({
            userId: user._id,
            email: user.email,
            phoneNumber: user.phoneNumber,
            purpose: 'login'
        });

        if (!otpResult.success) {
            return res.status(500).json(otpResult);
        }

        // Send OTP
        await sendEmailOTP(user.email, otpResult.otp, 'login');
        if (user.phoneNumber) {
            await sendSMSOTP(user.phoneNumber, otpResult.otp, 'login');
        }

        res.json({
            success: true,
            message: 'OTP sent to your registered email/phone',
            email: user.email,
            phoneNumber: user.phoneNumber ? '***' + user.phoneNumber.slice(-4) : null
        });
    } catch (error) {
        console.error('❌ Request login OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send OTP'
        });
    }
});

// Verify OTP for Login
router.post('/verify-otp-login', async (req, res) => {
    try {
        const { email, phoneNumber, otp } = req.body;

        if (!otp) {
            return res.status(400).json({
                success: false,
                message: 'Please provide OTP'
            });
        }

        // Verify OTP
        const verifyResult = await verifyOTP({
            email,
            phoneNumber,
            otp,
            purpose: 'login'
        });

        if (!verifyResult.success) {
            await incrementAttempt({ email, phoneNumber, otp });
            return res.status(400).json(verifyResult);
        }

        // Find user
        const user = await User.findOne({
            $or: [
                email ? { email } : null,
                phoneNumber ? { phoneNumber } : null
            ].filter(Boolean)
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

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
        console.error('❌ Verify login OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify OTP'
        });
    }
});

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
