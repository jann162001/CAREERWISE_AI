// Run this script with: node insert-multiple-career-paths.js
// This will insert multiple career paths (Teacher, Nurse, Accountant, etc.) with courses into your MongoDB.

require('dotenv').config();
const mongoose = require('mongoose');

const CareerPath = require('./src/models/CareerPath');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/authdb';

const careerPaths = [
  {
    field: 'Teacher',
    title: 'Teacher',
    description: 'A career path for educators and teachers.',
    skills: ['Classroom Management', 'Curriculum Development', 'Communication'],
    courses: [
      {
        name: 'Effective Teaching Strategies',
        provider: 'Coursera',
        url: 'https://www.coursera.org/learn/teaching-strategies',
        description: 'Learn modern teaching strategies.'
      },
      {
        name: 'Classroom Management Essentials',
        provider: 'Udemy',
        url: 'https://www.udemy.com/course/classroom-management/',
        description: 'Master classroom management.'
      }
    ]
  },
  {
    field: 'Nurse',
    title: 'Nurse',
    description: 'A career path for nurses and healthcare professionals.',
    skills: ['Patient Care', 'Medical Knowledge', 'Compassion'],
    courses: [
      {
        name: 'Fundamentals of Nursing',
        provider: 'edX',
        url: 'https://www.edx.org/learn/nursing',
        description: 'Learn the basics of nursing.'
      },
      {
        name: 'Patient Communication Skills',
        provider: 'Coursera',
        url: 'https://www.coursera.org/learn/patient-communication',
        description: 'Improve patient communication.'
      }
    ]
  },
  {
    field: 'Accountant',
    title: 'Accountant',
    description: 'A career path for accountants and finance professionals.',
    skills: ['Accounting', 'Financial Analysis', 'Excel'],
    courses: [
      {
        name: 'Financial Accounting Fundamentals',
        provider: 'Coursera',
        url: 'https://www.coursera.org/learn/financial-accounting-basics',
        description: 'Learn accounting fundamentals.'
      },
      {
        name: 'Excel Skills for Business',
        provider: 'edX',
        url: 'https://www.edx.org/learn/excel',
        description: 'Master Excel for business.'
      }
    ]
  }
];

async function insertCareerPaths() {
  try {
    await mongoose.connect(MONGODB_URI);
    for (const path of careerPaths) {
      const existing = await CareerPath.findOne({ field: path.field });
      if (existing) {
        console.log(`Career path for ${path.field} already exists.`);
      } else {
        await CareerPath.create(path);
        console.log(`Career path for ${path.field} inserted successfully.`);
      }
    }
  } catch (err) {
    console.error('Error inserting career paths:', err);
  } finally {
    await mongoose.disconnect();
  }
}

insertCareerPaths();
