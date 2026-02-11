import React, { useState } from 'react';

function ResumeAnalyzerTab({ userId }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

  // Try all possible userId fields
  const getUserId = () => {
    if (userId) return userId;
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      return user?.userId || user?._id || user?.id || '';
    } catch {
      return '';
    }
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    setResult(null);
    setError(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    const uid = getUserId();
    if (!uid) {
      setError('User ID not found. Please log in again.');
      return;
    }
    setUploading(true);
    setError(null);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('resume', selectedFile);
      formData.append('userId', uid);
      const res = await fetch(`${API_URL}/profiles/upload-resume`, {
        method: 'POST',
        headers: {
          'x-user-id': uid,
        },
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
      } else {
        setError(data.message || data.error || 'Upload failed');
      }
    } catch (err) {
      setError('Network error');
    }
    setUploading(false);
  };

  return (
    <div className="resume-analyzer-tab">
      <h3>Resume Analyzer</h3>
      <input type="file" accept="application/pdf" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={uploading || !selectedFile}>
        {uploading ? 'Uploading...' : 'Upload & Analyze'}
      </button>
      {error && <div className="error">{error}</div>}
      {result && (
        <div className="result">
          <h4>Analysis Result</h4>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default ResumeAnalyzerTab;
