import React, { useState } from 'react';

const mockAnalyzeResume = (file) => {
  // Simulate analysis result
  return {
    name: 'John Doe',
    skills: ['JavaScript', 'React', 'Node.js'],
    experience: '3 years as Frontend Developer',
    education: 'B.Sc. in Computer Science',
    summary: 'Experienced developer with strong skills in modern web technologies.'
  };
};

export default function ResumeAnalyzer({ onClose }) {
  const [resumeFile, setResumeFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setResumeFile(e.target.files[0]);
    setAnalysis(null);
  };

  const handleAnalyze = () => {
    if (!resumeFile) return;
    setLoading(true);
    setTimeout(() => {
      setAnalysis(mockAnalyzeResume(resumeFile));
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="resume-analyzer-modal">
      <div className="resume-analyzer-content">
        <h2>Resume Analyzer</h2>
        <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} />
        <button onClick={handleAnalyze} disabled={!resumeFile || loading} style={{marginTop: 16}}>
          {loading ? 'Analyzing...' : 'Analyze Resume'}
        </button>
        {analysis && (
          <div className="analysis-result" style={{marginTop: 24, background: '#f9fafb', padding: 20, borderRadius: 12}}>
            <h3>Analysis Result</h3>
            <p><strong>Name:</strong> {analysis.name}</p>
            <p><strong>Skills:</strong> {analysis.skills.join(', ')}</p>
            <p><strong>Experience:</strong> {analysis.experience}</p>
            <p><strong>Education:</strong> {analysis.education}</p>
            <p><strong>Summary:</strong> {analysis.summary}</p>
          </div>
        )}
        <button onClick={onClose} style={{marginTop: 18}}>Close</button>
      </div>
    </div>
  );
}
