
import React, { useState, useEffect } from 'react';
import ResumeAnalyzer from './ResumeAnalyzer';
import './Dashboard.css';
import './DashboardAnalytics.css';
import './ResumeLayout.css';
import './CareerGuidance.css';



function Dashboard() {
  // Backend-powered Career Path Suggestions
  // Use environment variable for API base URL
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
  const [careerPathSuggestions, setCareerPathSuggestions] = useState([]);
  const [loadingCareerPaths, setLoadingCareerPaths] = useState(false);
  // State for showing the resume analyzer
    // Static mapping of career fields to interview do's and don'ts
    const interviewTipsByField = {
      'Software Engineer': {
        dos: [
          'Review data structures and algorithms.',
          'Practice coding on a whiteboard or online editor.',
          'Prepare to discuss past projects and your role.',
          'Ask clarifying questions before starting a coding task.',
          'Communicate your thought process clearly.'
        ],
        donts: [
          "Don't jump into coding without a plan.",
          "Don't ignore edge cases in your solutions.",
          "Don't be afraid to ask for clarification.",
          "Don't speak negatively about previous employers.",
          "Don't leave your code uncommented or messy."
        ]
      },
      'Marketing': {
        dos: [
          'Showcase successful campaigns you contributed to.',
          'Be ready to discuss analytics and ROI.',
          'Demonstrate creativity and strategic thinking.',
          'Research the company’s brand and voice.',
          'Prepare questions about target audiences.'
        ],
        donts: [
          "Don't exaggerate your results.",
          "Don't overlook digital marketing trends.",
          "Don't forget to bring a portfolio of your work.",
          "Don't avoid discussing campaign failures and learnings.",
          "Don't ignore the importance of teamwork."
        ]
      },
      'Sales': {
        dos: [
          'Highlight your sales achievements with numbers.',
          'Demonstrate knowledge of the company’s products.',
          'Show enthusiasm and confidence.',
          'Prepare to role-play a sales pitch.',
          'Ask about sales targets and team structure.'
        ],
        donts: [
          "Don't be vague about your sales process.",
          "Don't avoid discussing how you handle rejection.",
          "Don't forget to research the company’s competitors.",
          "Don't focus only on individual wins—mention teamwork.",
          "Don't ignore follow-up strategies."
        ]
      },
      // Add more fields as needed
      'default': {
        dos: [
          'Research the company and role.',
          'Prepare questions for the interviewer.',
          'Dress appropriately and be punctual.',
          'Practice common interview questions.',
          'Show enthusiasm for the position.'
        ],
        donts: [
          "Don't arrive late or unprepared.",
          "Don't speak negatively about previous jobs.",
          "Don't forget to follow up after the interview.",
          "Don't interrupt the interviewer.",
          "Don't give generic answers—be specific."
        ]
      }
    };
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [activePage, setActivePage] = useState(() => {
    // Restore the last active page from localStorage
    return localStorage.getItem('activePage') || 'dashboard';
  });
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [jobMatchCount, setJobMatchCount] = useState(0);
  const [savedJobsCount, setSavedJobsCount] = useState(0);
  const [showMatchesModal, setShowMatchesModal] = useState(false);
  const [matchedJobs, setMatchedJobs] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [showSavedJobsModal, setShowSavedJobsModal] = useState(false);
  const [savedJobs, setSavedJobs] = useState([]);
  const [loadingSavedJobs, setLoadingSavedJobs] = useState(false);
  const [savedJobIds, setSavedJobIds] = useState([]);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applicationData, setApplicationData] = useState({
    coverLetter: '',
    portfolio: '',
    expectedSalary: '',
    availableStartDate: ''
  });
  const [submittingApplication, setSubmittingApplication] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [applicationResumeFile, setApplicationResumeFile] = useState(null);
  const [myApplications, setMyApplications] = useState([]);
  const [appliedJobIds, setAppliedJobIds] = useState([]);
  const [profileViewsCount, setProfileViewsCount] = useState(0);
  const [showProfileViewsModal, setShowProfileViewsModal] = useState(false);
  const [profileViews, setProfileViews] = useState([]);
  const [loadingProfileViews, setLoadingProfileViews] = useState(false);
  const [interviewsCount, setInterviewsCount] = useState(0);
  const [showInterviewsModal, setShowInterviewsModal] = useState(false);
  const [interviews, setInterviews] = useState([]);
  const [loadingInterviews, setLoadingInterviews] = useState(false);
  
  // Dashboard Analytics State
  const [careerMatchScore, setCareerMatchScore] = useState(0);
  const [aiResumeScore, setAIResumeScore] = useState(72);
  const [improvementSuggestions, setImprovementSuggestions] = useState(5);
  const [applicationStats, setApplicationStats] = useState({
    underReview: 0,
    forInterview: 0,
    hired: 0,
    rejected: 0
  });
  
  // Job Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJobType, setSelectedJobType] = useState('');
  const [selectedWorkArrangement, setSelectedWorkArrangement] = useState('');
  const [selectedExperienceLevel, setSelectedExperienceLevel] = useState('');
  const [allJobs, setAllJobs] = useState([]);
  
  // Resume AI Analyzer State
  const [showResumeAnalyzer, setShowResumeAnalyzer] = useState(false);
  const [resumeAnalysis, setResumeAnalysis] = useState(null);
  const [analyzingResume, setAnalyzingResume] = useState(false);
  const [resumeUploadError, setResumeUploadError] = useState('');
  
  // Career Guidance State
  const [careerGuidance, setCareerGuidance] = useState(null);
  const [loadingGuidance, setLoadingGuidance] = useState(false);
  const [selectedCareerPath, setSelectedCareerPath] = useState(null);
  const [desiredJob, setDesiredJob] = useState('');

  // Fetch career path suggestions for the user's recommended field
  useEffect(() => {
    const fetchCareerPaths = async () => {
      if (!careerGuidance?.careerPaths || !careerGuidance.careerPaths[0]?.field) {
        setCareerPathSuggestions([]);
        return;
      }
      setLoadingCareerPaths(true);
      try {
        const field = encodeURIComponent(careerGuidance.careerPaths[0].field);
        // Gather user skills and education from profile
        const skills = (profile?.skills || []).map(s => s.name);
        const education = (profile?.education || []).map(e => e.fieldOfStudy);
        const res = await fetch(`${API_URL}/career-paths/${field}/personalized`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ skills, education })
        });
        if (res.ok) {
          const data = await res.json();
          setCareerPathSuggestions([data]);
        } else {
          setCareerPathSuggestions([]);
        }
      } catch (err) {
        setCareerPathSuggestions([]);
      } finally {
        setLoadingCareerPaths(false);
      }
    };
    fetchCareerPaths();
  }, [careerGuidance, profile]);
  
  // Messages State
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  
  // Job Details Modal State
  const [showJobDetailsModal, setShowJobDetailsModal] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  
  // Tooltip State
  const [activeTooltip, setActiveTooltip] = useState(null);
  
  // Application Menu State
  const [openMenuId, setOpenMenuId] = useState(null);
  
  // Applications Modal State
  const [showApplicationsModal, setShowApplicationsModal] = useState(false);
  
  // Edit Profile Modal State
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchUserInfo();
    fetchProfile();
    fetchJobMatches();
    fetchSavedJobsCount();
    fetchProfileViewsCount();
    fetchInterviewsCount();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openMenuId && !event.target.closest('.dropdown-menu-container')) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuId]);


  useEffect(() => {
    if (user?.id) {
      fetchMyApplications();
      fetchProfileViewsCount();
      fetchInterviewsCount();

      // Periodically refresh applications every 10 seconds
      const intervalId = setInterval(() => {
        fetchMyApplications();
      }, 10000);
      return () => clearInterval(intervalId);
    }
  }, [user]);

  useEffect(() => {
    if (activePage === 'jobs') {
      fetchJobs();
    }
    if (activePage === 'applications' && user?.id) {
      fetchMyApplications();
    }
  }, [activePage, user]);

  // Save active page to localStorage whenever it changes
  const changeActivePage = (page) => {
    setActivePage(page);
    localStorage.setItem('activePage', page);
  };

  const fetchUserInfo = async () => {
    try {
      // First, check if we have cached user data and use it immediately
      const cachedUser = localStorage.getItem('user');
      if (cachedUser) {
        setUser(JSON.parse(cachedUser));
      }

      // Then try to fetch fresh data from server
      const response = await fetch(`${API_URL}/auth/user`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setUser(data.user);
        // Update localStorage with fresh data
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      // If fetch fails but we have cached data, just continue with cached data
    } catch (error) {
      // handle error if needed
      console.error('Error:', error);
      // On error, try to use cached user data
      const cachedUser = localStorage.getItem('user');
      if (cachedUser) {
        setUser(JSON.parse(cachedUser));
      }
    } finally {
      // cleanup if needed
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      console.log('Fetching profile...');
      const response = await fetch(`${API_URL}/profiles/me`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      console.log('Profile response:', data);
      
      if (data.success) {
        setProfile(data.profile);
        console.log('Profile updated:', data.profile);
        console.log('Resume in profile:', data.profile?.resume);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchJobMatches = async () => {
    try {
      const response = await fetch(`${API_URL}/jobs/matches/count`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setJobMatchCount(data.matchCount);
      }
    } catch (error) {
      console.error('Error fetching job matches:', error);
    }
  };

  const fetchSavedJobsCount = async () => {
    try {
      const response = await fetch(`${API_URL}/jobs/saved/count`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setSavedJobsCount(data.savedCount);
      }
    } catch (error) {
      console.error('Error fetching saved jobs count:', error);
    }
  };

  const fetchMyApplications = async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`${API_URL}/applications/user/${user.id}`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (Array.isArray(data)) {
        console.log('📋 Fetched applications:', data);
        setMyApplications(data);
        const jobIds = Array.isArray(data) ? data.map(app => app.job?._id).filter(Boolean) : [];
        console.log('✅ Applied job IDs:', jobIds);
        setAppliedJobIds(jobIds);
        
        // Calculate real application statistics
        calculateApplicationStats(data);
      }
    } catch (error) {
      console.error('Error fetching my applications:', error);
    }
  };

  const calculateApplicationStats = (applications) => {
    const validApps = applications.filter(app => app.job && app.job.jobTitle);
    const total = validApps.length;
    
    if (total === 0) {
      setApplicationStats({
        underReview: 0,
        forInterview: 0,
        hired: 0,
        rejected: 0
      });
      return;
    }
    
    const underReview = validApps.filter(app => app.status === 'Under Review').length;
    const forInterview = validApps.filter(app => app.status === 'For Interview').length;
    const hired = validApps.filter(app => app.status === 'Hired').length;
    const rejected = validApps.filter(app => app.status === 'Rejected').length;
    
    setApplicationStats({
      underReview: Math.round((underReview / total) * 100),
      forInterview: Math.round((forInterview / total) * 100),
      hired: Math.round((hired / total) * 100),
      rejected: Math.round((rejected / total) * 100)
    });
  };

  const fetchProfileViewsCount = async () => {
    if (!user?.id) {
      console.log('⚠️ Cannot fetch profile views - user.id is missing:', user);
      return;
    }
    
    try {
      console.log('📊 Fetching profile views count for user:', user.id);
      const response = await fetch(`${API_URL}/profile-views/user/${user.id}/count`, {
        credentials: 'include'
      });
      const data = await response.json();
      console.log('📊 Profile views count response:', data);
      
      if (data.success) {
        console.log('✅ Setting profile views count:', data.count);
        setProfileViewsCount(data.count);
      }
    } catch (error) {
      console.error('Error fetching profile views count:', error);
    }
  };

  const fetchProfileViews = async () => {
    if (!user?.id) return;
    
    setLoadingProfileViews(true);
    try {
      const response = await fetch(`${API_URL}/profile-views/user/${user.id}`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setProfileViews(data.views);
      }
    } catch (error) {
      console.error('Error fetching profile views:', error);
    } finally {
      setLoadingProfileViews(false);
    }
  };

  const fetchInterviewsCount = async () => {
    if (!user?.id) return;
    
    try {
      console.log('📊 Fetching interviews count for user:', user.id);
      const response = await fetch(`${API_URL}/interviews/user/${user.id}/count`, {
        credentials: 'include'
      });
      const data = await response.json();
      console.log('📊 Interviews count response:', data);
      
      if (data.success) {
        console.log('✅ Setting interviews count:', data.count);
        setInterviewsCount(data.count);
      }
    } catch (error) {
      console.error('Error fetching interviews count:', error);
    }
  };

  const fetchInterviews = async () => {
    if (!user?.id) return;
    
    setLoadingInterviews(true);
    try {
      const response = await fetch(`${API_URL}/interviews/user/${user.id}`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setInterviews(data.interviews);
      }
    } catch (error) {
      console.error('Error fetching interviews:', error);
    } finally {
      setLoadingInterviews(false);
    }
  };

  const handleViewInterviews = async () => {
    setShowInterviewsModal(true);
    await fetchInterviews();
    await fetchInterviewsCount(); // Refresh count when modal opens
  };

  const handleViewProfileViews = async () => {
    setShowProfileViewsModal(true);
    await fetchProfileViews();
    await fetchProfileViewsCount(); // Refresh count when modal opens
  };

  const handleCancelApplication = async (applicationId) => {
    // Instantly cancel application without confirmation

    try {
      const response = await fetch(`${API_URL}/applications/${applicationId}/withdraw`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ userId: user.id })
      });

      const data = await response.json();

      if (data.success) {
        // Application canceled successfully (no alert)
        fetchMyApplications();
      } else {
        // Failed to cancel application (no alert)
      }
    } catch (error) {
      console.error('Error canceling application:', error);
      // Error canceling application (no alert)
    }
  };

  const fetchMatchedJobs = async () => {
    setLoadingMatches(true);
    try {
      const response = await fetch(`${API_URL}/jobs/matches/list`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      console.log('📦 Fetched matches response:', data);
      console.log('✨ Number of matches:', data.matches?.length || 0);
      
      if (data.success) {
        setMatchedJobs(data.matches || []);
      } else {
        console.error('❌ Failed to fetch matches:', data.message);
        setMatchedJobs([]);
      }
    } catch (error) {
      console.error('❌ Error fetching matched jobs:', error);
      setMatchedJobs([]);
    } finally {
      setLoadingMatches(false);
    }
  };

  const handleShowMatches = () => {
    setShowMatchesModal(true);
    fetchMatchedJobs();
  };

  const fetchSavedJobsList = async () => {
    setLoadingSavedJobs(true);
    try {
      const response = await fetch(`${API_URL}/jobs/saved/list`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      console.log('📋 Fetched saved jobs response:', data);
      console.log('⭐ Number of saved jobs:', data.savedJobs?.length || 0);
      
      if (data.success) {
        setSavedJobs(data.savedJobs || []);
      } else {
        console.error('❌ Failed to fetch saved jobs:', data.message);
        setSavedJobs([]);
      }
    } catch (error) {
      console.error('❌ Error fetching saved jobs:', error);
      setSavedJobs([]);
    } finally {
      setLoadingSavedJobs(false);
    }
  };

  const handleShowSavedJobs = () => {
    setShowSavedJobsModal(true);
    fetchSavedJobsList();
  };

  const handleUnsaveJob = async (jobId) => {
    try {
      const response = await fetch(`${API_URL}/jobs/${jobId}/save`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        // Remove from local state
        setSavedJobs(savedJobs.filter(job => job._id !== jobId));
        setSavedJobsCount(data.savedJobsCount);
        console.log('✅ Job unsaved successfully');
      }
    } catch (error) {
      console.error('Error unsaving job:', error);
    }
  };

  const handleSaveJob = async (jobId) => {
    console.log('🔘 Save button clicked for job:', jobId);
    const isSaved = savedJobIds.includes(jobId);
    console.log('📌 Current saved status:', isSaved);
    
    try {
      if (isSaved) {
        // Unsave the job
        console.log('🗑️ Attempting to unsave job...');
        const response = await fetch(`${API_URL}/jobs/${jobId}/save`, {
          method: 'DELETE',
          credentials: 'include'
        });
        const data = await response.json();
        console.log('📥 Unsave response:', data);
        
        if (data.success) {
          setSavedJobIds(savedJobIds.filter(id => id !== jobId));
          setSavedJobsCount(data.savedJobsCount);
          console.log('✅ Job unsaved successfully');
        } else {
          console.error('❌ Failed to unsave:', data.message);
        }
      } else {
        // Save the job
        console.log('💾 Attempting to save job...');
        const response = await fetch(`${API_URL}/jobs/${jobId}/save`, {
          method: 'POST',
          credentials: 'include'
        });
        const data = await response.json();
        console.log('📥 Save response:', data);
        
        if (data.success) {
          setSavedJobIds([...savedJobIds, jobId]);
          setSavedJobsCount(data.savedJobsCount);
          console.log('✅ Job saved successfully');
          console.log('📊 Updated saved jobs count:', data.savedJobsCount);
        } else {
          console.error('❌ Failed to save:', data.message);
          alert(data.message || 'Failed to save job. Please try again.');
        }
      }
    } catch (error) {
      console.error('❌ Error saving/unsaving job:', error);
      alert('Error saving job. Please check console for details.');
    }
  };

  const handleApplyClick = async (job) => {
    setSelectedJob(job);
    setShowApplyModal(true);
  };

  const handleResumeFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        alert('Please upload a PDF file only.');
        e.target.value = '';
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('File size must be less than 5MB.');
        e.target.value = '';
        return;
      }
      setResumeFile(file);
    }
  };

  const handleResumeUpload = async () => {
    if (!resumeFile) {
      alert('Please select a resume file first.');
      return;
    }

    console.log('User object:', user);
    console.log('User ID:', user?.id);

    if (!user?.id) {
      alert('User information not loaded. Please refresh the page.');
      return;
    }

    setUploadingResume(true);
    try {
      const formData = new FormData();
      formData.append('resume', resumeFile);
      formData.append('userId', user.id);

      console.log('Uploading resume for user ID:', user.id);

      const response = await fetch(`${API_URL}/profiles/upload-resume`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        alert('Resume uploaded successfully!');
        setResumeFile(null);
        // Reset file input
        document.getElementById('resume-file-input').value = '';
        // Refresh profile to show new resume
        await fetchProfile();
        // Automatically navigate to resume page to view it
        setActivePage('resume');
        localStorage.setItem('activePage', 'resume');
      } else {
        alert(data.message || 'Failed to upload resume');
      }
    } catch (error) {
      console.error('Error uploading resume:', error);
      alert('Error uploading resume. Please try again.');
    } finally {
      setUploadingResume(false);
    }
  };

  // Removed handleAnalyzeResume and all related ATS/analysis/extracted resume code as requested. Only upload controls remain.

  const fetchCareerGuidance = async () => {
    setLoadingGuidance(true);
    try {
      console.log('Fetching career guidance...');
      const response = await fetch(`${API_URL}/profiles/career-guidance`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ desiredJob })
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Career guidance response:', data);

      if (data.success) {
        setCareerGuidance(data.guidance);
        // Update dashboard career match score
        if (data.guidance?.careerMatchScore) {
          setCareerMatchScore(data.guidance.careerMatchScore);
        }
      } else {
        console.error('Career guidance failed:', data.message);
        alert(data.message || 'Failed to fetch career guidance');
      }
    } catch (error) {
      console.error('Career guidance error:', error);
      alert('Error fetching career guidance: ' + error.message);
    } finally {
      setLoadingGuidance(false);
    }
  };

  const handleGetGuidance = () => {
    if (activePage === 'career-guidance' && !careerGuidance) {
      fetchCareerGuidance();
    }
  };

  useEffect(() => {
    if (activePage === 'career-guidance' && profile && !careerGuidance) {
      fetchCareerGuidance();
    }
  }, [activePage, profile]);

  // Fetch conversations when messages page is opened
  useEffect(() => {
    if (activePage === 'messages' && user?.id) {
      fetchConversations();
    }
  }, [activePage, user]);

  const fetchConversations = async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`${API_URL}/messages/conversations/${user.id}?userType=User`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      // Ensure data is an array
      const conversationsArray = Array.isArray(data) ? data : [];
      setConversations(conversationsArray);
      
      // If there are conversations, select the first one
      if (conversationsArray.length > 0 && !activeConversation) {
        selectConversation(conversationsArray[0]);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setConversations([]); // Set empty array on error
    }
  };

  const selectConversation = async (conversation) => {
    setActiveConversation(conversation);
    setMessages(conversation.messages || []);
    
    // Mark messages as read
    try {
      await fetch(`${API_URL}/messages/conversation/${conversation._id}/read`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userType: 'User' })
      });
      fetchConversations(); // Refresh to update unread counts
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const sendUserMessage = async () => {
    if (!newMessage.trim() || !activeConversation || !user) return;
    
    setLoadingMessages(true);
    try {
      const response = await fetch(`${API_URL}/messages/conversation/${activeConversation._id}/send`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: user.id,
          senderType: 'User',
          senderUsername: user.username || user.fullName,
          content: newMessage
        })
      });
      
      const data = await response.json();
      if (data.conversation) {
        setMessages(data.conversation.messages);
        setActiveConversation(data.conversation);
        setNewMessage('');
        fetchConversations(); // Refresh conversation list
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Failed to send message (no alert)
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleMessageKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendUserMessage();
    }
  };

  const handleApplicationSubmit = async () => {
    if (!applicationResumeFile) {
      alert('Please select a resume file to upload.');
      return;
    }

    setSubmittingApplication(true);

    try {
      const formData = new FormData();
      formData.append('userId', user.id);
      formData.append('jobId', selectedJob._id);
      formData.append('resume', applicationResumeFile);

      const response = await fetch(`${API_URL}/applications/apply`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        alert('Application submitted successfully! Check your messages for updates.');
        setShowApplyModal(false);
        setApplicationResumeFile(null);
        // Refresh applications list immediately
        await fetchMyApplications();
        // Switch to applications page automatically to show the new application
        changeActivePage('applications');
      } else {
        alert(data.message || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('Error submitting application. Please try again.');
    } finally {
      setSubmittingApplication(false);
    }
  };

  const fetchJobs = async () => {
    setLoadingJobs(true);
    try {
      // Fetch with higher limit to get more jobs
      const response = await fetch(`${API_URL}/jobs/all?limit=100`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      console.log('📊 Jobs API Response:', {
        success: data.success,
        jobsCount: data.jobs?.length || 0,
        pagination: data.pagination
      });
      
      if (data.success) {
        setAllJobs(data.jobs || []);
        setJobs(data.jobs || []);
        console.log('✅ Loaded jobs:', data.jobs?.length || 0);
        
        // Fetch saved jobs to know which ones are saved
        fetchSavedJobIds();
      } else {
        console.error('❌ Failed to fetch jobs:', data.message);
        setAllJobs([]);
        setJobs([]);
      }
    } catch (error) {
      console.error('❌ Error fetching jobs:', error);
      setAllJobs([]);
      setJobs([]);
    } finally {
      setLoadingJobs(false);
    }
  };

  // Filter jobs based on search and filter criteria
  const applyFilters = () => {
    let filtered = [...allJobs];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(job => 
        job.jobTitle?.toLowerCase().includes(query) ||
        job.company?.toLowerCase().includes(query) ||
        job.description?.toLowerCase().includes(query) ||
        job.location?.city?.toLowerCase().includes(query) ||
        job.location?.country?.toLowerCase().includes(query) ||
        job.requiredSkills?.some(skill => 
          (typeof skill === 'object' ? skill.name : skill)?.toLowerCase().includes(query)
        )
      );
    }

    // Job Type filter
    if (selectedJobType) {
      filtered = filtered.filter(job => job.jobType === selectedJobType);
    }

    // Work Arrangement filter
    if (selectedWorkArrangement) {
      filtered = filtered.filter(job => job.workArrangement === selectedWorkArrangement);
    }

    // Experience Level filter
    if (selectedExperienceLevel) {
      filtered = filtered.filter(job => job.experienceLevel === selectedExperienceLevel);
    }

    setJobs(filtered);
  };

  // Apply filters whenever search or filter values change
  useEffect(() => {
    if (allJobs.length > 0) {
      applyFilters();
    }
  }, [searchQuery, selectedJobType, selectedWorkArrangement, selectedExperienceLevel, allJobs]);

  const fetchSavedJobIds = async () => {
    try {
      const response = await fetch(`${API_URL}/jobs/saved/list`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        const ids = Array.isArray(data.savedJobs) ? data.savedJobs.map(job => job._id) : [];
        setSavedJobIds(ids);
      }
    } catch (error) {
      console.error('Error fetching saved job IDs:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      // Clear localStorage on logout
      localStorage.removeItem('user');
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      // Clear localStorage even if logout request fails
      localStorage.removeItem('user');
      window.location.href = '/';
    }
  };

  if (loading) {
    return <div style={{padding: '20px'}}>Loading...</div>;
  }

  if (!user) {
    return <div style={{padding: '20px'}}>Not authenticated</div>;
  }

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>💼 CareerWise</h2>
        </div>
        
        <nav className="sidebar-nav">
          {['dashboard', 'profile', 'jobs', 'applications', 'career-guidance', 'resume', 'messages'].map(page => (
            <div
              key={page}
              onClick={() => changeActivePage(page)}
              className={`nav-link ${activePage === page ? 'active' : ''}`}
            >
              <span>{page.replace('-', ' ')}</span>
            </div>
          ))}
        </nav>
        
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Top Bar */}
        <header className="topbar">
          <div className="topbar-content">
            <h1>{activePage.charAt(0).toUpperCase() + activePage.slice(1).replace('-', ' ')}</h1>
            <div className="user-info">
              <span>👤 {user.username}</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="content-area">
          {/* Resume Analyzer and AI metric card removed as requested */}
          {activePage === 'dashboard' && (
            <>
              {/* Top Metrics Cards */}
              <div className="dashboard-metrics-grid">
                <div className="metric-card clickable-metric" onClick={handleShowMatches}>
                  <div className="metric-header">
                    <span className="metric-label">Job Matches</span>
                  </div>
                  <div className="metric-value">{jobMatchCount}</div>
                  <div className="metric-chart">
                    <svg viewBox="0 0 100 30" style={{width: '100%', height: '30px'}}>
                      <polyline 
                        points="0,20 20,18 40,15 60,17 80,12 100,10" 
                        fill="none" 
                        stroke="#3b82f6" 
                        strokeWidth="2"
                      />
                    </svg>
                  </div>
                </div>

                <div className="metric-card clickable-metric" onClick={handleViewProfileViews}>
                  <div className="metric-header">
                    <span className="metric-label">Profile Views</span>
                  </div>
                  <div className="metric-value">{profileViewsCount}</div>
                  <div className="metric-chart">
                    <svg viewBox="0 0 100 30" style={{width: '100%', height: '30px'}}>
                      <polyline 
                        points="0,25 20,22 40,18 60,20 80,15 100,12" 
                        fill="none" 
                        stroke="#8b5cf6" 
                        strokeWidth="2"
                      />
                    </svg>
                  </div>
                </div>

                <div className="metric-card clickable-metric" onClick={handleViewInterviews}>
                  <div className="metric-header">
                    <span className="metric-label">Interviews</span>
                  </div>
                  <div className="metric-value">{interviewsCount}</div>
                  <div className="metric-chart">
                    <svg viewBox="0 0 100 30" style={{width: '100%', height: '30px'}}>
                      <polyline 
                        points="0,20 20,20 40,20 60,20 80,20 100,20" 
                        fill="none" 
                        stroke="#6b7280" 
                        strokeWidth="2"
                      />
                    </svg>
                  </div>
                </div>

                <div className="metric-card clickable-metric" onClick={handleShowSavedJobs}>
                  <div className="metric-header">
                    <span className="metric-label">Saved Jobs</span>
                  </div>
                  <div className="metric-value">{savedJobsCount}</div>
                  <div className="metric-chart">
                    <svg viewBox="0 0 100 30" style={{width: '100%', height: '30px'}}>
                      <polyline 
                        points="0,22 20,19 40,16 60,18 80,14 100,11" 
                        fill="none" 
                        stroke="#10b981" 
                        strokeWidth="2"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Middle Stats Row */}
              <div className="dashboard-stats-row">
                <div className="stat-box clickable-stat" onClick={() => setShowApplicationsModal(true)}>
                  <div className="stat-label">Applications Submitted</div>
                  <div className="stat-number">{myApplications.filter(app => app.job && app.job.jobTitle).length}</div>
                </div>

                <div className="stat-box">
                  <div className="stat-label">Career Match Score</div>
                  <div className="stat-number">{careerMatchScore > 0 ? careerMatchScore : '--'}%</div>
                  <div className="stat-subtitle">{careerMatchScore > 0 ? 'Based on your profile' : 'Complete profile to see score'}</div>
                </div>

                <div className="stat-box">
                  <div className="stat-label">AI Resume Score</div>
                  <div className="stat-number">{aiResumeScore}</div>
                  <div className="stat-subtitle">Improvement suggestions: {improvementSuggestions}</div>
                </div>
              </div>

              {/* Charts Row */}
              <div className="dashboard-charts-row">
                {/* Application Status Donut Chart */}
                <div className="chart-container">
                  <h3 className="chart-title">Application Status</h3>
                  <div className="donut-chart-wrapper">
                    <div className="donut-chart-svg-container">
                      <svg viewBox="0 0 200 200" style={{width: '180px', height: '180px'}}>
                        {/* Background circle */}
                        <circle cx="100" cy="100" r="80" fill="none" stroke="#f3f4f6" strokeWidth="35"/>
                        
                        {/* Under Review - 21% (Blue) */}
                        <circle 
                          cx="100" 
                          cy="100" 
                          r="80" 
                          fill="none" 
                          stroke="#3b82f6" 
                          strokeWidth="35"
                          strokeDasharray="105 502"
                          strokeDashoffset="0"
                          transform="rotate(-90 100 100)"
                          className="donut-segment"
                          onMouseEnter={() => setActiveTooltip('underReview')}
                          onMouseLeave={() => setActiveTooltip(null)}
                          onClick={() => setActiveTooltip(activeTooltip === 'underReview' ? null : 'underReview')}
                          style={{cursor: 'pointer', transition: 'all 0.3s'}}
                        />
                        
                        {/* For Interview - 14% (Cyan) */}
                        <circle 
                          cx="100" 
                          cy="100" 
                          r="80" 
                          fill="none" 
                          stroke="#06b6d4" 
                          strokeWidth="35"
                          strokeDasharray="70 502"
                          strokeDashoffset="-105"
                          transform="rotate(-90 100 100)"
                          className="donut-segment"
                          onMouseEnter={() => setActiveTooltip('forInterview')}
                          onMouseLeave={() => setActiveTooltip(null)}
                          onClick={() => setActiveTooltip(activeTooltip === 'forInterview' ? null : 'forInterview')}
                          style={{cursor: 'pointer', transition: 'all 0.3s'}}
                        />
                        
                        {/* Hired - 14% (Green) */}
                        <circle 
                          cx="100" 
                          cy="100" 
                          r="80" 
                          fill="none" 
                          stroke="#10b981" 
                          strokeWidth="35"
                          strokeDasharray="70 502"
                          strokeDashoffset="-175"
                          transform="rotate(-90 100 100)"
                          className="donut-segment"
                          onMouseEnter={() => setActiveTooltip('hired')}
                          onMouseLeave={() => setActiveTooltip(null)}
                          onClick={() => setActiveTooltip(activeTooltip === 'hired' ? null : 'hired')}
                          style={{cursor: 'pointer', transition: 'all 0.3s'}}
                        />
                        
                        {/* Rejected - 30% (Red) */}
                        <circle 
                          cx="100" 
                          cy="100" 
                          r="80" 
                          fill="none" 
                          stroke="#ef4444" 
                          strokeWidth="35"
                          strokeDasharray="150 502"
                          strokeDashoffset="-245"
                          transform="rotate(-90 100 100)"
                          className="donut-segment"
                          onMouseEnter={() => setActiveTooltip('rejected')}
                          onMouseLeave={() => setActiveTooltip(null)}
                          onClick={() => setActiveTooltip(activeTooltip === 'rejected' ? null : 'rejected')}
                          style={{cursor: 'pointer', transition: 'all 0.3s'}}
                        />
                      </svg>
                      
                      {/* Animated Tooltips */}
                      {activeTooltip === 'underReview' && (
                        <div className="donut-tooltip" style={{top: '20%', left: '50%'}}>
                          <div className="tooltip-percent">{applicationStats.underReview}%</div>
                          <div className="tooltip-label">Under Review</div>
                        </div>
                      )}
                      {activeTooltip === 'forInterview' && (
                        <div className="donut-tooltip" style={{top: '50%', right: '10%'}}>
                          <div className="tooltip-percent">{applicationStats.forInterview}%</div>
                          <div className="tooltip-label">For Interview</div>
                        </div>
                      )}
                      {activeTooltip === 'hired' && (
                        <div className="donut-tooltip" style={{bottom: '20%', right: '10%'}}>
                          <div className="tooltip-percent">{applicationStats.hired}%</div>
                          <div className="tooltip-label">Hired</div>
                        </div>
                      )}
                      {activeTooltip === 'rejected' && (
                        <div className="donut-tooltip" style={{bottom: '20%', left: '10%'}}>
                          <div className="tooltip-percent">{applicationStats.rejected}%</div>
                          <div className="tooltip-label">Rejected</div>
                        </div>
                      )}
                    </div>
                    
                    <div className="donut-legend">
                      <div 
                        className={`legend-item ${activeTooltip === 'underReview' ? 'legend-active' : ''}`}
                        onMouseEnter={() => setActiveTooltip('underReview')}
                        onMouseLeave={() => setActiveTooltip(null)}
                        onClick={() => setActiveTooltip(activeTooltip === 'underReview' ? null : 'underReview')}
                        style={{cursor: 'pointer'}}
                      >
                        <span className="legend-color" style={{background: '#3b82f6'}}></span>
                        <span className="legend-text">{applicationStats.underReview}% Under Review</span>
                      </div>
                      <div 
                        className={`legend-item ${activeTooltip === 'forInterview' ? 'legend-active' : ''}`}
                        onMouseEnter={() => setActiveTooltip('forInterview')}
                        onMouseLeave={() => setActiveTooltip(null)}
                        onClick={() => setActiveTooltip(activeTooltip === 'forInterview' ? null : 'forInterview')}
                        style={{cursor: 'pointer'}}
                      >
                        <span className="legend-color" style={{background: '#06b6d4'}}></span>
                        <span className="legend-text">{applicationStats.forInterview}% For Interview</span>
                      </div>
                      <div 
                        className={`legend-item ${activeTooltip === 'hired' ? 'legend-active' : ''}`}
                        onMouseEnter={() => setActiveTooltip('hired')}
                        onMouseLeave={() => setActiveTooltip(null)}
                        onClick={() => setActiveTooltip(activeTooltip === 'hired' ? null : 'hired')}
                        style={{cursor: 'pointer'}}
                      >
                        <span className="legend-color" style={{background: '#10b981'}}></span>
                        <span className="legend-text">{applicationStats.hired}% Hired</span>
                      </div>
                      <div 
                        className={`legend-item ${activeTooltip === 'rejected' ? 'legend-active' : ''}`}
                        onMouseEnter={() => setActiveTooltip('rejected')}
                        onMouseLeave={() => setActiveTooltip(null)}
                        onClick={() => setActiveTooltip(activeTooltip === 'rejected' ? null : 'rejected')}
                        style={{cursor: 'pointer'}}
                      >
                        <span className="legend-color" style={{background: '#ef4444'}}></span>
                        <span className="legend-text">{applicationStats.rejected}% Rejected</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Job Matches vs Recommended Bar Chart */}
                {/* Job Matches vs Recommended Bar Chart removed as requested */}
              </div>

              {/* Bottom Row */}
              <div className="dashboard-bottom-row">
                {/* Skill Gap Analysis */}
                <div className="chart-container">
                  <h3 className="chart-title">Skill Gap Analysis</h3>
                  <div className="radar-chart-wrapper">
                    <svg viewBox="0 0 200 200" style={{width: '200px', height: '200px'}}>
                      {/* Pentagon background */}
                      <polygon 
                        points="100,30 160,80 140,150 60,150 40,80" 
                        fill="#f0f9ff" 
                        stroke="#e0f2fe" 
                        strokeWidth="1"
                      />
                      <polygon 
                        points="100,50 145,85 130,135 70,135 55,85" 
                        fill="#dbeafe" 
                        stroke="#bfdbfe" 
                        strokeWidth="1"
                      />
                      
                      {/* Skill levels (filled area) */}
                      <polygon 
                        points="100,40 150,75 135,140 65,140 50,75" 
                        fill="rgba(59, 130, 246, 0.3)" 
                        stroke="#3b82f6" 
                        strokeWidth="2"
                      />
                      
                      {/* Skill points */}
                      <circle cx="100" cy="40" r="4" fill="#3b82f6"/>
                      <circle cx="150" cy="75" r="4" fill="#3b82f6"/>
                      <circle cx="135" cy="140" r="4" fill="#3b82f6"/>
                      <circle cx="65" cy="140" r="4" fill="#3b82f6"/>
                      <circle cx="50" cy="75" r="4" fill="#3b82f6"/>
                      
                      {/* Labels */}
                      <text x="100" y="20" fontSize="11" fill="#374151" textAnchor="middle" fontWeight="500">React</text>
                      <text x="170" y="80" fontSize="11" fill="#374151" textAnchor="start" fontWeight="500">JS</text>
                      <text x="145" y="165" fontSize="11" fill="#374151" textAnchor="middle" fontWeight="500">TypeScript</text>
                      <text x="55" y="165" fontSize="11" fill="#374151" textAnchor="middle" fontWeight="500">Leadership</text>
                      <text x="20" y="80" fontSize="11" fill="#374151" textAnchor="end" fontWeight="500">Communication</text>
                    </svg>
                  </div>
                </div>

                {/* Job Recommendations (Dynamic) */}
                {/* Job Recommendations card removed as requested */}
              </div>
            </>
          )}

          {activePage === 'profile' && (
            <div className="profile-layout-container">
              {/* Left Sidebar */}
              <div className="profile-sidebar">
                
                {/* Profile Photo and Name */}
                <div className="profile-sidebar-photo">
                  {profile?.profilePicture ? (
                    <img 
                      src={`http://localhost:3001${profile.profilePicture}`} 
                      alt="Profile" 
                      className="sidebar-profile-picture"
                    />
                  ) : (
                    <div className="sidebar-profile-avatar">👤</div>
                  )}
                  <h2 className="sidebar-profile-name">{profile?.fullName || user.fullName || user.username}</h2>
                  <p className="sidebar-profile-title">{profile?.professionalTitle || 'Professional'}</p>
                  <button className="btn-edit-profile-sidebar" onClick={() => setShowEditModal(true)}>
                    ✏️ Edit Profile
                  </button>
                </div>

                {/* Bio Section */}
                {profile?.bio && (
                  <div className="sidebar-section">
                    <p className="sidebar-bio">{profile.bio}</p>
                  </div>
                )}

                {/* Skills Section */}
                {profile?.skills && profile.skills.length > 0 && (
                  <div className="sidebar-section">
                    <h3 className="sidebar-section-title">Skills</h3>
                    <div className="sidebar-skills">
                      {Array.isArray(profile?.skills) && profile.skills.map((skill, index) => (
                        <span key={index} className="sidebar-skill-tag">
                          {skill.name}
                          {skill.proficiency ? ` (${skill.proficiency})` : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Languages Section */}
                {profile?.languages && profile.languages.length > 0 && (
                  <div className="sidebar-section">
                    <h3 className="sidebar-section-title">Languages</h3>
                    <div className="sidebar-skills">
                      {Array.isArray(profile?.languages) && profile.languages.map((lang, index) => (
                        <span key={index} className="sidebar-skill-tag">
                          {lang.language}{lang.proficiency ? ` (${lang.proficiency})` : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Main Content Area */}
              <div className="profile-main-content">
                {/* Basic Information Card */}
                <div className="basic-info-card">
                  <h3 className="basic-info-title">Basic Information</h3>
                  <div className="basic-info-grid">
                    <div className="basic-info-item">
                      <span className="info-label">AGE</span>
                      <span className="info-value">{profile?.age || '28'} years</span>
                    </div>
                    <div className="basic-info-item">
                      <span className="info-label">YEARS OF EXPERIENCE</span>
                      <span className="info-value">{profile?.yearsOfExperience || '0'} years</span>
                    </div>
                    <div className="basic-info-item">
                      <span className="info-label">PHONE</span>
                      <span className="info-value">{profile?.phoneNumber || 'Not provided'}</span>
                    </div>
                    <div className="basic-info-item">
                      <span className="info-label">SEX</span>
                      <span className="info-value">{profile?.gender || 'Not specified'}</span>
                    </div>
                    <div className="basic-info-item">
                      <span className="info-label">LOCATION</span>
                      <span className="info-value">
                        {profile?.location?.city ? `${profile.location.city}, ${profile.location.state}` : 'Not provided'}
                      </span>
                    </div>
                    <div className="basic-info-item">
                      <span className="info-label">EMAIL</span>
                      <span className="info-value">{user.email}</span>
                    </div>
                  </div>
                </div>

                {/* Professional Links Section */}
                {(profile?.portfolio || profile?.linkedin || profile?.github) && (
                  <div className="basic-info-card" style={{marginTop: '1.5rem'}}>
                    <h3 className="basic-info-title">Professional Links</h3>
                    <div className="professional-links">
                      {profile?.portfolio && (
                        <a href={profile.portfolio} target="_blank" rel="noopener noreferrer" className="professional-link">
                          <span className="link-icon">🌐</span>
                          <span className="link-text">Portfolio</span>
                          <span className="link-arrow">→</span>
                        </a>
                      )}
                      {profile?.linkedin && (
                        <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="professional-link">
                          <span className="link-icon">💼</span>
                          <span className="link-text">LinkedIn</span>
                          <span className="link-arrow">→</span>
                        </a>
                      )}
                      {profile?.github && (
                        <a href={profile.github} target="_blank" rel="noopener noreferrer" className="professional-link">
                          <span className="link-icon">💻</span>
                          <span className="link-text">GitHub</span>
                          <span className="link-arrow">→</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Experience Section */}
                {profile?.workExperience && profile.workExperience.length > 0 && (
                  <div className="experience-section">
                    <div className="section-header-main">
                      <h3>Experience</h3>
                      <button className="btn-edit-section-main" onClick={() => setShowEditModal(true)}>
                        ✏️ Edit
                      </button>
                    </div>
                    <div className="experience-list">
                      {Array.isArray(profile?.workExperience) && profile.workExperience.map((exp, index) => (
                        <div key={index} className="experience-card">
                          <div className="experience-logo" style={{backgroundColor: ['#4285F4', '#E91E63', '#FFA726'][index % 3]}}>
                            {exp.company?.substring(0, 2).toUpperCase() || 'ST'}
                          </div>
                          <div className="experience-details">
                            <h4 className="experience-company">{exp.company}</h4>
                            <p className="experience-position">{exp.position}</p>
                            <p className="experience-date">
                              {exp.startDate} - {exp.current ? 'Present' : exp.endDate} | {exp.location || 'Remote'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Education Section */}
                {profile?.education && profile.education.length > 0 && (
                  <div className="collapsible-section">
                    <div className="section-header-collapsible">
                      <h3>Education</h3>
                      <button className="btn-toggle">▼</button>
                    </div>
                    <div className="section-content">
                      {Array.isArray(profile?.education) && profile.education.map((edu, index) => (
                        <div key={index} className="education-card">
                          <strong>{edu.degree} in {edu.fieldOfStudy}</strong>
                          <p>{edu.institution}</p>
                          <p style={{color: '#64748b', fontSize: '14px'}}>Graduated: {edu.graduationYear}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Certification Section */}
                {profile?.certificates && profile.certificates.length > 0 && (
                  <div className="collapsible-section">
                    <div className="section-header-collapsible">
                      <h3>Certification</h3>
                      <button className="btn-toggle">▼</button>
                    </div>
                    <div className="section-content">
                      <div className="certificates-grid">
                        {Array.isArray(profile?.certificates) && profile.certificates.map((cert, index) => (
                          <div key={index} className="certificate-card">
                            <div className="certificate-icon-large">📜</div>
                            <div className="certificate-info">
                              <p className="certificate-name">{cert.filename}</p>
                              <p className="certificate-date">Uploaded: {new Date(cert.uploadedAt).toLocaleDateString()}</p>
                            </div>
                            <div className="certificate-actions-inline">
                              <a 
                                href={`http://localhost:3001${cert.fileUrl}`} 
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-view-cert-inline"
                              >
                                👁️ View
                              </a>
                              <a 
                                href={`http://localhost:3001${cert.fileUrl}`} 
                                download
                                className="btn-download-cert-inline"
                              >
                                ⬇️ Download
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Resume Upload Section */}
                <div className="profile-section-main">
                  <h3>Resume Management</h3>
                  {/* Resume display removed as requested. Only upload controls remain. */}
                  {/* All ATS/analysis/extracted resume content is now hidden when a resume is uploaded */}
                  
                  <div className="resume-upload-section">
                    <label className="upload-label">
                      {profile?.resume ? 'Upload New Resume (PDF only)' : 'Upload Resume (PDF only)'}
                    </label>
                    <div className="upload-controls">
                      <input 
                        type="file" 
                        id="resume-file-input"
                        accept=".pdf"
                        onChange={handleResumeFileChange}
                        className="file-input"
                      />
                      {resumeFile && (
                        <span className="selected-file">Selected: {resumeFile.name}</span>
                      )}
                    </div>
                    <button 
                      onClick={handleResumeUpload}
                      disabled={!resumeFile || uploadingResume}
                      className="btn-upload-resume"
                    >
                      {uploadingResume ? '⏳ Uploading...' : '📤 Upload Resume'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activePage === 'jobs' && (
            <div className="jobs-section">
              {/* Search and Filter Section */}
              <div className="jobs-filters">
                <div className="search-box">
                  <input
                    type="text"
                    placeholder="🔍 Search by job title, company, location, or skills..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                  />
                </div>
                <div className="filter-row">
                  <select
                    value={selectedJobType}
                    onChange={(e) => setSelectedJobType(e.target.value)}
                    className="filter-select"
                  >
                    <option value="">All Job Types</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                  </select>
                  
                  <select
                    value={selectedWorkArrangement}
                    onChange={(e) => setSelectedWorkArrangement(e.target.value)}
                    className="filter-select"
                  >
                    <option value="">All Work Arrangements</option>
                    <option value="On-site">On-site</option>
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                  
                  <select
                    value={selectedExperienceLevel}
                    onChange={(e) => setSelectedExperienceLevel(e.target.value)}
                    className="filter-select"
                  >
                    <option value="">All Experience Levels</option>
                    <option value="Entry Level">Entry Level</option>
                    <option value="Mid Level">Mid Level</option>
                    <option value="Senior Level">Senior Level</option>
                    <option value="Executive">Executive</option>
                  </select>
                  
                  {(searchQuery || selectedJobType || selectedWorkArrangement || selectedExperienceLevel) && (
                    <button
                      className="btn-clear-filters"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedJobType('');
                        setSelectedWorkArrangement('');
                        setSelectedExperienceLevel('');
                      }}
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
                <div className="results-count">
                  Showing {jobs.length} of {allJobs.length} jobs
                </div>
              </div>
              
              {loadingJobs ? (
                <div className="loading-state">Loading jobs...</div>
              ) : jobs.length === 0 ? (
                <div className="empty-jobs-state">
                  <div className="empty-icon">📋</div>
                  <p>No jobs available at the moment</p>
                  <small>Check back later for new opportunities</small>
                </div>
              ) : (
                <div className="jobs-layout-split">
                  {/* Left Side - Jobs List */}
                  <div className="jobs-list-panel">
                    {Array.isArray(jobs) && jobs.map(job => (
                      <div 
                        key={job._id} 
                        className={`user-job-card-compact ${selectedJob?._id === job._id ? 'active' : ''}`}
                        onClick={() => setSelectedJob(job)}
                        style={{cursor: 'pointer'}}
                      >
                        <div className="job-header">
                          <h3>{job.jobTitle}</h3>
                          <span className="job-badge">{job.jobType}</span>
                        </div>
                        <p className="job-company">🏢 {job.company}</p>
                        <div className="job-details">
                          <span className="job-detail">📍 {job.location.city || 'Remote'}</span>
                          <span className="job-detail">💰 ${job.salary?.min?.toLocaleString() || 'N/A'}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Right Side - Job Details */}
                  <div className="job-details-panel">
                    {selectedJob ? (
                      <div className="job-details-content">
                        <div className="job-details-header-inline">
                          <div>
                            <h2>{selectedJob.jobTitle}</h2>
                            <p className="job-details-company">🏢 {selectedJob.company}</p>
                          </div>
                          <span className="job-badge-large">{selectedJob.jobType}</span>
                        </div>

                        <div className="job-details-meta-inline">
                          <div className="meta-item">
                            <span className="meta-icon">📍</span>
                            <span>{selectedJob.location?.city || 'Remote'}, {selectedJob.location?.country || ''}</span>
                          </div>
                          <div className="meta-item">
                            <span className="meta-icon">💼</span>
                            <span>{selectedJob.workArrangement}</span>
                          </div>
                          <div className="meta-item">
                            <span className="meta-icon">📊</span>
                            <span>{selectedJob.experienceLevel}</span>
                          </div>
                          {selectedJob.salary && selectedJob.salary.min && (
                            <div className="meta-item">
                              <span className="meta-icon">💰</span>
                              <span>${selectedJob.salary.min.toLocaleString()} - ${selectedJob.salary.max.toLocaleString()} {selectedJob.salary.currency}</span>
                            </div>
                          )}
                        </div>

                        <div className="job-actions-inline" onClick={(e) => e.stopPropagation()}>
                          {appliedJobIds.includes(selectedJob._id) ? (
                            <button className="btn-applied-inline" disabled>✓ Already Applied</button>
                          ) : (
                            <button className="btn-apply-inline" onClick={() => handleApplyClick(selectedJob)}>
                              Apply Now
                            </button>
                          )}
                          <button 
                            className={`btn-save-inline ${savedJobIds.includes(selectedJob._id) ? 'saved' : ''}`}
                            onClick={() => handleSaveJob(selectedJob._id)}
                          >
                            {savedJobIds.includes(selectedJob._id) ? '⭐ Saved' : '⭐ Save Job'}
                          </button>
                        </div>

                        <div className="job-details-section-inline">
                          <h3>Job Description</h3>
                          <p className="job-full-description">{selectedJob.description}</p>
                        </div>

                        {selectedJob.benefits && selectedJob.benefits.length > 0 && (
                          <div className="job-details-section-inline">
                            <h3>Benefits</h3>
                            <div className="benefits-list-inline">
                              {Array.isArray(selectedJob?.benefits) && selectedJob.benefits.map((benefit, index) => (
                                <div key={index} className="benefit-item-inline">
                                  <span className="benefit-icon">✨</span>
                                  <span>{benefit}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="job-details-section-inline">
                          <h3>Required Skills</h3>
                          <div className="skills-list-inline">
                            {Array.isArray(selectedJob?.requiredSkills) && selectedJob.requiredSkills.map((skill, index) => (
                              <div key={index} className="skill-item-inline">
                                <span className="skill-name">{skill.name}</span>
                                <span className="skill-level">{skill.level}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {selectedJob.responsibilities && selectedJob.responsibilities.length > 0 && (
                          <div className="job-details-section-inline">
                            <h3>Responsibilities</h3>
                            <ul className="responsibilities-list">
                              {Array.isArray(selectedJob?.responsibilities) && selectedJob.responsibilities.map((resp, index) => (
                                <li key={index}>{resp}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {selectedJob.qualifications && selectedJob.qualifications.length > 0 && (
                          <div className="job-details-section-inline">
                            <h3>Qualifications</h3>
                            <ul className="qualifications-list">
                              {Array.isArray(selectedJob?.qualifications) && selectedJob.qualifications.map((qual, index) => (
                                <li key={index}>{qual}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="posted-date-inline">
                          Posted: {new Date(selectedJob.postedDate).toLocaleDateString()}
                        </div>
                      </div>
                    ) : (
                      <div className="empty-details-state">
                        <div className="empty-icon">👈</div>
                        <p>Select a job to view details</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activePage === 'applications' && (
            <div className="applications-section">
              <div className="applications-header">
                <h2>Applications</h2>
              </div>
              
              {myApplications.filter(app => app.job && app.job.jobTitle).length === 0 ? (
                <div className="empty-applications-state">
                  <div className="empty-icon">📋</div>
                  <p>No applications yet</p>
                  <small>Start applying to jobs to see them here</small>
                </div>
              ) : (
                <div className="applications-table-container">
                  <table className="minimalist-applications-table">
                    <thead>
                      <tr>
                        <th>JOB TITLE</th>
                        <th>COMPANY</th>
                        <th>STATUS</th>
                        <th>LAST UPDATE</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {myApplications
                        .filter(app => app.job && app.job.jobTitle)
                        .map(app => (
                        <tr key={app._id}>
                          <td className="job-title-cell">{app.job.jobTitle}</td>
                          <td className="company-cell">{app.job.company}</td>
                          <td>
                            <span className={`status-badge-minimalist status-${app.status.toLowerCase().replace(/\\s/g, '-')}`}>
                              {app.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="date-cell">
                            {new Date(app.appliedDate).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}
                          </td>
                          <td className="menu-cell">
                            <div className="dropdown-menu-container">
                              <button 
                                className="menu-btn"
                                onClick={() => setOpenMenuId(openMenuId == app._id ? null : app._id)}
                              >
                                ⋯
                              </button>
                              {openMenuId == app._id && (
                                <div className="dropdown-menu">
                                  {app.resume && (
                                    <a 
                                      href={`http://localhost:3001${app.resume.fileUrl}`} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="dropdown-item"
                                    >
                                      📄 View Resume
                                    </a>
                                  )}
                                  {app.status !== 'Withdrawn' && app.status !== 'Hired' && app.status !== 'Rejected' && (
                                    <button 
                                      className="dropdown-item cancel-item"
                                      onClick={() => {
                                        handleCancelApplication(app._id);
                                        setOpenMenuId(null);
                                      }}
                                    >
                                      ❌ Cancel Application
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activePage === 'resume' && (
            <div style={{
              minHeight: '80vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(120deg, #e0e7ff 0%, #f8fafc 100%)',
              padding: '0',
            }}>
              <div style={{
                maxWidth: 1200,
                width: '100%',
                background: 'rgba(255,255,255,0.95)',
                borderRadius: 32,
                boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                padding: '48px 32px 48px 48px',
                display: 'flex',
                alignItems: 'center',
                gap: 48,
                margin: '40px 0',
              }}>
                <div style={{ flex: 1 }}>



                  <input
                    type="file"
                    id="resume-upload-input"
                    accept=".pdf"
                    style={{ display: 'none' }}
                    onChange={async e => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        setUploadingResume(true);
                        setResumeAnalysis(null);
                        setResumeUploadError('');
                        try {
                          const formData = new FormData();
                          formData.append('resumeFile', file);
                          const res = await fetch('http://localhost:3001/api/analyze', {
                            method: 'POST',
                            body: formData
                          });
                          const data = await res.json();
                          if (!res.ok) throw new Error(data.error || 'Analysis failed');
                          setResumeAnalysis(data.analysis);
                        } catch (err) {
                          setResumeUploadError(err.message);
                        } finally {
                          setUploadingResume(false);
                        }
                      }
                    }}
                  />
                  <button
                    style={{
                      background: '#22c55e',
                      color: '#fff',
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      border: 'none',
                      borderRadius: 8,
                      padding: '16px 32px',
                      cursor: 'pointer',
                      opacity: 1,
                      boxShadow: '0 2px 8px rgba(34,197,94,0.08)'
                    }}
                    onClick={() => document.getElementById('resume-upload-input').click()}
                    disabled={uploadingResume}
                  />

                  {/* Scanner Progress UI */}
                  {uploadingResume && (
                    <div style={{ marginTop: 32, background: '#f1f5f9', borderRadius: 12, padding: 32, boxShadow: '0 2px 8px #0001', maxWidth: 600 }}>
                      <h2 style={{ color: '#2563eb', fontWeight: 700, marginBottom: 12 }}>Resume Scanner System</h2>
                      <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, marginBottom: 8 }}>Your Score</div>
                          <div style={{ fontWeight: 600, marginBottom: 8 }}>Content</div>
                          <div style={{ fontWeight: 600, marginBottom: 8 }}>Section</div>
                          <div style={{ fontWeight: 600, marginBottom: 8 }}>ATS Essentials</div>
                          <div style={{ fontWeight: 600, marginBottom: 8 }}>Tailoring</div>
                          <div style={{ fontWeight: 600, marginBottom: 8 }}>Unlock Full Report</div>
                        </div>
                        <div style={{ flex: 2 }}>
                          <div style={{ marginBottom: 8 }}>Parsing your resume...</div>
                          <div style={{ marginBottom: 8 }}>Analyzing your experience...</div>
                          <div style={{ marginBottom: 8 }}>Extracting your skills...</div>
                          <div style={{ marginBottom: 8 }}>Generating recommendations...</div>
                        </div>
                      </div>

                    </div>
                  )}

                  {/* Error State */}
                  {resumeUploadError && <div style={{ color: 'red', marginTop: 8 }}>{resumeUploadError}</div>}

                  {/* Show uploaded PDF resume only */}
                  {profile?.resume?.fileUrl && (
                    <>
                      <iframe
                        src={`http://localhost:3001${profile.resume.fileUrl}`}
                        title="Resume PDF"
                        style={{
                          width: '100%',
                          height: '90vh',
                          border: 'none',
                          display: 'block',
                          margin: '0 auto',
                          background: '#fff',
                        }}
                      />
                      <div style={{ textAlign: 'center', marginTop: 24 }}>
                        <button
                          style={{
                            padding: '12px 32px',
                            fontSize: '1.1rem',
                            background: '#2563eb',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 8,
                            cursor: 'pointer',
                            fontWeight: 600,
                            boxShadow: '0 2px 8px #0001',
                          }}
                          onClick={() => setShowResumeAnalyzer(true)}
                        >
                          Resume Analyzer
                        </button>
                      </div>
                      {showResumeAnalyzer && (
                        <div style={{
                          margin: '32px auto',
                          maxWidth: 600,
                          background: '#f8fafc',
                          borderRadius: 16,
                          boxShadow: '0 2px 8px #0001',
                          padding: 32,
                        }}>
                          <h2 style={{ color: '#2563eb', fontWeight: 700, marginBottom: 24 }}>Resume Analyzer Result</h2>
                          <div style={{ marginBottom: 20 }}>
                            <b>Resume Score (0–100):</b>
                            <div style={{ fontSize: 28, color: '#22c55e', fontWeight: 700, marginTop: 8 }}>--</div>
                          </div>
                          <div style={{ marginBottom: 20 }}>
                            <b>Strengths & Weaknesses:</b>
                            <ul style={{ marginTop: 8, marginBottom: 0 }}>
                              <li>--</li>
                            </ul>
                          </div>
                          <div style={{ marginBottom: 20 }}>
                            <b>Improvement Suggestions:</b>
                            <ul style={{ marginTop: 8, marginBottom: 0 }}>
                              <li>--</li>
                            </ul>
                          </div>
                          <div>
                            <b>Suggested Job Roles:</b>
                            <ul style={{ marginTop: 8, marginBottom: 0 }}>
                              <li>--</li>
                            </ul>
                          </div>
                          <div style={{ textAlign: 'right', marginTop: 24 }}>
                            <button
                              style={{
                                padding: '8px 24px',
                                fontSize: '1rem',
                                background: '#e5e7eb',
                                color: '#222',
                                border: 'none',
                                borderRadius: 6,
                                cursor: 'pointer',
                                fontWeight: 500,
                              }}
                              onClick={() => setShowResumeAnalyzer(false)}
                            >
                              Close
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                // Add state for showing the analyzer
                const [showResumeAnalyzer, setShowResumeAnalyzer] = useState(false);
                </div>
                {/* Resume Checker card removed as requested */}
              </div>
            </div>
          )}

          {activePage === 'career-guidance' && (
            <div className="career-guidance-section">
              <div className="guidance-header">
                <h2>🎯 Career Guidance</h2>
                <p>Get personalized career recommendations and insights</p>
              </div>

              {!profile ? (
                <div className="guidance-prompt">
                  <div className="empty-icon">👤</div>
                  <p>Please complete your profile first to get personalized career guidance</p>
                  <button 
                    className="btn-primary"
                    onClick={() => changeActivePage('profile')}
                  >
                    Complete Profile
                  </button>
                </div>
              ) : loadingGuidance ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Analyzing your profile and generating guidance...</p>
                </div>
              ) : careerGuidance ? (
                <div className="guidance-content">
                  {/* Career Match Score */}
                  <div className="guidance-card score-card">
                    <div className="card-header">
                      <h3>Career Match Score</h3>
                    </div>
                    <div className="score-display">
                      <div className="score-circle" style={{
                        background: `conic-gradient(#667eea ${83 * 3.6}deg, #e5e7eb 0deg)`
                      }}>
                        <div className="score-inner">
                          <div className="score-number">83</div>
                          <div className="score-label">%</div>
                        </div>
                      </div>
                      <p className="score-description">Your current career match score is 83%.</p>
                    </div>
                  </div>

                  {/* Job Recommendations */}
                  <div className="guidance-card">
                    <div className="card-header">
                      <span className="card-icon">💼</span>
                      <h3>Job Recommendations</h3>
                    </div>
                    <div className="recommendations-list">
                      {matchedJobs && matchedJobs.length > 0 ? (
                        matchedJobs.map((job, index) => (
                          <div key={index} className="recommendation-item">
                            <div className="recommendation-header">
                              <h4>{job.jobTitle || job.title}</h4>
                              {job.company && <span className="recommendation-company">{job.company}</span>}
                              {job.matchPercentage || job.matchScore ? (
                                <span className="match-badge">{job.matchPercentage ? `${job.matchPercentage}% Match` : `${job.matchScore}% Match`}</span>
                              ) : null}
                            </div>
                            <p className="recommendation-reason">Matched using your profile and preferences</p>
                            <div className="recommendation-skills">
                              <div className="skills-tags">
                                {((job.requiredSkills && job.requiredSkills.length > 0 ? job.requiredSkills : (job.skills || job.tags || [])).slice(0, 5)).map((skill, i) => (
                                  <span key={i} className="skill-tag">{typeof skill === 'object' ? skill.name : skill}</span>
                                ))}
                                {job.requiredSkills && job.requiredSkills.length > 5 && (
                                  <span className="skill-tag">+{job.requiredSkills.length - 5} more</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="no-recommendations">No job recommendations available. Complete your profile for better results.</div>
                      )}
                    </div>
                  </div>


                  {/* Skill Gap Checker */}
                  <div className="guidance-card">
                    <div className="card-header">
                      <span className="card-icon">🎯</span>
                      <h3>Skill Gap Analysis</h3>
                    </div>
                    <div className="skill-gap-content">
                      <div className="gap-summary">
                        <p><strong>Target Role:</strong> {careerGuidance.skillGap.targetRole}</p>
                        <p className="gap-description">{careerGuidance.skillGap.description}</p>
                      </div>
                      <div className="skills-comparison">
                        <div className="skills-column">
                          <h5>✓ Skills You Have</h5>
                          <ul className="skills-list">
                            {Array.isArray(careerGuidance?.skillGap?.currentSkills) && careerGuidance.skillGap.currentSkills.map((skill, i) => (
                              <li key={i} className="skill-item has-skill">{skill}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="skills-column">
                          <h5>⚠ Skills You Need</h5>
                          <ul className="skills-list">
                            {Array.isArray(careerGuidance?.skillGap?.missingSkills) && careerGuidance.skillGap.missingSkills.map((skill, i) => (
                              <li key={i} className="skill-item missing-skill">{skill}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Strengths & Weaknesses */}
                  <div className="guidance-card">
                    <div className="card-header">
                      <span className="card-icon">⚖️</span>
                      <h3>Strengths & Weaknesses Summary</h3>
                    </div>
                    <div className="strengths-weaknesses">
                      <div className="strength-section">
                        <h5>💪 Your Strengths</h5>
                        <ul>
                          {Array.isArray(careerGuidance?.strengthsWeaknesses?.strengths) && careerGuidance.strengthsWeaknesses.strengths.map((strength, i) => (
                            <li key={i}>{strength}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="weakness-section">
                        <h5>📈 Areas to Improve</h5>
                        <ul>
                          {Array.isArray(careerGuidance?.strengthsWeaknesses?.weaknesses) && careerGuidance.strengthsWeaknesses.weaknesses.map((weakness, i) => (
                            <li key={i}>{weakness}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>


                  {/* Interview Tips - career path specific */}
                  <div className="guidance-card">
                    <div className="card-header">
                      <span className="card-icon">🎤</span>
                      <h3>Interview Tips</h3>
                    </div>
                    <div className="interview-tips">
                      {(() => {
                        // Try to get the first recommended career path field
                        const field = careerGuidance?.careerPaths?.[0]?.field || 'default';
                        const tips = interviewTipsByField[field] || interviewTipsByField['default'];
                        return (
                          <>
                            <div className="tips-column">
                              <h5>✓ Do's</h5>
                              <ul>
                                {tips.dos.map((tip, i) => (
                                  <li key={i} className="do-item">{tip}</li>
                                ))}
                              </ul>
                            </div>
                            <div className="tips-column">
                              <h5>✗ Don'ts</h5>
                              <ul>
                                {tips.donts.map((tip, i) => (
                                  <li key={i} className="dont-item">{tip}</li>
                                ))}
                              </ul>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>



                </div>
              ) : (
                <div className="guidance-prompt">
                  <div className="empty-icon">🎯</div>
                  <p>Get personalized career guidance based on your profile</p>
                  <button 
                    className="btn-primary"
                    onClick={fetchCareerGuidance}
                  >
                    Get Career Guidance
                  </button>
                </div>
              )}
            </div>
          )}

          {activePage === 'messages' && (
            <div className="messages-section">
              <div className="messages-container">
                <div className="messages-sidebar">
                  <div className="messages-header">
                    <h3>Messages</h3>
                  </div>
                  <div className="conversation-list">
                    {Array.isArray(conversations) && conversations.length === 0 ? (
                      <div className="empty-conversations">
                        <p>💬 No conversations yet</p>
                        <small>Messages from employers will appear here</small>
                      </div>
                    ) : (
                      Array.isArray(conversations) && conversations.map((conv) => {
                        const otherParticipant = conv.participants.find(p => p.userType === 'Admin');
                        return (
                          <div 
                            key={conv._id} 
                            className={`conversation-item ${activeConversation?._id === conv._id ? 'active' : ''}`}
                            onClick={() => selectConversation(conv)}
                          >
                            <div className="avatar">
                              {otherParticipant?.username?.substring(0, 2).toUpperCase() || 'AD'}
                            </div>
                            <div className="conversation-info">
                              <h4>{otherParticipant?.username || 'Admin'}</h4>
                              <p className="last-message">
                                {conv.lastMessage?.content?.substring(0, 40) || 'No messages yet'}...
                              </p>
                              <span className="time">
                                {new Date(conv.lastMessage?.timestamp).toLocaleDateString()}
                              </span>
                            </div>
                            {conv.unreadCount?.user > 0 && (
                              <span className="unread-badge">{conv.unreadCount.user}</span>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
                
                <div className="messages-main">
                  {activeConversation ? (
                    <>
                      <div className="chat-header">
                        <div className="chat-user-info">
                          <div className="avatar">
                            {activeConversation.participants.find(p => p.userType === 'Admin')?.username?.substring(0, 2).toUpperCase() || 'AD'}
                          </div>
                          <div>
                            <h3>{activeConversation.participants.find(p => p.userType === 'Admin')?.username || 'Admin'}</h3>
                            <span className="status">Active</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="chat-messages">
                        {messages.length === 0 ? (
                          <div className="empty-messages">
                            <p>No messages yet. Start the conversation!</p>
                          </div>
                        ) : (
                          Array.isArray(messages) && messages.map((msg, index) => (
                            <div 
                              key={index} 
                              className={`message ${msg.sender.userType === 'User' ? 'sent' : 'received'}`}
                            >
                              <div className="message-content">
                                <p>{msg.content}</p>
                                <span className="message-time">
                                  {new Date(msg.timestamp).toLocaleTimeString()}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      
                      <div className="chat-input-container">
                        <input 
                          type="text" 
                          placeholder="Type your message..." 
                          className="chat-input"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={handleMessageKeyPress}
                          disabled={loadingMessages}
                        />
                        <button 
                          className="btn-send"
                          onClick={sendUserMessage}
                          disabled={loadingMessages || !newMessage.trim()}
                        >
                          {loadingMessages ? 'Sending...' : 'Send'}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="no-conversation-selected">
                      <div className="empty-icon">💬</div>
                      <p>Select a conversation to start messaging</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Job Matches Modal */}
      {showMatchesModal && (
        <div className="modal-overlay" onClick={() => setShowMatchesModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🎯 Your Job Matches</h2>
              <button className="modal-close" onClick={() => setShowMatchesModal(false)}>×</button>
            </div>
            
            <div className="modal-body">
              {loadingMatches ? (
                <div className="loading-state">Loading matched jobs...</div>
              ) : matchedJobs.length === 0 ? (
                <div className="empty-state">
                  <p>No job matches found.</p>
                  <small>Complete your profile to get better matches!</small>
                </div>
              ) : (
                <div className="matches-list">
                  {Array.isArray(matchedJobs) && matchedJobs.map((match) => {
                    const job = match.job || match;
                    const score = Math.round(match.matchScore || 0);
                    return (
                    <div key={job._id} className="match-card">
                      <div className="match-header">
                        <div>
                          <h3>{job.jobTitle}</h3>
                          <p className="company-name">🏢 {job.company}</p>
                        </div>
                        <div className="match-score">
                          <div className="score-circle" style={{
                            background: score >= 70 ? '#10b981' : 
                                       score >= 50 ? '#f59e0b' : '#3b82f6'
                          }}>
                            {score}%
                          </div>
                          <span className="score-label">Match</span>
                        </div>
                      </div>
                      
                      <div className="match-details">
                        <span className="detail-badge">📍 {job.location?.city || 'Remote'}, {job.location?.country || ''}</span>
                        <span className="detail-badge">💼 {job.workArrangement}</span>
                        <span className="detail-badge">📊 {job.experienceLevel}</span>
                        <span className="detail-badge">⏰ {job.jobType}</span>
                      </div>
                      
                      {job.salary && job.salary.min && (
                        <p className="match-salary">
                          💰 ${job.salary.min.toLocaleString()} - ${job.salary.max.toLocaleString()} {job.salary.currency}
                        </p>
                      )}
                      
                      <p className="match-description">
                        {job.description ? job.description.substring(0, 150) + '...' : 'No description available'}
                      </p>
                      
                      {job.requiredSkills && job.requiredSkills.length > 0 && (
                        <div className="match-skills">
                          <strong>Required Skills:</strong>
                          <div className="skills-tags">
                            {Array.isArray(job.requiredSkills) && job.requiredSkills.slice(0, 5).map((skill, index) => (
                              <span key={index} className="skill-tag">{skill.name || skill}</span>
                            ))}
                            {job.requiredSkills.length > 5 && (
                              <span className="skill-tag">+{job.requiredSkills.length - 5} more</span>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <div className="match-actions">
                        <button className="btn-apply-modal" onClick={() => handleApplyClick(job)}>Apply Now</button>
                        <button className="btn-view-details" onClick={() => {
                          setSelectedJob(job);
                          setShowJobDetailsModal(true);
                          setShowMatchesModal(false);
                        }}>View Details</button>
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Saved Jobs Modal */}
      {showSavedJobsModal && (
        <div className="modal-overlay" onClick={() => setShowSavedJobsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>⭐ Your Saved Jobs</h2>
              <button className="modal-close" onClick={() => setShowSavedJobsModal(false)}>×</button>
            </div>
            
            <div className="modal-body">
              {loadingSavedJobs ? (
                <div className="loading-state">Loading saved jobs...</div>
              ) : savedJobs.length === 0 ? (
                <div className="empty-state">
                  <p>No saved jobs yet.</p>
                  <small>Start saving jobs you're interested in!</small>
                </div>
              ) : (
                <div className="matches-list">
                  {Array.isArray(savedJobs) && savedJobs.map((job) => (
                    <div key={job._id} className="match-card">
                      <div className="match-header">
                        <div>
                          <h3>{job.jobTitle}</h3>
                          <p className="company-name">🏢 {job.company}</p>
                        </div>
                        <button 
                          className="btn-unsave"
                          onClick={() => handleUnsaveJob(job._id)}
                          title="Remove from saved"
                        >
                          ❌
                        </button>
                      </div>
                      
                      <div className="match-details">
                        <span className="detail-badge">📍 {job.location.city || 'Remote'}, {job.location.country || ''}</span>
                        <span className="detail-badge">💼 {job.workArrangement}</span>
                        <span className="detail-badge">📊 {job.experienceLevel}</span>
                        <span className="detail-badge">⏰ {job.jobType}</span>
                      </div>
                      
                      {job.salary && job.salary.min && (
                        <p className="match-salary">
                          💰 ${job.salary.min.toLocaleString()} - ${job.salary.max.toLocaleString()} {job.salary.currency}
                        </p>
                      )}
                      
                      <p className="match-description">
                        {job.description.substring(0, 150)}...
                      </p>
                      
                      {job.requiredSkills && job.requiredSkills.length > 0 && (
                        <div className="match-skills">
                          <strong>Required Skills:</strong>
                          <div className="skills-tags">
                            {Array.isArray(job.requiredSkills) && job.requiredSkills.slice(0, 5).map((skill, index) => (
                              <span key={index} className="skill-tag">{skill.name}</span>
                            ))}
                            {job.requiredSkills.length > 5 && (
                              <span className="skill-tag">+{job.requiredSkills.length - 5} more</span>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <div className="match-actions">
                        <button className="btn-apply-modal" onClick={() => handleApplyClick(job)}>Apply Now</button>
                        <button className="btn-view-details">View Details</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Applications Modal */}
      {showApplicationsModal && (
        <div className="modal-overlay" onClick={() => setShowApplicationsModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Applications</h2>
              <button className="modal-close" onClick={() => setShowApplicationsModal(false)}>×</button>
            </div>
            <div className="modal-body">
              {myApplications.filter(app => app.job && app.job.jobTitle).length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📋</div>
                  <p>No applications yet</p>
                  <small>Start applying to jobs to see them here</small>
                </div>
              ) : (
                <div className="applications-table-container">
                  <table className="minimalist-applications-table">
                    <thead>
                      <tr>
                        <th>JOB TITLE</th>
                        <th>COMPANY</th>
                        <th>STATUS</th>
                        <th>LAST UPDATE</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(myApplications) && myApplications
                        .filter(app => app.job && app.job.jobTitle)
                        .map(app => (
                        <tr key={app._id}>
                          <td className="job-title-cell">{app.job.jobTitle}</td>
                          <td className="company-cell">{app.job.company}</td>
                          <td>
                            <span className={`status-badge-minimalist status-${app.status.toLowerCase().replace(/\\s/g, '-')}`}>
                              {app.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="date-cell">
                            {new Date(app.appliedDate).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}
                          </td>
                          <td className="menu-cell">
                            <div className="dropdown-menu-container">
                              <button 
                                className="menu-btn"
                                onClick={() => setOpenMenuId(openMenuId == app._id ? null : app._id)}
                              >
                                ⋯
                              </button>
                              {openMenuId == app._id && (
                                <div className="dropdown-menu">
                                  {app.resume && (
                                    <a 
                                      href={`http://localhost:3001${app.resume.fileUrl}`} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="dropdown-item"
                                    >
                                      📄 View Resume
                                    </a>
                                  )}
                                  {app.status !== 'Withdrawn' && app.status !== 'Hired' && app.status !== 'Rejected' && (
                                    <button 
                                      className="dropdown-item cancel-item"
                                      onClick={() => {
                                        handleCancelApplication(app._id);
                                        setOpenMenuId(null);
                                      }}
                                    >
                                      ❌ Cancel Application
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Profile Views Modal */}
      {showProfileViewsModal && (
        <div className="modal-overlay" onClick={() => setShowProfileViewsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>👁️ Profile Views {profileViewsCount > 0 && `(${profileViewsCount})`}</h2>
              <button className="close-btn" onClick={() => setShowProfileViewsModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {loadingProfileViews ? (
                <div className="loading-state">Loading profile views...</div>
              ) : profileViews.length === 0 ? (
                <div className="empty-state">
                  <p>No one has viewed your profile yet.</p>
                  <small>Keep applying to jobs and updating your profile to attract recruiters!</small>
                </div>
              ) : (
                <div className="profile-views-list">
                  {Array.isArray(profileViews) && profileViews.map((view, index) => (
                    <div key={view._id || index} className="profile-view-card">
                      <div className="view-header">
                        <div className="viewer-avatar">
                          {view.viewerName?.[0]?.toUpperCase() || '👤'}
                        </div>
                        <div className="viewer-info">
                          <h4>{view.viewerName || 'Anonymous'}</h4>
                          <p className="viewer-type">{view.viewerType || 'Recruiter'}</p>
                        </div>
                        <div className="view-date">
                          {new Date(view.viewedAt).toLocaleDateString()}
                        </div>
                      </div>
                      {view.application && view.application.job && (
                        <div className="view-context">
                          <span className="context-icon">💼</span>
                          <span>Viewed while reviewing your application for <strong>{view.application.job.jobTitle}</strong> at <strong>{view.application.job.company}</strong></span>
                        </div>
                      )}
                      <div className="view-time">
                        {new Date(view.viewedAt).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Interviews Modal */}
      {showInterviewsModal && (
        <div className="modal-overlay" onClick={() => setShowInterviewsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>✓ Scheduled Interviews {interviewsCount > 0 && `(${interviewsCount})`}</h2>
              <button className="close-btn" onClick={() => setShowInterviewsModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {loadingInterviews ? (
                <div className="loading-state">Loading interviews...</div>
              ) : interviews.length === 0 ? (
                <div className="empty-state">
                  <p>No interviews scheduled yet.</p>
                  <small>When employers schedule interviews with you, they'll appear here!</small>
                </div>
              ) : (
                <div className="profile-views-list">
                  {Array.isArray(interviews) && interviews.map((interview, index) => (
                    <div key={interview._id || index} className="profile-view-card">
                      <div className="view-header">
                        <div className="viewer-avatar" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
                          {interview.scheduledByName.charAt(0).toUpperCase()}
                        </div>
                        <div className="viewer-info">
                          <h4>{interview.scheduledByName}</h4>
                          <span className="viewer-type">Admin/Recruiter</span>
                        </div>
                      </div>
                      <div className="view-context">
                        <span className="context-icon">💼</span>
                        <div>
                          <div><strong>Position:</strong> {interview.job?.jobTitle || 'N/A'}</div>
                          <div><strong>Company:</strong> {interview.job?.company || 'N/A'}</div>
                          <div><strong>Interview Date:</strong> {new Date(interview.interviewDate).toLocaleDateString()} at {new Date(interview.interviewDate).toLocaleTimeString()}</div>
                          {interview.interviewLocation && (
                            <div><strong>Location:</strong> {interview.interviewLocation}</div>
                          )}
                          {interview.interviewNotes && (
                            <div style={{marginTop: '8px', padding: '8px', background: '#f0f4f8', borderRadius: '4px'}}>
                              <strong>Notes:</strong> {interview.interviewNotes}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="view-time">
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          background: interview.status === 'Scheduled' ? '#e3f2fd' : '#f5f5f5',
                          color: interview.status === 'Scheduled' ? '#1976d2' : '#666'
                        }}>
                          {interview.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Application Modal */}
      {showApplyModal && selectedJob && (
        <div className="modal-overlay" onClick={() => setShowApplyModal(false)}>
          <div className="modal-content apply-modal-simple" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Apply for {selectedJob.title}</h2>
              <button className="modal-close" onClick={() => setShowApplyModal(false)}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="job-apply-info">
                <p><strong>{selectedJob.company}</strong></p>
                <p>{selectedJob.location?.city || 'Remote'}, {selectedJob.location?.country || ''} • {selectedJob.workArrangement}</p>
              </div>

              <div className="apply-message">
                <div className="resume-icon">📄</div>
                <h3>Send Your Application</h3>
                <p>Upload your resume to apply for this position.</p>
                <p className="info-text">A message conversation will be created so you can communicate with the employer.</p>
              </div>

              <div className="resume-upload-section">
                <label className="upload-label">Choose Resume File (PDF only)</label>
                <div className="upload-controls">
                  <input 
                    type="file" 
                    accept=".pdf"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        if (file.type !== 'application/pdf') {
                          alert('Please upload a PDF file only.');
                          e.target.value = '';
                          return;
                        }
                        if (file.size > 5 * 1024 * 1024) {
                          alert('File size must be less than 5MB.');
                          e.target.value = '';
                          return;
                        }
                        setApplicationResumeFile(file);
                      }
                    }}
                    className="file-input"
                  />
                  {applicationResumeFile && (
                    <span className="selected-file">Selected: {applicationResumeFile.name}</span>
                  )}
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowApplyModal(false)}>
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn-submit" 
                  onClick={handleApplicationSubmit}
                  disabled={submittingApplication}
                >
                  {submittingApplication ? 'Sending...' : '📤 Send Resume'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resume AI Analyzer Modal */}
      {showResumeAnalyzer && (
        <div className="modal-overlay" onClick={() => setShowResumeAnalyzer(false)}>
          <div className="modal-content analyzer-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🤖 Resume AI Analyzer</h2>
              <button className="close-btn" onClick={() => setShowResumeAnalyzer(false)}>✕</button>
            </div>
            <div className="modal-body">
              {analyzingResume ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Analyzing your resume...</p>
                </div>
              ) : resumeAnalysis ? (
                <div className="analyzer-results">
                  {/* Overall Score */}
                  <div className="score-card">
                    <div className="score-circle" style={{
                      background: `conic-gradient(#667eea ${resumeAnalysis.overallScore * 3.6}deg, #e5e7eb 0deg)`
                    }}>
                      <div className="score-inner">
                        <div className="score-number">{resumeAnalysis.overallScore}</div>
                        <div className="score-label">/100</div>
                      </div>
                    </div>
                    <h3>Overall Resume Score</h3>
                    <p className="score-description">{resumeAnalysis.scoreDescription}</p>
                  </div>

                  {/* Skills Section */}
                  <div className="analyzer-section">
                    <div className="section-header">
                      <span className="section-icon">✔</span>
                      <h3>Extracted Skills</h3>
                    </div>
                    <div className="skills-grid">
                      {Array.isArray(resumeAnalysis?.skills) && resumeAnalysis.skills.map((skill, index) => (
                        <span key={index} className="skill-tag">
                          {typeof skill === 'string' ? skill : skill.name}
                          {skill.proficiency && ` • ${skill.proficiency}`}
                        </span>
                      ))}
                    </div>
                    {(!Array.isArray(resumeAnalysis?.skills) || resumeAnalysis.skills.length === 0) && (
                      <p className="empty-message">No skills detected in your resume.</p>
                    )}
                  </div>

                  {/* Work Experience Section */}
                  <div className="analyzer-section">
                    <div className="section-header">
                      <span className="section-icon">✔</span>
                      <h3>Work Experience</h3>
                    </div>
                    {Array.isArray(resumeAnalysis?.workExperience) && resumeAnalysis.workExperience.map((exp, index) => (
                      <div key={index} className="experience-card">
                        <h4>{exp.title}</h4>
                        <p className="experience-years">{exp.years}</p>
                        <ul className="experience-tasks">
                          {Array.isArray(exp?.tasks) && exp.tasks.map((task, i) => (
                            <li key={i}>{task}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                    {(!Array.isArray(resumeAnalysis?.workExperience) || resumeAnalysis.workExperience.length === 0) && (
                      <p className="empty-message">No work experience detected.</p>
                    )}
                  </div>

                  {/* Education Section */}
                  <div className="analyzer-section">
                    <div className="section-header">
                      <span className="section-icon">✔</span>
                      <h3>Education</h3>
                    </div>
                    {Array.isArray(resumeAnalysis?.education) && resumeAnalysis.education.map((edu, index) => (
                      <div key={index} className="education-card">
                        <h4>{edu.degree}</h4>
                        <p>{edu.school}</p>
                        <p className="education-year">{edu.graduationYear}</p>
                      </div>
                    ))}
                    {(!Array.isArray(resumeAnalysis?.education) || resumeAnalysis.education.length === 0) && (
                      <p className="empty-message">No education information detected.</p>
                    )}
                  </div>

                  {/* Job Match Section */}
                  <div className="analyzer-section">
                    <div className="section-header">
                      <span className="section-icon">✔</span>
                      <h3>Job Match Analysis</h3>
                    </div>
                    <div className="match-score">
                      <div className="match-bar">
                        <div 
                          className="match-fill" 
                          style={{width: `${resumeAnalysis.jobMatchPercentage}%`}}
                        ></div>
                      </div>
                      <span className="match-percentage">{resumeAnalysis.jobMatchPercentage}% Match</span>
                    </div>
                    <p>{resumeAnalysis.matchAnalysis}</p>
                  </div>

                  {/* Grammar & Spelling Section */}
                  <div className="analyzer-section">
                    <div className="section-header">
                      <span className="section-icon">✔</span>
                      <h3>Grammar & Spelling</h3>
                    </div>
                    {resumeAnalysis.grammarIssues.length > 0 ? (
                      <div className="issues-list">
                        {Array.isArray(resumeAnalysis?.grammarIssues) && resumeAnalysis.grammarIssues.map((issue, index) => (
                          <div key={index} className="issue-item">
                            <span className="issue-icon">⚠️</span>
                            <div>
                              <strong>{issue.type}:</strong> {issue.suggestion}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="success-message">
                        <span className="success-icon">✓</span>
                        <p>No grammar or spelling issues detected!</p>
                      </div>
                    )}
                  </div>

                  {/* Suggestions Section */}
                  <div className="analyzer-section suggestions-section">
                    <div className="section-header">
                      <span className="section-icon">✔</span>
                      <h3>Suggestions to Improve</h3>
                    </div>
                    <ul className="suggestions-list">
                      {Array.isArray(resumeAnalysis?.suggestions) && resumeAnalysis.suggestions.map((suggestion, index) => (
                        <li key={index}>
                          <span className="suggestion-bullet">💡</span>
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Job Details Modal */}
      {showJobDetailsModal && selectedJob && (
        <div className="modal-overlay" onClick={() => setShowJobDetailsModal(false)}>
          <div className="modal-content job-details-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowJobDetailsModal(false)}>×</button>
            
            <div className="job-details-header">
              <div>
                <h2>{selectedJob.jobTitle}</h2>
                <p className="job-details-company">🏢 {selectedJob.company}</p>
              </div>
              <span className="job-badge-large">{selectedJob.jobType}</span>
            </div>

            <div className="job-details-meta">
              <div className="meta-item">
                <span className="meta-icon">📍</span>
                <span>{selectedJob.location?.city || 'Remote'}, {selectedJob.location?.country || ''}</span>
              </div>
              <div className="meta-item">
                <span className="meta-icon">💼</span>
                <span>{selectedJob.workArrangement}</span>
              </div>
              <div className="meta-item">
                <span className="meta-icon">📊</span>
                <span>{selectedJob.experienceLevel}</span>
              </div>
              {selectedJob.salary && selectedJob.salary.min && (
                <div className="meta-item">
                  <span className="meta-icon">💰</span>
                  <span>${selectedJob.salary.min.toLocaleString()} - ${selectedJob.salary.max.toLocaleString()} {selectedJob.salary.currency}</span>
                </div>
              )}
            </div>

            <div className="job-details-section">
              <h3>Job Description</h3>
              <p className="job-full-description">{selectedJob.description}</p>
            </div>

            <div className="job-details-section">
              <h3>Required Skills</h3>
              <div className="skills-list-modal">
                {Array.isArray(selectedJob?.requiredSkills) && selectedJob.requiredSkills.map((skill, index) => (
                  <div key={index} className="skill-item-modal">
                    <span className="skill-name">{skill.name}</span>
                    <span className="skill-level">{skill.level}</span>
                  </div>
                ))}
              </div>
            </div>

            {selectedJob.responsibilities && selectedJob.responsibilities.length > 0 && (
              <div className="job-details-section">
                <h3>Responsibilities</h3>
                <ul className="responsibilities-list">
                  {Array.isArray(selectedJob?.responsibilities) && selectedJob.responsibilities.map((resp, index) => (
                    <li key={index}>{resp}</li>
                  ))}
                </ul>
              </div>
            )}

            {selectedJob.qualifications && selectedJob.qualifications.length > 0 && (
              <div className="job-details-section">
                <h3>Qualifications</h3>
                <ul className="qualifications-list">
                  {Array.isArray(selectedJob?.qualifications) && selectedJob.qualifications.map((qual, index) => (
                    <li key={index}>{qual}</li>
                  ))}
                </ul>
              </div>
            )}

            {selectedJob.benefits && selectedJob.benefits.length > 0 && (
              <div className="job-details-section">
                <h3>Benefits</h3>
                <div className="benefits-grid">
                  {Array.isArray(selectedJob?.benefits) && selectedJob.benefits.map((benefit, index) => (
                    <div key={index} className="benefit-item">
                      <span className="benefit-icon">✓</span>
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="job-details-footer">
              <div className="posted-date">
                Posted: {new Date(selectedJob.postedDate).toLocaleDateString()}
              </div>
              <div className="modal-actions">
                {appliedJobIds.includes(selectedJob._id) ? (
                  <button className="btn-applied" disabled>✓ Already Applied</button>
                ) : (
                  <button className="btn-apply-modal" onClick={() => {
                    setShowJobDetailsModal(false);
                    handleApplyClick(selectedJob);
                  }}>
                    Apply Now
                  </button>
                )}
                <button 
                  className={`btn-save-modal ${savedJobIds.includes(selectedJob._id) ? 'saved' : ''}`}
                  onClick={() => handleSaveJob(selectedJob._id)}
                >
                  {savedJobIds.includes(selectedJob._id) ? '⭐ Saved' : '💾 Save Job'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;



  