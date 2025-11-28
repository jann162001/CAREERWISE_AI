// POST /api/career-paths/:field/personalized
// Expects { skills: [string], education: [string] } in body

const express = require('express');
const CareerPath = require('../models/CareerPath');
const router = express.Router();

router.post('/:field/personalized', async (req, res) => {
  try {
    const field = req.params.field;
    const { skills = [], education = [] } = req.body;
    // Find the career path (case-insensitive, partial/fuzzy match)
    // Try exact match first
    let doc = await CareerPath.findOne({ field: { $regex: `^${field}$`, $options: 'i' } });
    // If not found, try partial match (e.g., 'Software Developer' matches 'Software Engineer')
    if (!doc) {
      doc = await CareerPath.findOne({ field: { $regex: field, $options: 'i' } });
    }
    // If still not found, try matching any word in the field
    if (!doc) {
      const words = field.split(/\s+/).filter(Boolean);
      if (words.length > 0) {
        doc = await CareerPath.findOne({
          $or: words.map(word => ({ field: { $regex: word, $options: 'i' } }))
        });
      }
    }
    if (!doc) return res.status(404).json({ error: 'Career path not found' });

    if (!Array.isArray(doc.courses) || doc.courses.length === 0) {
      return res.json({ ...doc.toObject(), recommendedForSkillGaps: [], furtherLearning: [] });
    }

    // Always return all courses as recommended, regardless of skill match
    res.json({ ...doc.toObject(), recommendedForSkillGaps: doc.courses, furtherLearning: [] });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/career-path/:field
router.get('/:field', async (req, res) => {
  try {
    const field = req.params.field;
    // Use case-insensitive regex for matching field
    const doc = await CareerPath.findOne({ field: { $regex: `^${field}$`, $options: 'i' } });
    if (!doc) return res.status(404).json({ error: 'Career path not found' });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/career-paths (all)
router.get('/', async (req, res) => {
  try {
    const docs = await CareerPath.find();
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
