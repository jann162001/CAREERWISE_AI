// Run this script with: node update-test-career-path.js
// This will remove the old Software Engineer test entry and insert an updated one with stages and courses.

require('dotenv').config();
const mongoose = require('mongoose');
const CareerPath = require('./src/models/CareerPath');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/authdb';

const updatedCareerPath = {
  field: 'Software Engineer',
  title: 'Software Engineer',
  description: 'A test career path for software engineers. This entry is for testing guaranteed output.',
  skills: ['JavaScript', 'Node.js', 'React', 'MongoDB'],
  stages: [
    { title: 'Junior Software Engineer', years: '0-2 years', description: 'Entry-level, learning codebase and tools.' },
    { title: 'Software Engineer', years: '2-5 years', description: 'Building features, collaborating with team.' },
    { title: 'Senior Software Engineer', years: '5+ years', description: 'Leading projects, mentoring, code reviews.' }
  ],
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

async function updateTestCareerPath() {
  try {
    await mongoose.connect(MONGODB_URI);
    await CareerPath.deleteOne({ field: updatedCareerPath.field });
    await CareerPath.create(updatedCareerPath);
    console.log('Updated Software Engineer career path inserted successfully.');
  } catch (err) {
    console.error('Error updating test career path:', err);
  } finally {
    await mongoose.disconnect();
  }
}

updateTestCareerPath();
