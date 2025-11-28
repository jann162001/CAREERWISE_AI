// Usage: node seed-career-paths.js
require('dotenv').config();
const mongoose = require('mongoose');
const CareerPath = require('./src/models/CareerPath');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/authdb';


const paths = [
  {
    field: 'Software Engineer',
    stages: [
      { title: 'Junior Developer', years: '0-2 years', description: 'Entry-level, learning codebase and tools.' },
      { title: 'Developer', years: '2-4 years', description: 'Building features, fixing bugs, collaborating with team.' },
      { title: 'Senior Developer', years: '4-7 years', description: 'Leading projects, mentoring, code reviews.' },
      { title: 'Tech Lead', years: '7+ years', description: 'Architecting systems, technical leadership.' },
      { title: 'Engineering Manager', years: '8+ years', description: 'Managing teams, project delivery, hiring.' }
    ],
    courses: [
      { name: 'CS50: Introduction to Computer Science', provider: 'edX/Harvard', url: 'https://www.edx.org/course/cs50s-introduction-to-computer-science' },
      { name: 'Full-Stack Web Development with React', provider: 'Coursera', url: 'https://www.coursera.org/specializations/full-stack-react' },
      { name: 'Algorithms, Part I', provider: 'Coursera/Princeton', url: 'https://www.coursera.org/learn/algorithms-part1' }
    ]
  },
  {
    field: 'Marketing',
    stages: [
      { title: 'Marketing Assistant', years: '0-2 years', description: 'Supporting campaigns, learning basics.' },
      { title: 'Marketing Specialist', years: '2-4 years', description: 'Running campaigns, analytics, content.' },
      { title: 'Marketing Manager', years: '4-7 years', description: 'Strategy, team leadership, budget.' },
      { title: 'Director of Marketing', years: '7+ years', description: 'Department leadership, high-level strategy.' }
    ],
    courses: [
      { name: 'Digital Marketing Specialization', provider: 'Coursera/Illinois', url: 'https://www.coursera.org/specializations/digital-marketing' },
      { name: 'Google Analytics Academy', provider: 'Google', url: 'https://analytics.google.com/analytics/academy/' },
      { name: 'Content Marketing Certification', provider: 'HubSpot', url: 'https://academy.hubspot.com/courses/content-marketing' }
    ]
  },
  {
    field: 'Sales',
    stages: [
      { title: 'Sales Representative', years: '0-2 years', description: 'Prospecting, learning products.' },
      { title: 'Account Executive', years: '2-5 years', description: 'Closing deals, managing accounts.' },
      { title: 'Sales Manager', years: '5-8 years', description: 'Team management, sales strategy.' },
      { title: 'Director of Sales', years: '8+ years', description: 'Sales leadership, revenue targets.' }
    ],
    courses: [
      { name: 'Sales Training: Building Your Sales Career', provider: 'LinkedIn Learning', url: 'https://www.linkedin.com/learning/sales-training-building-your-sales-career' },
      { name: 'Negotiation Fundamentals', provider: 'edX/University of Michigan', url: 'https://www.edx.org/course/negotiation-fundamentals' },
      { name: 'HubSpot Sales Software Certification', provider: 'HubSpot', url: 'https://academy.hubspot.com/courses/sales-software' }
    ]
  }
];

async function seed() {
  await mongoose.connect(MONGODB_URI);
  await CareerPath.deleteMany({});
  await CareerPath.insertMany(paths);
  console.log('Career paths seeded!');
  await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
