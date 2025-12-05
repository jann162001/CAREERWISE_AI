const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const fetch = require('node-fetch');
const ResumeAnalysis = require('../models/ResumeAnalysis');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Helper: sanitize text (collapse whitespace)
function sanitizeText(text) {
  let sanitized = text.replace(/\s+/g, ' ').trim();
  // TODO: Redact emails/phones if user does not consent to send to OpenAI
  return sanitized;
}

// Helper: extract JSON from LLM reply
function extractJson(str) {
  const match = str.match(/{[\s\S]*}/);
  if (!match) throw new Error('No JSON object found in LLM reply');
  return JSON.parse(match[0]);
}

// POST /api/analyze
router.post('/analyze', upload.single('resumeFile'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    if (!req.file.originalname.endsWith('.pdf')) return res.status(400).json({ error: 'Only PDF files are accepted' });

    // Extract PDF text
    const pdfData = await pdfParse(req.file.buffer);
    if (!pdfData.text || !pdfData.text.trim()) {
      return res.status(400).json({ error: 'No extractable text found in PDF' });
    }
    const resumeText = sanitizeText(pdfData.text);

    // Prepare prompt for LLM
    const jobDescription = req.body.jobDescription || '';
    const prompt = `\nYou are a resume analysis AI. Given the following resume text${jobDescription ? ' and job description' : ''}, return ONLY a JSON object matching this schema (no extra text):\n\n{\n  "fullName": string|null,\n  "contact": { "email": string|null, "phone": string|null, "location": string|null },\n  "summary": string|null,\n  "skills": [string],\n  "education": [{ "institution": string|null, "degree": string|null, "startYear": string|null, "endYear": string|null }],\n  "workExperience": [{ "title": string|null, "company": string|null, "startDate": string|null, "endDate": string|null, "bullets": [string] }],\n  "certifications": [string],\n  "atsScore": number,\n  "matchScore": number|null,\n  "strengths": [string],\n  "weaknesses": [string],\n  "improvements": [string]\n}\n\nResume:\n\"\"\"${resumeText}\"\"\"\n${jobDescription ? `Job Description:\n\"\"\"${jobDescription}\"\"\"` : ''}\n`;

    // Call OpenAI or fallback to mock
    let analysisJson, rawReply;
    if (process.env.OPENAI_API_KEY) {
      const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.0,
          max_tokens: 900
        })
      });
      const data = await openaiRes.json();
      rawReply = data.choices?.[0]?.message?.content || '';
      try {
        analysisJson = extractJson(rawReply);
      } catch (e) {
        return res.status(500).json({ error: 'Failed to parse LLM JSON', rawReply });
      }
    } else {
      // Fallback: mock analysis for dev/test
      analysisJson = {
        fullName: "Jane Doe",
        contact: { email: "jane@example.com", phone: "555-1234", location: "New York" },
        summary: "Experienced software engineer.",
        skills: ["JavaScript", "React", "Node.js"],
        education: [{ institution: "State University", degree: "BSc Computer Science", startYear: "2015", endYear: "2019" }],
        workExperience: [{ title: "Developer", company: "TechCorp", startDate: "2019-06", endDate: "2022-08", bullets: ["Built web apps", "Led a team"] }],
        certifications: ["AWS Certified Developer"],
        atsScore: 85,
        matchScore: null,
        strengths: ["Problem solving", "Teamwork"],
        weaknesses: ["Impatience"],
        improvements: ["Add more leadership examples", "Highlight recent projects"]
      };
      rawReply = JSON.stringify(analysisJson, null, 2);
    }

    // Validate required fields
    if (!analysisJson || typeof analysisJson !== 'object' || !('atsScore' in analysisJson)) {
      return res.status(500).json({ error: 'Invalid analysis JSON', rawReply });
    }

    // Save to MongoDB
    const doc = await ResumeAnalysis.create({
      filename: req.file.originalname,
      analysis: analysisJson,
      atsScore: analysisJson.atsScore,
      matchScore: analysisJson.matchScore,
      summary: analysisJson.summary,
      skills: analysisJson.skills
    });

    res.json({ id: doc._id, analysis: analysisJson, resumeText });
  } catch (err) {
    console.error('Error in /api/analyze:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// GET /api/analysis/:id
router.get('/analysis/:id', async (req, res) => {
  try {
    const doc = await ResumeAnalysis.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Analysis not found' });
    res.json({
      id: doc._id,
      filename: doc.filename,
      uploadedAt: doc.uploadedAt,
      analysis: doc.analysis,
      atsScore: doc.atsScore,
      matchScore: doc.matchScore,
      summary: doc.summary,
      skills: doc.skills
    });
  } catch (err) {
    res.status(400).json({ error: 'Invalid ID' });
  }
});

module.exports = router;
