// src/ResumeAnalyzer.js
import React, { useState } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

function ResumeAnalyzer() {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');
  const [analysisId, setAnalysisId] = useState('');
  const [fetchId, setFetchId] = useState('');
  const [rawJsonOpen, setRawJsonOpen] = useState(false);

  const handleFileChange = e => {
    setFile(e.target.files[0]);
    setError('');
    setAnalysis(null);
  };

  const handleAnalyze = async () => {
    if (!file) return setError('Please select a PDF file.');
    setLoading(true); setError(''); setAnalysis(null);
    try {
      const formData = new FormData();
      formData.append('resumeFile', file);
      if (jobDescription) formData.append('jobDescription', jobDescription);

      const res = await fetch(`${API_URL}/analyze`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');
      setAnalysis(data.analysis);
      setAnalysisId(data.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchById = async () => {
    if (!fetchId) return;
    setLoading(true); setError(''); setAnalysis(null);
    try {
      const res = await fetch(`${API_URL}/analysis/${fetchId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Fetch failed');
      setAnalysis(data.analysis);
      setAnalysisId(data.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '2rem auto', padding: 24, border: '1px solid #eee', borderRadius: 8, background: '#fafbfc' }}>
      <h2>PDF Resume Analyzer</h2>
      <input
        type="file"
        accept=".pdf"
        onChange={handleFileChange}
        disabled={loading}
        style={{ marginBottom: 8 }}
      />
      {file && <div>Selected: {file.name}</div>}
      <textarea
        placeholder="Optional: Paste job description here"
        value={jobDescription}
        onChange={e => setJobDescription(e.target.value)}
        rows={3}
        style={{ width: '100%', margin: '8px 0' }}
        disabled={loading}
      />
      <button onClick={handleAnalyze} disabled={loading || !file} style={{ marginBottom: 12 }}>
        {loading ? 'Analyzing...' : 'Analyze Resume'}
      </button>
      {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}

      {analysis && (
        <div style={{ marginTop: 16 }}>
          <div>
            <b>Analysis ID:</b> {analysisId}
            <br />
            <b>ATS Score:</b>
            <div style={{ background: '#eee', borderRadius: 4, width: 200, margin: '4px 0' }}>
              <div style={{
                width: `${Math.min(100, analysis.atsScore)}%`,
                background: '#4caf50',
                color: '#fff',
                padding: '2px 8px',
                borderRadius: 4
              }}>{analysis.atsScore}</div>
            </div>
            <b>Full Name:</b> {analysis.fullName || <i>Not found</i>}
            <br />
            <b>Summary:</b> {analysis.summary}
            <br />
            <b>Skills:</b> {analysis.skills && analysis.skills.map((s, i) =>
              <span key={i} style={{
                display: 'inline-block', background: '#e0f7fa', color: '#00796b',
                borderRadius: 12, padding: '2px 10px', margin: '2px 4px', fontSize: 13
              }}>{s}</span>
            )}
            <br />
            <b>Work Experience:</b>
            <ul>
              {analysis.workExperience && analysis.workExperience.map((exp, i) => (
                <li key={i}>
                  <b>{exp.title}</b> at <b>{exp.company}</b> ({exp.startDate} - {exp.endDate})
                  <ul>
                    {exp.bullets && exp.bullets.map((b, j) => <li key={j}>{b}</li>)}
                  </ul>
                </li>
              ))}
            </ul>
            <b>Improvements:</b>
            <ul>
              {analysis.improvements && analysis.improvements.map((imp, i) => <li key={i}>{imp}</li>)}
            </ul>
            <button onClick={() => setRawJsonOpen(v => !v)} style={{ margin: '8px 0' }}>
              {rawJsonOpen ? 'Hide' : 'Show'} Raw JSON
            </button>
            {rawJsonOpen && (
              <pre style={{ background: '#f5f5f5', padding: 8, borderRadius: 4, maxHeight: 200, overflow: 'auto' }}>
                {JSON.stringify(analysis, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}

      <hr style={{ margin: '24px 0' }} />
      <div>
        <b>View Previous Analysis by ID:</b>
        <input
          type="text"
          placeholder="Enter analysis ID"
          value={fetchId}
          onChange={e => setFetchId(e.target.value)}
          style={{ margin: '0 8px' }}
          disabled={loading}
        />
        <button onClick={handleFetchById} disabled={loading || !fetchId}>Fetch</button>
      </div>
      <div style={{ marginTop: 16 }}>
        <button onClick={() => { setFile(null); setAnalysis(null); setError(''); setJobDescription(''); setAnalysisId(''); }}>
          Start Over
        </button>
      </div>
    </div>
  );
}

export default ResumeAnalyzer;
