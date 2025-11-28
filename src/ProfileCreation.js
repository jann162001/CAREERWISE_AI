import React, { useState } from 'react';
import './ProfileCreation.css';

function ProfileCreation({ onProfileComplete, onCancel }) {
    const [step, setStep] = useState(1);
    const [profilePicture, setProfilePicture] = useState(null);
    const [profilePicturePreview, setProfilePicturePreview] = useState(null);
    const [resumeFile, setResumeFile] = useState(null);
    const [certificateFiles, setCertificateFiles] = useState([]);
    const [formData, setFormData] = useState({
        // Personal Information
        fullName: '',
        phoneNumber: '',
        city: '',
        state: '',
        country: '',
        gender: '',
        
        // Professional Information
        professionalTitle: '',
        yearsOfExperience: 0,
        experienceLevel: 'Entry Level',
        
        // Education
        degree: '',
        fieldOfStudy: '',
        institution: '',
        graduationYear: '',
        
        // Skills
        skills: [],
        newSkill: '',
        skillProficiency: 'Intermediate',
        
        // Work Experience
        workExperience: [],
        
        // Job Preferences
        desiredJobTitles: [],
        newJobTitle: '',
        desiredIndustries: [],
        newIndustry: '',
        jobTypes: [],
        workArrangement: [],
        willingToRelocate: false,
        minSalary: '',
        maxSalary: '',
        
        // Additional
        languages: [],
        newLanguage: '',
        languageProficiency: 'Conversational',
        portfolio: '',
        linkedin: '',
        github: ''
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleProfilePictureChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfilePicture(file);
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfilePicturePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleResumeChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setResumeFile(file);
        }
    };

    const handleCertificateChange = (e) => {
        const files = Array.from(e.target.files);
        const validFiles = files.filter(file => {
            const isValidType = file.type === 'application/pdf';
            const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
            if (!isValidType) {
                alert(`${file.name} is not a PDF file`);
            }
            if (!isValidSize) {
                alert(`${file.name} exceeds 5MB size limit`);
            }
            return isValidType && isValidSize;
        });
        
        setCertificateFiles(prev => [...prev, ...validFiles]);
    };

    const removeCertificate = (index) => {
        setCertificateFiles(prev => prev.filter((_, i) => i !== index));
    };

    const addSkill = () => {
        if (formData.newSkill.trim()) {
            setFormData({
                ...formData,
                skills: [...formData.skills, {
                    name: formData.newSkill,
                    proficiency: formData.skillProficiency
                }],
                newSkill: ''
            });
        }
    };

    const removeSkill = (index) => {
        setFormData({
            ...formData,
            skills: formData.skills.filter((_, i) => i !== index)
        });
    };

    const addJobTitle = () => {
        if (formData.newJobTitle.trim() && !formData.desiredJobTitles.includes(formData.newJobTitle)) {
            setFormData({
                ...formData,
                desiredJobTitles: [...formData.desiredJobTitles, formData.newJobTitle],
                newJobTitle: ''
            });
        }
    };

    const removeJobTitle = (index) => {
        setFormData({
            ...formData,
            desiredJobTitles: formData.desiredJobTitles.filter((_, i) => i !== index)
        });
    };

    const addIndustry = () => {
        if (formData.newIndustry.trim() && !formData.desiredIndustries.includes(formData.newIndustry)) {
            setFormData({
                ...formData,
                desiredIndustries: [...formData.desiredIndustries, formData.newIndustry],
                newIndustry: ''
            });
        }
    };

    const removeIndustry = (index) => {
        setFormData({
            ...formData,
            desiredIndustries: formData.desiredIndustries.filter((_, i) => i !== index)
        });
    };

    const addLanguage = () => {
        if (formData.newLanguage.trim()) {
            setFormData({
                ...formData,
                languages: [...formData.languages, {
                    language: formData.newLanguage,
                    proficiency: formData.languageProficiency
                }],
                newLanguage: ''
            });
        }
    };

    const removeLanguage = (index) => {
        setFormData({
            ...formData,
            languages: formData.languages.filter((_, i) => i !== index)
        });
    };

    const toggleArrayItem = (arrayName, value) => {
        const array = formData[arrayName];
        if (array.includes(value)) {
            setFormData({
                ...formData,
                [arrayName]: array.filter(item => item !== value)
            });
        } else {
            setFormData({
                ...formData,
                [arrayName]: [...array, value]
            });
        }
    };

    const nextStep = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        // console.log removed
        setStep(step + 1);
    };

    const prevStep = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        // console.log removed
        setStep(step - 1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Form submitted, current step:', step);
        
        // Only submit if on the last step
        if (step !== 6) {
            console.log('Not on last step, NOT submitting. Current step:', step);
            return false;
        }
        
        console.log('On final step, proceeding with profile submission');
        
        const profileData = {
            fullName: formData.fullName,
            phoneNumber: formData.phoneNumber,
            location: {
                city: formData.city,
                state: formData.state,
                country: formData.country
            },
            professionalTitle: formData.professionalTitle,
            yearsOfExperience: parseInt(formData.yearsOfExperience),
            experienceLevel: formData.experienceLevel,
            education: formData.degree ? [{
                degree: formData.degree,
                fieldOfStudy: formData.fieldOfStudy,
                institution: formData.institution,
                graduationYear: parseInt(formData.graduationYear)
            }] : [],
            skills: formData.skills,
            jobPreferences: {
                desiredJobTitles: formData.desiredJobTitles,
                desiredIndustries: formData.desiredIndustries,
                jobTypes: formData.jobTypes,
                workArrangement: formData.workArrangement,
                willingToRelocate: formData.willingToRelocate,
                expectedSalary: {
                    min: parseFloat(formData.minSalary) || 0,
                    max: parseFloat(formData.maxSalary) || 0
                }
            },
            languages: formData.languages,
            portfolio: formData.portfolio,
            linkedin: formData.linkedin,
            github: formData.github
        };

        // Create FormData for file upload
        const formDataToSend = new FormData();
        formDataToSend.append('profileData', JSON.stringify(profileData));
        
        if (profilePicture) {
            formDataToSend.append('profilePicture', profilePicture);
        }
        
        if (resumeFile) {
            formDataToSend.append('resumeFile', resumeFile);
        }
        
        // Append certificate files
        if (certificateFiles.length > 0) {
            certificateFiles.forEach((file, index) => {
                formDataToSend.append('certificates', file);
            });
        }

        // Call the callback with FormData
        onProfileComplete(formDataToSend);
    };

    const renderStep = () => {
        switch(step) {
            case 1:
                return (
                    <div className="profile-step">
                        <h2>Personal Information</h2>
                        
                        {/* Profile Picture Upload */}
                        <div className="form-group profile-picture-upload">
                            <label>Profile Picture</label>
                            <div className="upload-area">
                                {profilePicturePreview ? (
                                    <div className="image-preview">
                                        <img src={profilePicturePreview} alt="Profile Preview" />
                                        <button 
                                            type="button" 
                                            className="btn-remove"
                                            onClick={() => {
                                                setProfilePicture(null);
                                                setProfilePicturePreview(null);
                                            }}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ) : (
                                    <label className="upload-label">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleProfilePictureChange}
                                            style={{ display: 'none' }}
                                        />
                                        <div className="upload-placeholder">
                                            <span className="upload-icon">📷</span>
                                            <span>Click to upload photo</span>
                                            <small>JPG, PNG or GIF (Max 5MB)</small>
                                        </div>
                                    </label>
                                )}
                            </div>
                        </div>

                                                <div className="form-grid">
                                                    <>
                                                        <div className="form-group">
                                                            <label>Gender</label>
                                                            <select
                                                                name="gender"
                                                                value={formData.gender}
                                                                onChange={handleChange}
                                                            >
                                                                <option value="">Select Gender</option>
                                                                <option value="Male">Male</option>
                                                                <option value="Female">Female</option>
                                                                <option value="Non-binary">Non-binary</option>
                                                                <option value="Prefer not to say">Prefer not to say</option>
                                                            </select>
                                                        </div>
                                                        <div className="form-group">
                                                            <label>Full Name *</label>
                                                            <input
                                                                type="text"
                                                                name="fullName"
                                                                value={formData.fullName}
                                                                onChange={handleChange}
                                                                required
                                                            />
                                                        </div>
                                                        <div className="form-group">
                                                            <label>Phone Number</label>
                                                            <input
                                                                type="tel"
                                                                name="phoneNumber"
                                                                value={formData.phoneNumber}
                                                                onChange={handleChange}
                                                            />
                                                        </div>
                                                        <div className="form-group">
                                                            <label>City *</label>
                                                            <input
                                                                type="text"
                                                                name="city"
                                                                value={formData.city}
                                                                onChange={handleChange}
                                                                required
                                                            />
                                                        </div>
                                                        <div className="form-group">
                                                            <label>State/Province</label>
                                                            <input
                                                                type="text"
                                                                name="state"
                                                                value={formData.state}
                                                                onChange={handleChange}
                                                            />
                                                        </div>
                                                        <div className="form-group">
                                                            <label>Country *</label>
                                                            <input
                                                                type="text"
                                                                name="country"
                                                                value={formData.country}
                                                                onChange={handleChange}
                                                                required
                                                            />
                                                        </div>
                                                    </>
                                                </div>
                    </div>
                );
            
            case 2:
                return (
                    <div className="profile-step">
                        <h2>Professional Information</h2>
                        <div className="form-grid">
                            <div className="form-group full-width">
                                <label>Professional Title *</label>
                                <input
                                    type="text"
                                    name="professionalTitle"
                                    value={formData.professionalTitle}
                                    onChange={handleChange}
                                    placeholder="e.g., Software Developer, Marketing Manager"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Years of Experience *</label>
                                <input
                                    type="number"
                                    name="yearsOfExperience"
                                    value={formData.yearsOfExperience}
                                    onChange={handleChange}
                                    min="0"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Experience Level *</label>
                                <select
                                    name="experienceLevel"
                                    value={formData.experienceLevel}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="Entry Level">Entry Level</option>
                                    <option value="Mid Level">Mid Level</option>
                                    <option value="Senior Level">Senior Level</option>
                                    <option value="Lead/Manager">Lead/Manager</option>
                                    <option value="Executive">Executive</option>
                                </select>
                            </div>
                        </div>
                    </div>
                );
            
            case 3:
                return (
                    <div className="profile-step">
                        <h2>Education</h2>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Highest Degree</label>
                                <select
                                    name="degree"
                                    value={formData.degree}
                                    onChange={handleChange}
                                >
                                    <option value="">Select Degree</option>
                                    <option value="High School">High School</option>
                                    <option value="Associate">Associate</option>
                                    <option value="Bachelor's">Bachelor's</option>
                                    <option value="Master's">Master's</option>
                                    <option value="PhD">PhD</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Field of Study</label>
                                <input
                                    type="text"
                                    name="fieldOfStudy"
                                    value={formData.fieldOfStudy}
                                    onChange={handleChange}
                                    placeholder="e.g., Computer Science"
                                />
                            </div>
                            <div className="form-group">
                                <label>Institution</label>
                                <input
                                    type="text"
                                    name="institution"
                                    value={formData.institution}
                                    onChange={handleChange}
                                    placeholder="University/College name"
                                />
                            </div>
                            <div className="form-group">
                                <label>Graduation Year</label>
                                <input
                                    type="number"
                                    name="graduationYear"
                                    value={formData.graduationYear}
                                    onChange={handleChange}
                                    min="1950"
                                    max="2030"
                                    placeholder="YYYY"
                                />
                            </div>
                        </div>
                    </div>
                );
            
            case 4:
                return (
                    <div className="profile-step">
                        <h2>Skills & Expertise *</h2>
                        <p className="step-description">Add at least 3 skills for better job matching</p>
                        
                        <div className="skill-input-group">
                            <div className="form-group">
                                <label>Skill Name</label>
                                <input
                                    type="text"
                                    name="newSkill"
                                    value={formData.newSkill}
                                    onChange={handleChange}
                                    placeholder="e.g., JavaScript, Project Management"
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                                />
                            </div>
                            <div className="form-group">
                                <label>Proficiency</label>
                                <select
                                    name="skillProficiency"
                                    value={formData.skillProficiency}
                                    onChange={handleChange}
                                >
                                    <option value="Beginner">Beginner</option>
                                    <option value="Intermediate">Intermediate</option>
                                    <option value="Advanced">Advanced</option>
                                    <option value="Expert">Expert</option>
                                </select>
                            </div>
                            <button type="button" onClick={addSkill} className="add-btn">
                                Add Skill
                            </button>
                        </div>
                        
                        <div className="tags-container">
                            {formData.skills.map((skill, index) => (
                                <div key={index} className="tag">
                                    <span>{skill.name} ({skill.proficiency})</span>
                                    <button type="button" onClick={() => removeSkill(index)}>×</button>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            
            case 5:
                return (
                    <div className="profile-step">
                        <h2>Job Preferences *</h2>
                        
                        <div className="form-group full-width">
                            <label>Desired Job Titles</label>
                            <div className="input-with-button">
                                <input
                                    type="text"
                                    name="newJobTitle"
                                    value={formData.newJobTitle}
                                    onChange={handleChange}
                                    placeholder="e.g., Software Engineer, Data Analyst"
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addJobTitle())}
                                />
                                <button type="button" onClick={addJobTitle} className="add-btn">Add</button>
                            </div>
                            <div className="tags-container">
                                {formData.desiredJobTitles.map((title, index) => (
                                    <div key={index} className="tag">
                                        <span>{title}</span>
                                        <button type="button" onClick={() => removeJobTitle(index)}>×</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <div className="form-group full-width">
                            <label>Desired Industries</label>
                            <div className="input-with-button">
                                <select
                                    name="newIndustry"
                                    value={formData.newIndustry}
                                    onChange={handleChange}
                                >
                                    <option value="">Select an industry</option>
                                    <option value="Technology">Technology</option>
                                    <option value="Healthcare">Healthcare</option>
                                    <option value="Finance">Finance</option>
                                    <option value="Energy">Energy</option>
                                    <option value="Automotive & Transportation">Automotive & Transportation</option>
                                    <option value="Creative Industries">Creative Industries</option>
                                    <option value="Agriculture & Environment">Agriculture & Environment</option>
                                    <option value="Government & Public Services">Government & Public Services</option>
                                    <option value="Construction & Real Estate">Construction & Real Estate</option>
                                    <option value="Aerospace & Defense">Aerospace & Defense</option>
                                    <option value="Education">Education</option>
                                    <option value="Food & Beverage">Food & Beverage</option>
                                    <option value="Logistics & Supply Chain">Logistics & Supply Chain</option>
                                    <option value="Gaming & Entertainment">Gaming & Entertainment</option>
                                    <option value="Retail & Consumer Goods">Retail & Consumer Goods</option>
                                    <option value="Tourism & Hospitality">Tourism & Hospitality</option>
                                    <option value="Life Sciences">Life Sciences</option>
                                    <option value="Telecommunications">Telecommunications</option>
                                </select>
                                <button type="button" onClick={addIndustry} className="add-btn">Add</button>
                            </div>
                            <div className="tags-container">
                                {formData.desiredIndustries.map((industry, index) => (
                                    <div key={index} className="tag">
                                        <span>{industry}</span>
                                        <button type="button" onClick={() => removeIndustry(index)}>×</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <div className="form-group full-width">
                            <label>Job Type Preferences *</label>
                            <div className="checkbox-group">
                                {['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'].map(type => (
                                    <label key={type} className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={formData.jobTypes.includes(type)}
                                            onChange={() => toggleArrayItem('jobTypes', type)}
                                        />
                                        <span>{type}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        
                        <div className="form-group full-width">
                            <label>Work Arrangement *</label>
                            <div className="checkbox-group">
                                {['On-site', 'Remote', 'Hybrid'].map(arrangement => (
                                    <label key={arrangement} className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={formData.workArrangement.includes(arrangement)}
                                            onChange={() => toggleArrayItem('workArrangement', arrangement)}
                                        />
                                        <span>{arrangement}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        
                        <div className="form-group full-width">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    name="willingToRelocate"
                                    checked={formData.willingToRelocate}
                                    onChange={handleChange}
                                />
                                <span>Willing to Relocate</span>
                            </label>
                        </div>
                        
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Expected Salary (Min)</label>
                                <input
                                    type="number"
                                    name="minSalary"
                                    value={formData.minSalary}
                                    onChange={handleChange}
                                    placeholder="e.g., 50000"
                                />
                            </div>
                            <div className="form-group">
                                <label>Expected Salary (Max)</label>
                                <input
                                    type="number"
                                    name="maxSalary"
                                    value={formData.maxSalary}
                                    onChange={handleChange}
                                    placeholder="e.g., 80000"
                                />
                            </div>
                        </div>
                    </div>
                );
            
            case 6:
                return (
                    <div className="profile-step">
                        <h2>Additional Information</h2>
                        
                        <div className="form-group full-width">
                            <label>Languages</label>
                            <div className="skill-input-group">
                                <div className="form-group">
                                    <input
                                        type="text"
                                        name="newLanguage"
                                        value={formData.newLanguage}
                                        onChange={handleChange}
                                        placeholder="e.g., English, Spanish"
                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLanguage())}
                                    />
                                </div>
                                <div className="form-group">
                                    <select
                                        name="languageProficiency"
                                        value={formData.languageProficiency}
                                        onChange={handleChange}
                                    >
                                        <option value="Basic">Basic</option>
                                        <option value="Conversational">Conversational</option>
                                        <option value="Fluent">Fluent</option>
                                        <option value="Native">Native</option>
                                    </select>
                                </div>
                                <button type="button" onClick={addLanguage} className="add-btn">Add</button>
                            </div>
                            <div className="tags-container">
                                {formData.languages.map((lang, index) => (
                                    <div key={index} className="tag">
                                        <span>{lang.language} ({lang.proficiency})</span>
                                        <button type="button" onClick={() => removeLanguage(index)}>×</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        {/* Resume Upload */}
                        <div className="form-group full-width">
                            <label>Upload Resume</label>
                            <div className="upload-area">
                                {resumeFile ? (
                                    <div className="file-preview">
                                        <span className="file-icon">📄</span>
                                        <span className="file-name">{resumeFile.name}</span>
                                        <button 
                                            type="button" 
                                            className="btn-remove"
                                            onClick={() => setResumeFile(null)}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ) : (
                                    <label className="upload-label">
                                        <input
                                            type="file"
                                            accept=".pdf,.doc,.docx"
                                            onChange={handleResumeChange}
                                            style={{ display: 'none' }}
                                        />
                                        <div className="upload-placeholder">
                                            <span className="upload-icon">📎</span>
                                            <span>Click to upload resume</span>
                                            <small>PDF, DOC or DOCX (Max 5MB)</small>
                                        </div>
                                    </label>
                                )}
                            </div>
                        </div>
                        
                        {/* Certificate Upload */}
                        <div className="form-group full-width">
                            <label>Upload Certificates (Optional)</label>
                            <p style={{fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem'}}>
                                Upload your professional certificates, licenses, or credentials
                            </p>
                            <div className="upload-area">
                                <label className="upload-label">
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        multiple
                                        onChange={handleCertificateChange}
                                        style={{ display: 'none' }}
                                    />
                                    <div className="upload-placeholder">
                                        <span className="upload-icon">📜</span>
                                        <span>Click to upload certificates</span>
                                        <small>PDF only (Max 5MB per file)</small>
                                    </div>
                                </label>
                            </div>
                            
                            {certificateFiles.length > 0 && (
                                <div className="uploaded-files-list">
                                    {certificateFiles.map((file, index) => (
                                        <div key={index} className="file-preview">
                                            <span className="file-icon">📄</span>
                                            <span className="file-name">{file.name}</span>
                                            <span className="file-size">({(file.size / 1024).toFixed(1)} KB)</span>
                                            <button 
                                                type="button" 
                                                className="btn-remove"
                                                onClick={() => removeCertificate(index)}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Portfolio URL</label>
                                <input
                                    type="url"
                                    name="portfolio"
                                    value={formData.portfolio}
                                    onChange={handleChange}
                                    placeholder="https://"
                                />
                            </div>
                            <div className="form-group">
                                <label>LinkedIn Profile</label>
                                <input
                                    type="url"
                                    name="linkedin"
                                    value={formData.linkedin}
                                    onChange={handleChange}
                                    placeholder="https://linkedin.com/in/"
                                />
                            </div>
                        </div>
                    </div>
                );
            
            default:
                return null;
        }
    };

    return (
        <div className="profile-creation-overlay">
            <div className="profile-creation-container">
                <div className="profile-creation-header">
                    <h1>Create Your Professional Profile</h1>
                    <div className="progress-bar">
                        <div 
                            className="progress-fill" 
                            style={{ width: `${(step / 6) * 100}%` }}
                        ></div>
                    </div>
                    <p className="step-indicator">Step {step} of 6</p>
                </div>
                
                <form onSubmit={step === 6 ? handleSubmit : (e) => e.preventDefault()} className="profile-form" onKeyDown={(e) => {
                    // Prevent Enter key from submitting form unless on last step
                    if (e.key === 'Enter' && step !== 6) {
                        e.preventDefault();
                    }
                }}>
                    {renderStep()}
                    
                    <div className="form-actions">
                        {step > 1 && (
                            <button type="button" onClick={(e) => prevStep(e)} className="btn-secondary">
                                Previous
                            </button>
                        )}
                        {step < 6 ? (
                            <button type="button" onClick={(e) => nextStep(e)} className="btn-primary">
                                Next
                            </button>
                        ) : (
                            <button type="submit" className="btn-primary">
                                Complete Profile
                            </button>
                        )}
                        {onCancel && (
                            <button type="button" onClick={onCancel} className="btn-text">
                                Skip for Now
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ProfileCreation;


