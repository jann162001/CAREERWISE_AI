// src/models/ResumeAnalysis.js
// Mongoose model for storing resume analysis results
const mongoose = require('mongoose');

const ResumeAnalysisSchema = new mongoose.Schema({
  filename: String,
  uploadedAt: { type: Date, default: Date.now },
  analysis: mongoose.Schema.Types.Mixed,
  atsScore: Number,
  matchScore: { type: Number, default: null },
  summary: String,
  skills: [String]
}, { collection: 'resume_analyses' });

module.exports = mongoose.model('ResumeAnalysis', ResumeAnalysisSchema);