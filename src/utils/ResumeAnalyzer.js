const fs = require('fs');
const pdfParse = require('pdf-parse');

/**
 * Reads and analyzes a PDF resume file.
 * @param {string} filePath - Path to the uploaded PDF resume.
 * @returns {Promise<Object>} Analysis result with extracted text and basic info.
 */
async function analyzeResume(filePath) {
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);
    const { text, info, metadata } = pdfData;
    const wordCount = text.split(/\s+/).length;
    const sections = {};
    const sectionNames = ['Education', 'Experience', 'Skills', 'Projects', 'Certifications', 'Contact'];
    sectionNames.forEach(section => {
        const regex = new RegExp(section + ':?', 'i');
        sections[section] = regex.test(text);
    });

    // --- Cohere AI Integration ---
    const cohereApiKey = process.env.COHERE_API_KEY || 'DCEsndJTXUPph0wTmWd5SUil7HWLhJGWQkQsX3hO';
    let cohereResult = null;
    try {
        const fetch = require('node-fetch');
        const response = await fetch('https://api.cohere.ai/v1/summarize', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${cohereApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text,
                length: 'medium',
                format: 'paragraph',
                model: 'summarize-xlarge',
                additional_command: 'Extract key skills and provide a summary for a resume.'
            })
        });
        const cohereData = await response.json();
        cohereResult = cohereData;
    } catch (err) {
        cohereResult = { error: err.message };
    }

    return {
        text,
        wordCount,
        sections,
        info,
        metadata,
        cohere: cohereResult
    };
}

module.exports = { analyzeResume };
