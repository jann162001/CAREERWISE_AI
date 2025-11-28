// Run this script with: node insert-test-career-path.js
// This will insert a guaranteed test career path with courses into your MongoDB.

require('dotenv').config();
const mongoose = require('mongoose');

const CareerPath = require('./src/models/CareerPath');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/authdb';

const testCareerPath = {
  field: 'Software Engineer',
  title: 'Software Engineer',
  description: 'A test career path for software engineers. This entry is for testing guaranteed output.',
  skills: ['JavaScript', 'Node.js', 'React', 'MongoDB'],
  courses: [
    {
      name: 'JavaScript Basics',
      provider: 'Coursera',
      url: 'https://www.coursera.org/learn/javascript',
      description: 'Learn the basics of JavaScript.'
    },
    {
      name: 'Node.js Fundamentals',
      provider: 'Udemy',
      url: 'https://www.udemy.com/course/nodejs-fundamentals/',
      description: 'Master Node.js for backend development.'
    },
    {
      name: 'React for Beginners',
      provider: 'edX',
      url: 'https://www.edx.org/learn/reactjs',
      description: 'Get started with React.js.'
    },
    {
      name: 'MongoDB Essentials',
      provider: 'MongoDB University',
      url: 'https://university.mongodb.com/',
      description: 'Learn MongoDB from the source.'
    }
  ]
};

async function insertTestCareerPath() {
  try {
    await mongoose.connect(MONGODB_URI);
    const existing = await CareerPath.findOne({ field: testCareerPath.field });
    if (existing) {
      console.log('Test career path already exists.');
    } else {
      await CareerPath.create(testCareerPath);
      console.log('Test career path inserted successfully.');
    }
  } catch (err) {
    console.error('Error inserting test career path:', err);
  } finally {
    await mongoose.disconnect();
  }
}

insertTestCareerPath();
