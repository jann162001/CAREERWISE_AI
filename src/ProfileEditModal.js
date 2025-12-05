import React, { useState } from 'react';

function ProfileEditModal({ profile, onClose, onSave }) {
  const [form, setForm] = useState({
    fullName: profile?.fullName || '',
    professionalTitle: profile?.professionalTitle || '',
    age: profile?.age || '',
    yearsOfExperience: profile?.yearsOfExperience || '',
    phoneNumber: profile?.phoneNumber || '',
    gender: profile?.gender || '',
    location: profile?.location?.city || '',
    bio: profile?.bio || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      // Call parent onSave with updated form
      await onSave(form);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{maxWidth: 480}}>
        <div className="modal-header">
          <h2>Edit Profile</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="profile-edit-form">
          <label>Full Name
            <input name="fullName" value={form.fullName} onChange={handleChange} required />
          </label>
          <label>Professional Title
            <input name="professionalTitle" value={form.professionalTitle} onChange={handleChange} />
          </label>
          <label>Age
            <input name="age" value={form.age} onChange={handleChange} type="number" min="0" />
          </label>
          <label>Years of Experience
            <input name="yearsOfExperience" value={form.yearsOfExperience} onChange={handleChange} type="number" min="0" />
          </label>
          <label>Phone Number
            <input name="phoneNumber" value={form.phoneNumber} onChange={handleChange} />
          </label>
          <label>Gender
            <select name="gender" value={form.gender} onChange={handleChange}>
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </label>
          <label>City
            <input name="location" value={form.location} onChange={handleChange} />
          </label>
          <label>Bio
            <textarea name="bio" value={form.bio} onChange={handleChange} rows={3} />
          </label>
          {error && <div style={{color: 'red', marginBottom: 8}}>{error}</div>}
          <div style={{display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16}}>
            <button type="button" onClick={onClose} className="btn-cancel">Cancel</button>
            <button type="submit" className="btn-save" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProfileEditModal;
