require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cors = require('cors');
const passport = require('../src/config/passport');
const serverless = require('serverless-http');

const app = express();

app.use(cors({
    origin: function(origin, callback) {
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:3001',
            'http://localhost:3002',
            'https://career-deploy-liard.vercel.app'
        ];
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/authdb',
        collectionName: 'sessions',
        ttl: 24 * 60 * 60
    }),
    cookie: {
        secure: false,
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000
    }
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/authdb')
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

const authRoutes = require('../src/routes/auth');
const adminRoutes = require('../src/routes/admin');
const jobRoutes = require('../src/routes/jobs');
const profileRoutes = require('../src/routes/profiles');
const applicationRoutes = require('../src/routes/applications');
const messageRoutes = require('../src/routes/messages');
const profileViewRoutes = require('../src/routes/profileViews');
const interviewRoutes = require('../src/routes/interviews');
const reportRoutes = require('../src/routes/reports');
const resumeAnalysisRoutes = require('../src/routes/resumeAnalysis');
const careerPathsRoutes = require('../src/routes/careerPaths');
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/profile-views', profileViewRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api', resumeAnalysisRoutes);

app.use('/api/career-paths', careerPathsRoutes);

// Health check route for Vercel serverless
app.get('/', (req, res) => {
    res.send('API is running');
});

module.exports = serverless(app);
