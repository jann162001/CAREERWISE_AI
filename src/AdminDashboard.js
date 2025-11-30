import React, { useState, useEffect, useCallback } from 'react';
import './AdminDashboard.css';
import './admin-messages.css';
import './report-modal-clean.css';
import './minimalist-modal.css';

function AdminDashboard({ onLogout }) {
    const [activePage, setActivePage] = useState(() => {
        // Restore the last active page from localStorage
        return localStorage.getItem('adminActivePage') || 'dashboard';
    });
    const [adminData, setAdminData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [jobs, setJobs] = useState([]);
    const [monitoringFilter, setMonitoringFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [editingJob, setEditingJob] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showJobDetailsModal, setShowJobDetailsModal] = useState(false);
    const [selectedJobDetails, setSelectedJobDetails] = useState(null);
    const [showMatchedApplicantsModal, setShowMatchedApplicantsModal] = useState(false);
    const [matchedApplicants, setMatchedApplicants] = useState([]);
    const [selectedJobForMatching, setSelectedJobForMatching] = useState(null);
    const [showReportModal, setShowReportModal] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);
    const [reportData, setReportData] = useState(null);
    
    // Applicant Management State
    const [applications, setApplications] = useState([]);
    const [applicantFilter, setApplicantFilter] = useState('all');
    const [applicantSearch, setApplicantSearch] = useState('');
    const [selectedApplication, setSelectedApplication] = useState(null);
    const [showApplicantModal, setShowApplicantModal] = useState(false);
    const [showInterviewModal, setShowInterviewModal] = useState(false);
    const [showNotesModal, setShowNotesModal] = useState(false);
    const [noteContent, setNoteContent] = useState('');
    const [interviewData, setInterviewData] = useState({
        date: '',
        location: '',
        notes: ''
    });
    const [applicationStats, setApplicationStats] = useState({
        total: 0,
        new: 0,
        underReview: 0,
        shortlisted: 0,
        forInterview: 0,
        hired: 0,
        rejected: 0
    });
    
    // Messages State
    const [selectedMessageUser, setSelectedMessageUser] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loadingMessages, setLoadingMessages] = useState(false);
    
    // Dashboard filter state
    const [dashboardJobFilter, setDashboardJobFilter] = useState('all');
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(20);
    
    const [stats, setStats] = useState({
        totalJobs: 0,
        activeJobs: 0,
        totalUsers: 0,
        totalApplications: 0
    });
    const [jobFormData, setJobFormData] = useState({
        jobTitle: '',
        company: '',
        city: '',
        state: '',
        country: '',
        workArrangement: '',
        jobType: '',
        industry: '',
        department: '',
        description: '',
        responsibilities: '',
        experienceLevel: '',
        minExperience: '',
        maxExperience: '',
        educationDegree: '',
        fieldOfStudy: '',
        requiredSkills: '',
        preferredSkills: '',
        requiredCertifications: '',
        minSalary: '',
        maxSalary: '',
        currency: 'USD',
        benefits: '',
        numberOfOpenings: 1,
        applicationDeadline: '',
        status: 'Active',
        contactEmail: '',
        contactPhone: ''
    });

    // Messaging Functions (defined early for useEffect dependency)
    const fetchConversations = useCallback(async () => {
        if (!adminData?.id) return;
        
        try {
            const response = await fetch(`http://localhost:3001/api/messages/conversations/${adminData.id}?userType=Admin`);
            const data = await response.json();
            setConversations(data);
        } catch (error) {
            console.error('Error fetching conversations:', error);
        }
    }, [adminData?.id]);

    const startOrGetConversation = useCallback(async (userId, applicationId = null, jobId = null) => {
        if (!adminData?.id) return;
        
        try {
            const response = await fetch('http://localhost:3001/api/messages/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userId,
                    adminId: adminData.id,
                    applicationId,
                    jobId
                })
            });
            
            const data = await response.json();
            setActiveConversation(data.conversation);
            setMessages(data.conversation.messages || []);
            fetchConversations(); // Refresh conversation list
        } catch (error) {
            console.error('Error starting conversation:', error);
        }
    }, [adminData?.id, fetchConversations]);

    useEffect(() => {
        fetchAdminInfo();
        fetchStats();
        if (activePage === 'viewJobs' || activePage === 'monitoring') {
            fetchJobs();
        }
        
        // Check if user was selected from applicant profile for messaging
        if (activePage === 'messages') {
            fetchConversations();
            
            const storedUser = localStorage.getItem('selectedMessageUser');
            if (storedUser) {
                const userData = JSON.parse(storedUser);
                setSelectedMessageUser(userData);
                // Start conversation with the selected user
                startOrGetConversation(userData.id);
                localStorage.removeItem('selectedMessageUser');
            }
        }
    }, [activePage, fetchConversations, startOrGetConversation]);

    // Save active page to localStorage whenever it changes
    const changeActivePage = (page) => {
        setActivePage(page);
        localStorage.setItem('adminActivePage', page);
    };

    const fetchAdminInfo = async () => {
        try {
            // First, check if we have cached admin data and use it immediately
            const cachedAdmin = localStorage.getItem('adminData');
            if (cachedAdmin) {
                setAdminData(JSON.parse(cachedAdmin));
            }

            // Then try to fetch fresh data from server
            const response = await fetch('http://localhost:3001/api/admin/current', {
                credentials: 'include'
            });
            const data = await response.json();
            if (data.success) {
                setAdminData(data.admin);
                // Update localStorage with fresh data
                localStorage.setItem('adminData', JSON.stringify(data.admin));
            }
            // If fetch fails but we have cached data, just continue with cached data
        } catch (error) {
            console.error('Error fetching admin data:', error);
            // On error, try to use cached admin data
            const cachedAdmin = localStorage.getItem('adminData');
            if (cachedAdmin) {
                setAdminData(JSON.parse(cachedAdmin));
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await fetch('http://localhost:3001/api/jobs/stats/overview', {
                credentials: 'include'
            });
            const data = await response.json();
            if (data.success) {
                setStats(data.stats);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const fetchJobs = async () => {
        try {
            const response = await fetch('http://localhost:3001/api/jobs/all?limit=100', {
                credentials: 'include'
            });
            const data = await response.json();
            if (data.success) {
                setJobs(data.jobs);
            }
        } catch (error) {
            console.error('Error fetching jobs:', error);
        }
    };

    const handleJobFormChange = (e) => {
        const { name, value } = e.target;
        setJobFormData({
            ...jobFormData,
            [name]: value
        });
    };

    const handleDeleteJob = async (jobId) => {
        if (!window.confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:3001/api/jobs/${jobId}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            const data = await response.json();
            
            if (data.success) {
                alert('Job deleted successfully!');
                fetchJobs();
                fetchStats();
            } else {
                alert(data.message || 'Failed to delete job');
            }
        } catch (error) {
            console.error('Error deleting job:', error);
            alert('Error deleting job. Please try again.');
        }
    };

    const handleUpdateJobStatus = async (jobId, newStatus) => {
        try {
            const response = await fetch(`http://localhost:3001/api/jobs/${jobId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ status: newStatus })
            });
            const data = await response.json();
            
            if (data.success) {
                alert(`Job status updated to ${newStatus}!`);
                fetchJobs();
                fetchStats();
            } else {
                alert(data.message || 'Failed to update job status');
            }
        } catch (error) {
            console.error('Error updating job status:', error);
            alert('Error updating job status. Please try again.');
        }
    };

    const handleEditJob = (job) => {
        setEditingJob(job);
        setJobFormData({
            jobTitle: job.jobTitle || '',
            company: job.company || '',
            city: job.location?.city || '',
            state: job.location?.state || '',
            country: job.location?.country || '',
            workArrangement: job.workArrangement || '',
            jobType: job.jobType || '',
            industry: job.industry || '',
            department: job.department || '',
            description: job.description || '',
            responsibilities: Array.isArray(job.responsibilities) ? job.responsibilities.join('\n') : '',
            experienceLevel: job.experienceLevel || '',
            minExperience: job.yearsOfExperienceRequired?.min || '',
            maxExperience: job.yearsOfExperienceRequired?.max || '',
            educationDegree: job.educationRequired?.degree || '',
            fieldOfStudy: Array.isArray(job.educationRequired?.fieldOfStudy) ? job.educationRequired.fieldOfStudy.join(', ') : '',
            requiredSkills: Array.isArray(job.requiredSkills) ? job.requiredSkills.map(s => s.name).join(', ') : '',
            preferredSkills: Array.isArray(job.preferredSkills) ? job.preferredSkills.join(', ') : '',
            requiredCertifications: Array.isArray(job.requiredCertifications) ? job.requiredCertifications.join(', ') : '',
            minSalary: job.salary?.min || '',
            maxSalary: job.salary?.max || '',
            currency: job.salary?.currency || 'USD',
            benefits: Array.isArray(job.benefits) ? job.benefits.join(', ') : '',
            numberOfOpenings: job.numberOfOpenings || 1,
            applicationDeadline: job.applicationDeadline ? new Date(job.applicationDeadline).toISOString().split('T')[0] : '',
            status: job.status || 'Active',
            contactEmail: job.contactEmail || '',
            contactPhone: job.contactPhone || ''
        });
        setShowEditModal(true);
    };

    const handleUpdateJob = async (e) => {
        e.preventDefault();
        // Check if we're editing or creating
        if (editingJob) {
            // Prepare job data for backend (convert comma-separated fields to arrays)
            const jobDataToSend = {
                ...jobFormData,
                requiredSkills: jobFormData.requiredSkills
                    ? jobFormData.requiredSkills.split(',').map(s => ({ name: s.trim() })).filter(s => s.name)
                    : [],
                preferredSkills: jobFormData.preferredSkills
                    ? jobFormData.preferredSkills.split(',').map(s => s.trim()).filter(Boolean)
                    : [],
                requiredCertifications: jobFormData.requiredCertifications
                    ? jobFormData.requiredCertifications.split(',').map(s => s.trim()).filter(Boolean)
                    : [],
                benefits: jobFormData.benefits
                    ? jobFormData.benefits.split(',').map(s => s.trim()).filter(Boolean)
                    : [],
            };
            try {
                const response = await fetch(`http://localhost:3001/api/jobs/${editingJob._id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify(jobDataToSend)
                });
                let data = null;
                let errorText = '';
                if (response.ok) {
                    data = await response.json();
                    if (data.success) {
                        alert('Job updated successfully!');
                        setEditingJob(null);
                        setShowEditModal(false);
                        fetchJobs();
                        fetchStats();
                    } else {
                        alert(data.message || 'Failed to update job');
                    }
                } else {
                    // Try to parse error message from response
                    try {
                        data = await response.json();
                        errorText = data.message || response.statusText;
                    } catch (err) {
                        errorText = response.statusText;
                    }
                    console.error('Job update failed:', response.status, errorText, data);
                    alert(`Error updating job: ${errorText}`);
                }
            } catch (error) {
                console.error('Error updating job (network or code):', error);
                alert('Error updating job. Please try again.');
            }
        } else {
            // Create new job
            console.log('Submitting job with data:', jobFormData);
            
            try {
                const response = await fetch('http://localhost:3001/api/jobs/create', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify(jobFormData)
                });

                const data = await response.json();
                
                console.log('Job creation response:', data);
                
                if (data.success) {
                    alert('Job posted successfully!');
                    // Reset form
                    setJobFormData({
                        jobTitle: '',
                        company: '',
                        city: '',
                        state: '',
                        country: '',
                        workArrangement: '',
                        jobType: '',
                        industry: '',
                        department: '',
                        description: '',
                        responsibilities: '',
                        experienceLevel: '',
                        minExperience: '',
                        maxExperience: '',
                        educationDegree: '',
                        fieldOfStudy: '',
                        requiredSkills: '',
                        preferredSkills: '',
                        requiredCertifications: '',
                        minSalary: '',
                        maxSalary: '',
                        currency: 'USD',
                        benefits: '',
                        numberOfOpenings: 1,
                        applicationDeadline: '',
                        status: 'Active',
                        contactEmail: '',
                        contactPhone: ''
                    });
                    // Navigate to view jobs
                    setActivePage('viewJobs');
                    fetchStats();
                } else {
                    alert('Error: ' + (data.message || 'Failed to post job'));
                    console.error('Job posting failed:', data);
                }
            } catch (error) {
                console.error('Error posting job:', error);
                alert('Error posting job: ' + error.message + '\nPlease check console for details.');
            }
        }
    };

    const getFilteredJobs = () => {
        let filtered = jobs;

        // Apply status filter
        if (monitoringFilter !== 'all') {
            filtered = filtered.filter(job => job.status.toLowerCase() === monitoringFilter.toLowerCase());
        }

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(job => 
                job.jobTitle.toLowerCase().includes(query) ||
                job.company.toLowerCase().includes(query) ||
                job.industry.toLowerCase().includes(query) ||
                job.location?.city?.toLowerCase().includes(query)
            );
        }

        return filtered;
    };

    const handleLogout = async () => {
        try {
            await fetch('http://localhost:3001/api/admin/logout', {
                method: 'POST',
                credentials: 'include'
            });
            // Clear localStorage on logout
            localStorage.removeItem('adminData');
            onLogout();
        } catch (error) {
            console.error('Logout error:', error);
            // Clear localStorage even if logout request fails
            localStorage.removeItem('adminData');
            onLogout();
        }
    };

    // Applicant Management Functions
    const fetchApplications = useCallback(async () => {
        try {
            const url = new URL('http://localhost:3001/api/applications/all');
            if (applicantFilter !== 'all') {
                url.searchParams.append('status', applicantFilter);
            }
            if (applicantSearch) {
                url.searchParams.append('search', applicantSearch);
            }

            console.log('🔍 Fetching applications from:', url.toString());

            const response = await fetch(url, {
                credentials: 'include'
            });
            const data = await response.json();
            
            console.log('📋 Fetched applications data:', data);
            console.log('📊 Data type:', Array.isArray(data) ? 'Array' : typeof data);
            console.log('📊 Data length:', Array.isArray(data) ? data.length : 'N/A');
            
            // Set applications array from response
            if (Array.isArray(data)) {
                console.log('✅ Setting applications array with', data.length, 'items');
                setApplications(data);
            } else if (data.applications && Array.isArray(data.applications)) {
                console.log('✅ Setting applications from data.applications with', data.applications.length, 'items');
                setApplications(data.applications);
            } else {
                console.error('❌ Invalid applications data format:', data);
                setApplications([]);
            }
        } catch (error) {
            console.error('❌ Error fetching applications:', error);
            setApplications([]);
        }
    }, [applicantFilter, applicantSearch]);

    const fetchApplicationStats = useCallback(async () => {
        try {
            const response = await fetch('http://localhost:3001/api/applications/stats/summary', {
                credentials: 'include'
            });
            const data = await response.json();
            setApplicationStats(data);
        } catch (error) {
            console.error('Error fetching application stats:', error);
        }
    }, []);

    const handleStatusChange = async (applicationId, newStatus) => {
        try {
            const response = await fetch(`http://localhost:3001/api/applications/${applicationId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ 
                    status: newStatus,
                    adminName: adminData?.username || 'Admin'
                })
            });

            if (response.ok) {
                // If status changed to "For Interview", schedule interview record
                if (newStatus === 'For Interview') {
                    const application = applications.find(app => app._id === applicationId);
                    if (application) {
                        try {
                            await fetch('http://localhost:3001/api/interviews/schedule', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                credentials: 'include',
                                body: JSON.stringify({
                                    applicationId: application._id,
                                    userId: application.user._id,
                                    jobId: application.job._id,
                                    scheduledById: adminData.id,
                                    scheduledByName: adminData.fullName || adminData.username,
                                    interviewDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default: 1 week from now
                                    interviewLocation: 'To be determined',
                                    interviewNotes: 'Interview scheduled by admin'
                                })
                            });
                            console.log('✅ Interview record created');
                        } catch (interviewError) {
                            console.error('❌ Error creating interview record:', interviewError);
                        }
                    }
                }
                
                alert('Status updated successfully');
                fetchApplications();
                fetchApplicationStats();
            }
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update status');
        }
    };

    const handleViewApplicant = async (application) => {
        try {
            console.log('🔍 Fetching application details for:', application._id);
            const response = await fetch(`http://localhost:3001/api/applications/${application._id}`, {
                credentials: 'include'
            });
            const data = await response.json();
            console.log('📋 Received application data:', data);
            console.log('👤 User data:', data.user);
            console.log('💼 Job data:', data.job);
            console.log('📝 Profile data:', data.profile);
            console.log('💰 Portfolio:', data.portfolio);
            console.log('💵 Expected Salary:', data.expectedSalary);
            console.log('📅 Available Start Date:', data.availableStartDate);
            setSelectedApplication(data);
            setShowApplicantModal(true);

            // Track profile view using the fetched data
            if (adminData && data.user) {
                try {
                    console.log('📊 Admin Data for tracking:', adminData);
                    console.log('🆔 Admin ID:', adminData.id);
                    console.log('👤 Profile Owner ID:', data.user._id);
                    
                    const trackResponse = await fetch('http://localhost:3001/api/profile-views/track', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({
                            profileOwnerId: data.user._id,
                            viewerId: adminData.id,
                            viewerName: adminData.fullName || adminData.username,
                            applicationId: application._id
                        })
                    });
                    const trackData = await trackResponse.json();
                    console.log('✅ Profile view tracked:', trackData);
                } catch (viewError) {
                    console.error('❌ Error tracking profile view:', viewError);
                }
            }
        } catch (error) {
            console.error('❌ Error fetching applicant details:', error);
        }
    };

    const handleScheduleInterview = (application) => {
        setSelectedApplication(application);
        setShowInterviewModal(true);
    };

    const handleSubmitInterview = async () => {
        try {
            const response = await fetch(`http://localhost:3001/api/applications/${selectedApplication._id}/interview`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    interviewDate: interviewData.date,
                    interviewLocation: interviewData.location,
                    interviewNotes: interviewData.notes,
                    adminName: adminData?.username || 'Admin'
                })
            });

            if (response.ok) {
                alert('Interview scheduled successfully');
                setShowInterviewModal(false);
                setInterviewData({ date: '', location: '', notes: '' });
                fetchApplications();
            }
        } catch (error) {
            console.error('Error scheduling interview:', error);
            alert('Failed to schedule interview');
        }
    };

    const handleAddNote = async () => {
        if (!noteContent.trim()) return;

        try {
            const response = await fetch(`http://localhost:3001/api/applications/${selectedApplication._id}/notes`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    author: adminData?.username || 'Admin',
                    content: noteContent
                })
            });

            if (response.ok) {
                alert('Note added successfully');
                setNoteContent('');
                setShowNotesModal(false);
                handleViewApplicant(selectedApplication);
            }
        } catch (error) {
            console.error('Error adding note:', error);
            alert('Failed to add note');
        }
    };

    const handleExportApplications = async () => {
        try {
            window.open('http://localhost:3001/api/applications/export/csv', '_blank');
        } catch (error) {
            console.error('Error exporting applications:', error);
            alert('Failed to export applications');
        }
    };

    const handleViewReport = async (reportType) => {
        setSelectedReport(reportType);
        setShowReportModal(true);
        setReportData(null);
        
        try {
            const response = await fetch(`http://localhost:3001/api/reports/${reportType}`, {
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch report data');
            }
            
            const data = await response.json();
            setReportData(data);
        } catch (error) {
            console.error('Error fetching report:', error);
            alert('Error loading report data');
        }
    };

    const handleViewMatchedApplicants = async (job) => {
        setSelectedJobForMatching(job);
        setShowMatchedApplicantsModal(true);
        
        try {
            // Fetch all applications for this job
            const response = await fetch(`http://localhost:3001/api/applications/all?jobId=${job._id}`, {
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch applications');
            }
            
            const data = await response.json();
            const jobApplications = data.applications || [];
            
            // Filter matched applicants based on skills and profile matching
            const matched = jobApplications.filter(app => {
                if (!app.profile) return false;
                
                const jobSkills = job.requiredSkills || [];
                const jobIndustry = job.industry?.toLowerCase() || '';
                const jobTitle = job.jobTitle?.toLowerCase() || '';
                
                const applicantSkills = app.profile.skills || [];
                const applicantTitle = app.profile.professionalTitle?.toLowerCase() || '';
                const applicantIndustry = app.profile.industry?.toLowerCase() || '';
                
                // Check skill match
                const skillMatch = jobSkills.some(jobSkill => {
                    const jobSkillName = (typeof jobSkill === 'object' ? jobSkill.name : jobSkill).toLowerCase();
                    return applicantSkills.some(appSkill => {
                        const appSkillName = (typeof appSkill === 'object' ? appSkill.name : appSkill).toLowerCase();
                        return appSkillName.includes(jobSkillName) || jobSkillName.includes(appSkillName);
                    });
                });
                
                // Check title/industry relevance
                const titleMatch = applicantTitle.includes(jobTitle) || jobTitle.includes(applicantTitle);
                const industryMatch = applicantIndustry.includes(jobIndustry) || jobIndustry.includes(applicantIndustry);
                
                // Consider matched if they have skill match OR title/industry relevance
                return skillMatch || titleMatch || industryMatch;
            });
            
            setMatchedApplicants(matched);
        } catch (error) {
            console.error('Error fetching matched applicants:', error);
            alert('Error loading matched applicants');
            setMatchedApplicants([]);
        }
    };

    const selectConversation = async (conversation) => {
        setActiveConversation(conversation);
        setMessages(conversation.messages || []);
        
        // Mark messages as read
        try {
            await fetch(`http://localhost:3001/api/messages/conversation/${conversation._id}/read`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userType: 'Admin' })
            });
            fetchConversations(); // Refresh to update unread counts
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !activeConversation || !adminData) return;
        
        setLoadingMessages(true);
        try {
            const response = await fetch(`http://localhost:3001/api/messages/conversation/${activeConversation._id}/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    senderId: adminData.id,
                    senderType: 'Admin',
                    senderUsername: adminData.username || adminData.fullName,
                    content: newMessage
                })
            });
            
            const data = await response.json();
            setMessages(data.conversation.messages);
            setNewMessage('');
            fetchConversations(); // Refresh conversation list
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message');
        } finally {
            setLoadingMessages(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const handleViewJobDetails = (job) => {
        setSelectedJobDetails(job);
        setShowJobDetailsModal(true);
    };

    useEffect(() => {
        console.log('🔄 useEffect triggered - activePage:', activePage);
        if (activePage === 'applicants') {
            console.log('✅ Loading applicants page - fetching data...');
            fetchApplications();
            fetchApplicationStats();
            
            // Auto-refresh every 10 seconds to show new applications
            const intervalId = setInterval(() => {
                console.log('🔄 Auto-refreshing applications...');
                fetchApplications();
                fetchApplicationStats();
            }, 10000);
            
            // Cleanup interval on unmount or page change
            return () => clearInterval(intervalId);
        }
    }, [activePage, applicantFilter, applicantSearch, fetchApplications, fetchApplicationStats]);

    const renderPageContent = () => {
        switch (activePage) {
            case 'dashboard':
                // Calculate job statistics
                const allJobsCount = jobs.length;
                const activeJobsCount = jobs.filter(j => j.status === 'Active').length;
                const closedJobsCount = jobs.filter(j => j.status === 'Closed').length;
                const draftJobsCount = jobs.filter(j => j.status === 'Draft').length;
                const onHoldJobsCount = jobs.filter(j => j.status === 'On Hold').length;
                
                // Filter jobs based on selected filter
                const getDashboardFilteredJobs = () => {
                    switch(dashboardJobFilter) {
                        case 'active': return jobs.filter(j => j.status === 'Active');
                        case 'closed': return jobs.filter(j => j.status === 'Closed');
                        case 'draft': return jobs.filter(j => j.status === 'Draft');
                        case 'onhold': return jobs.filter(j => j.status === 'On Hold');
                        default: return jobs;
                    }
                };
                
                const dashboardFilteredJobs = getDashboardFilteredJobs();
                
                // Calculate application stats
                const underReviewCount = applications.filter(a => a.status === 'Under Review').length;
                const shortlistedCount = applications.filter(a => a.status === 'Shortlisted').length;
                const forInterviewCount = applications.filter(a => a.status === 'For Interview').length;
                const hiredCount = applications.filter(a => a.status === 'Hired').length;
                
                // Prepare chart data for jobs
                const topJobs = jobs.slice(0, 3).map(job => {
                    const jobApplications = applications.filter(app => app.job?._id === job._id || app.job?.toString() === job._id);
                    return {
                        title: job.jobTitle,
                        applications: jobApplications.length,
                        views: job.views || 0
                    };
                });
                
                return (
                    <div className="admin-page-content modern-dashboard">
                        {/* Top Stats Cards */}
                        <div className="dashboard-stats-row">
                            <div className="dashboard-stat-card">
                                <div className="stat-label">Total Jobs</div>
                                <div className="stat-value">{stats.totalJobs}</div>
                            </div>
                            <div className="dashboard-stat-card">
                                <div className="stat-label">Active Jobs</div>
                                <div className="stat-value">{stats.activeJobs}</div>
                            </div>
                            <div className="dashboard-stat-card">
                                <div className="stat-label">Applications</div>
                                <div className="stat-value">{stats.totalApplications}</div>
                            </div>
                        </div>

                        {/* Application Status Overview Bar Graph */}
                        <div className="user-activity-section" style={{marginTop: 32, marginBottom: 32}}>
                            <h3>Application Status Overview</h3>
                            <div className="activity-chart">
                                <svg width="100%" height="220" viewBox="0 0 600 220">
                                    {/* X-axis */}
                                    <line x1="50" y1="180" x2="570" y2="180" stroke="#e5e7eb" strokeWidth="2"/>
                                    {/* Y-axis labels */}
                                    <text x="20" y="60" fontSize="12" fill="#6b7280">1</text>
                                    <text x="25" y="180" fontSize="12" fill="#6b7280">0</text>
                                    {/* Bar Graph for Statuses with minimum bar height */}
                                    {(() => {
                                        const statusData = [
                                            { label: 'New', value: applicationStats.new, color: '#6366f1' },
                                            { label: 'Under Review', value: applicationStats.underReview, color: '#3b82f6' },
                                            { label: 'Shortlisted', value: applicationStats.shortlisted, color: '#f59e42' },
                                            { label: 'For Interview', value: applicationStats.forInterview, color: '#06b6d4' },
                                            { label: 'Hired', value: applicationStats.hired, color: '#10b981' },
                                            { label: 'Rejected', value: applicationStats.rejected, color: '#ef4444' }
                                        ];
                                        const maxVal = Math.max(...statusData.map(s => s.value), 1);
                                        const minBarHeight = 12; // px
                                        return statusData.map((s, i) => {
                                            let barHeight = (s.value / maxVal) * 120;
                                            if (s.value === 0) barHeight = minBarHeight;
                                            return (
                                                <g key={s.label}>
                                                    <rect x={70 + i * 80} y={180 - barHeight} width="40" height={barHeight} fill={s.color} rx="8" />
                                                    <text x={90 + i * 80} y={195} fontSize="13" fill="#374151" textAnchor="middle">{s.label}</text>
                                                    <text x={90 + i * 80} y={170 - barHeight} fontSize="14" fill="#111827" textAnchor="middle" fontWeight="bold">{s.value}</text>
                                                </g>
                                            );
                                        });
                                    })()}
                                </svg>
                            </div>
                        </div>

                        {/* Main Content Grid */}
                        <div className="dashboard-grid">
                            {/* Right Column */}
                            <div className="dashboard-right-column">
                                {/* Reports & Analytics */}
                                <div className="dashboard-section reports-analytics-section">
                                    <h2 className="section-title">Reports & Analytics</h2>
                                    
                                    <div className="analytics-charts">
                                        {/* Bar Chart */}
                                        <div className="bar-chart">
                                            <div className="chart-legend">
                                                <span className="legend-item">
                                                    <span className="legend-color" style={{backgroundColor: '#667eea'}}></span>
                                                    Applications
                                                </span>
                                                <span className="legend-item">
                                                    <span className="legend-color" style={{backgroundColor: '#06b6d4'}}></span>
                                                    Views
                                                </span>
                                            </div>
                                            <div className="bars-container">
                                                {topJobs.map((job, idx) => {
                                                    const maxVal = Math.max(...topJobs.map(j => Math.max(j.applications, j.views)), 1);
                                                    return (
                                                        <div key={idx} className="bar-group">
                                                            <div className="bars">
                                                                <div 
                                                                    className="bar bar-applications" 
                                                                    style={{height: `${(job.applications / maxVal) * 100}px`}}
                                                                    title={`${job.applications} applications`}
                                                                ></div>
                                                                <div 
                                                                    className="bar bar-views" 
                                                                    style={{height: `${(job.views / maxVal) * 100}px`}}
                                                                    title={`${job.views} views`}
                                                                ></div>
                                                            </div>
                                                            <div className="bar-label">{job.title.split(' ')[0]}</div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                        
                                        {/* Donut Chart */}
                                        <div className="donut-chart">
                                            <svg width="120" height="120" viewBox="0 0 120 120">
                                                <circle cx="60" cy="60" r="40" fill="none" stroke="#e5e7eb" strokeWidth="20"/>
                                                <circle 
                                                    cx="60" cy="60" r="40" 
                                                    fill="none" 
                                                    stroke="#667eea" 
                                                    strokeWidth="20"
                                                    strokeDasharray={`${(applications.length / (applications.length + 100)) * 251.2} 251.2`}
                                                    transform="rotate(-90 60 60)"
                                                />
                                            </svg>
                                            <div className="donut-legend">
                                                <div className="legend-item">
                                                    <span className="legend-dot" style={{backgroundColor: '#667eea'}}></span>
                                                    Applications
                                                </div>
                                                <div className="legend-item">
                                                    <span className="legend-dot" style={{backgroundColor: '#06b6d4'}}></span>
                                                    Views
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            
            case 'addJob':
                return (
                    <div className="admin-page-content">
                        <h1>Add New Job</h1>
                        <div className="job-form-container">
                            <form className="job-form" onSubmit={handleUpdateJob}>
                                <h3>Basic Information</h3>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Job Title *</label>
                                        <input 
                                            type="text" 
                                            name="jobTitle"
                                            value={jobFormData.jobTitle}
                                            onChange={handleJobFormChange}
                                            placeholder="e.g., Senior Software Engineer" 
                                            required 
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Company *</label>
                                        <input 
                                            type="text" 
                                            name="company"
                                            value={jobFormData.company}
                                            onChange={handleJobFormChange}
                                            placeholder="Company name" 
                                            required 
                                        />
                                    </div>
                                </div>
                                
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Industry</label>
                                        <input 
                                            type="text" 
                                            name="industry"
                                            value={jobFormData.industry}
                                            onChange={handleJobFormChange}
                                            placeholder="e.g., Technology, Healthcare" 
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Department</label>
                                        <input 
                                            type="text" 
                                            name="department"
                                            value={jobFormData.department}
                                            onChange={handleJobFormChange}
                                            placeholder="e.g., Engineering, Marketing" 
                                        />
                                    </div>
                                </div>
                                
                                <div className="form-group">
                                    <label>Job Description *</label>
                                    <textarea 
                                        rows="4" 
                                        name="description"
                                        value={jobFormData.description}
                                        onChange={handleJobFormChange}
                                        placeholder="Detailed job description" 
                                        required
                                    ></textarea>
                                </div>
                                
                                <div className="form-group">
                                    <label>Key Responsibilities</label>
                                    <textarea 
                                        rows="3" 
                                        name="responsibilities"
                                        value={jobFormData.responsibilities}
                                        onChange={handleJobFormChange}
                                        placeholder="List main responsibilities (one per line)"
                                    ></textarea>
                                </div>
                                
                                <h3>Location & Work Arrangement</h3>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>City</label>
                                        <input 
                                            type="text" 
                                            name="city"
                                            value={jobFormData.city}
                                            onChange={handleJobFormChange}
                                            placeholder="City" 
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>State/Province</label>
                                        <input 
                                            type="text" 
                                            name="state"
                                            value={jobFormData.state}
                                            onChange={handleJobFormChange}
                                            placeholder="State" 
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Country</label>
                                        <input 
                                            type="text" 
                                            name="country"
                                            value={jobFormData.country}
                                            onChange={handleJobFormChange}
                                            placeholder="Country" 
                                        />
                                    </div>
                                </div>
                                
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Work Arrangement *</label>
                                        <select 
                                            name="workArrangement"
                                            value={jobFormData.workArrangement}
                                            onChange={handleJobFormChange}
                                            required
                                        >
                                            <option value="">Select</option>
                                            <option>On-site</option>
                                            <option>Remote</option>
                                            <option>Hybrid</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Job Type *</label>
                                        <select 
                                            name="jobType"
                                            value={jobFormData.jobType}
                                            onChange={handleJobFormChange}
                                            required
                                        >
                                            <option value="">Select</option>
                                            <option>Full-time</option>
                                            <option>Part-time</option>
                                            <option>Contract</option>
                                            <option>Internship</option>
                                            <option>Freelance</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <h3>Requirements</h3>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Experience Level *</label>
                                        <select 
                                            name="experienceLevel"
                                            value={jobFormData.experienceLevel}
                                            onChange={handleJobFormChange}
                                            required
                                        >
                                            <option value="">Select</option>
                                            <option>Entry Level</option>
                                            <option>Mid Level</option>
                                            <option>Senior Level</option>
                                            <option>Lead/Manager</option>
                                            <option>Executive</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Years of Experience (Min)</label>
                                        <input 
                                            type="number" 
                                            name="minExperience"
                                            value={jobFormData.minExperience}
                                            onChange={handleJobFormChange}
                                            min="0" 
                                            placeholder="e.g., 3" 
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Years of Experience (Max)</label>
                                        <input 
                                            type="number" 
                                            name="maxExperience"
                                            value={jobFormData.maxExperience}
                                            onChange={handleJobFormChange}
                                            min="0" 
                                            placeholder="e.g., 5" 
                                        />
                                    </div>
                                </div>
                                
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Education Required</label>
                                        <select 
                                            name="educationDegree"
                                            value={jobFormData.educationDegree}
                                            onChange={handleJobFormChange}
                                        >
                                            <option>Not Required</option>
                                            <option>High School</option>
                                            <option>Associate</option>
                                            <option>Bachelor's</option>
                                            <option>Master's</option>
                                            <option>PhD</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Field of Study</label>
                                        <input 
                                            type="text" 
                                            name="fieldOfStudy"
                                            value={jobFormData.fieldOfStudy}
                                            onChange={handleJobFormChange}
                                            placeholder="e.g., Computer Science" 
                                        />
                                    </div>
                                </div>
                                
                                <div className="form-group">
                                    <label>Required Skills (comma-separated) *</label>
                                    <input 
                                        type="text" 
                                        name="requiredSkills"
                                        value={jobFormData.requiredSkills}
                                        onChange={handleJobFormChange}
                                        placeholder="e.g., JavaScript, React, Node.js" 
                                        required 
                                    />
                                    <small>These skills will be used for job matching</small>
                                </div>
                                
                                <div className="form-group">
                                    <label>Preferred Skills (comma-separated)</label>
                                    <input 
                                        type="text" 
                                        name="preferredSkills"
                                        value={jobFormData.preferredSkills}
                                        onChange={handleJobFormChange}
                                        placeholder="e.g., TypeScript, AWS, Docker" 
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label>Required Certifications (comma-separated)</label>
                                    <input 
                                        type="text" 
                                        name="requiredCertifications"
                                        value={jobFormData.requiredCertifications}
                                        onChange={handleJobFormChange}
                                        placeholder="e.g., PMP, AWS Certified" 
                                    />
                                </div>
                                
                                <h3>Compensation & Benefits</h3>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Minimum Salary</label>
                                        <input 
                                            type="number" 
                                            name="minSalary"
                                            value={jobFormData.minSalary}
                                            onChange={handleJobFormChange}
                                            placeholder="e.g., 80000" 
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Maximum Salary</label>
                                        <input 
                                            type="number" 
                                            name="maxSalary"
                                            value={jobFormData.maxSalary}
                                            onChange={handleJobFormChange}
                                            placeholder="e.g., 120000" 
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Currency</label>
                                        <select 
                                            name="currency"
                                            value={jobFormData.currency}
                                            onChange={handleJobFormChange}
                                        >
                                            <option>USD</option>
                                            <option>EUR</option>
                                            <option>GBP</option>
                                            <option>CAD</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div className="form-group">
                                    <label>Benefits (comma-separated)</label>
                                    <input 
                                        type="text" 
                                        name="benefits"
                                        value={jobFormData.benefits}
                                        onChange={handleJobFormChange}
                                        placeholder="e.g., Health Insurance, 401k, Remote Work" 
                                    />
                                </div>
                                
                                <h3>Application Details</h3>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Number of Openings</label>
                                        <input 
                                            type="number" 
                                            name="numberOfOpenings"
                                            value={jobFormData.numberOfOpenings}
                                            onChange={handleJobFormChange}
                                            min="1" 
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Application Deadline</label>
                                        <input 
                                            type="date" 
                                            name="applicationDeadline"
                                            value={jobFormData.applicationDeadline}
                                            onChange={handleJobFormChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Status</label>
                                        <select 
                                            name="status"
                                            value={jobFormData.status}
                                            onChange={handleJobFormChange}
                                        >
                                            <option>Active</option>
                                            <option>Draft</option>
                                            <option>On Hold</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Contact Email</label>
                                        <input 
                                            type="email" 
                                            name="contactEmail"
                                            value={jobFormData.contactEmail}
                                            onChange={handleJobFormChange}
                                            placeholder="jobs@company.com" 
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Contact Phone</label>
                                        <input 
                                            type="tel" 
                                            name="contactPhone"
                                            value={jobFormData.contactPhone}
                                            onChange={handleJobFormChange}
                                            placeholder="(555) 123-4567" 
                                        />
                                    </div>
                                </div>
                                
                                <button type="submit" className="admin-btn-primary">Post Job</button>
                            </form>
                        </div>
                    </div>
                );
            
            case 'viewJobs':
                return (
                    <div className="admin-page-content">
                        <h1>View All Jobs</h1>
                        <div className="jobs-list-container">
                            {jobs.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-icon">📋</div>
                                    <p>No jobs posted yet</p>
                                    <button 
                                        className="admin-btn-primary"
                                        onClick={() => setActivePage('addJob')}
                                    >
                                        Post Your First Job
                                    </button>
                                </div>
                            ) : (
                                <div className="jobs-grid">
                                    {jobs.map(job => (
                                        <div key={job._id} className="job-card">
                                            <div className="job-card-header">
                                                <div>
                                                    <h3>{job.jobTitle}</h3>
                                                    <p className="company-name">{job.company}</p>
                                                </div>
                                                <span className={`status-badge status-${job.status.toLowerCase()}`}>
                                                    {job.status}
                                                </span>
                                            </div>
                                            <div className="job-card-details">
                                                <div className="job-detail-item">
                                                    <span className="detail-icon">📍</span>
                                                    <span>{job.location.city || 'Remote'}, {job.location.country || ''}</span>
                                                </div>
                                                <div className="job-detail-item">
                                                    <span className="detail-icon">💼</span>
                                                    <span>{job.jobType}</span>
                                                </div>
                                                <div className="job-detail-item">
                                                    <span className="detail-icon">🏢</span>
                                                    <span>{job.workArrangement}</span>
                                                </div>
                                                <div className="job-detail-item">
                                                    <span className="detail-icon">📊</span>
                                                    <span>{job.experienceLevel}</span>
                                                </div>
                                            </div>
                                            <div className="job-card-stats">
                                                <span>👁️ {job.views} views</span>
                                                <span>📝 {job.applications} applications</span>
                                            </div>
                                            <div className="job-card-actions">
                                                <button 
                                                    className="btn-view-details"
                                                    onClick={() => {
                                                        setSelectedJobDetails(job);
                                                        setShowJobDetailsModal(true);
                                                    }}
                                                >
                                                    📄 View Details
                                                </button>
                                                <button 
                                                    className="btn-matched-applicants"
                                                    onClick={() => handleViewMatchedApplicants(job)}
                                                >
                                                    👥 Match Applicants
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                );
            
            case 'monitoring':
                const filteredJobs = getFilteredJobs();
                return (
                    <div className="admin-page-content">
                        <h1>Job Post Monitoring</h1>
                        <div className="monitoring-container">
                            <div className="monitoring-header">
                                <div className="monitoring-filters">
                                    <button 
                                        className={`filter-btn ${monitoringFilter === 'all' ? 'active' : ''}`}
                                        onClick={() => setMonitoringFilter('all')}
                                    >
                                        All Jobs ({jobs.length})
                                    </button>
                                    <button 
                                        className={`filter-btn ${monitoringFilter === 'active' ? 'active' : ''}`}
                                        onClick={() => setMonitoringFilter('active')}
                                    >
                                        Active ({jobs.filter(j => j.status === 'Active').length})
                                    </button>
                                    <button 
                                        className={`filter-btn ${monitoringFilter === 'closed' ? 'active' : ''}`}
                                        onClick={() => setMonitoringFilter('closed')}
                                    >
                                        Closed ({jobs.filter(j => j.status === 'Closed').length})
                                    </button>
                                    <button 
                                        className={`filter-btn ${monitoringFilter === 'draft' ? 'active' : ''}`}
                                        onClick={() => setMonitoringFilter('draft')}
                                    >
                                        Draft ({jobs.filter(j => j.status === 'Draft').length})
                                    </button>
                                    <button 
                                        className={`filter-btn ${monitoringFilter === 'on hold' ? 'active' : ''}`}
                                        onClick={() => setMonitoringFilter('on hold')}
                                    >
                                        On Hold ({jobs.filter(j => j.status === 'On Hold').length})
                                    </button>
                                </div>
                                <div className="monitoring-search">
                                    <input 
                                        type="search" 
                                        placeholder="Search jobs by title, company, location..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="search-input"
                                    />
                                </div>
                            </div>
                            
                            {filteredJobs.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-icon">📋</div>
                                    <p>No job posts found</p>
                                    <small>{searchQuery ? 'Try adjusting your search' : 'Create your first job post'}</small>
                                </div>
                            ) : (
                                <div className="monitoring-grid">
                                    {filteredJobs.map(job => (
                                        <div key={job._id} className="monitoring-job-card">
                                            <div className="job-card-header">
                                                <div>
                                                    <h3>{job.jobTitle}</h3>
                                                    <p className="job-company">🏢 {job.company}</p>
                                                </div>
                                                <span className={`status-badge status-${job.status.toLowerCase().replace(' ', '-')}`}>
                                                    {job.status}
                                                </span>
                                            </div>
                                            
                                            <div className="job-card-details">
                                                <div className="detail-row">
                                                    <span>📍 {job.location?.city || 'Remote'}, {job.location?.country || ''}</span>
                                                    <span>💼 {job.workArrangement}</span>
                                                </div>
                                                <div className="detail-row">
                                                    <span>📊 {job.experienceLevel}</span>
                                                    <span>⏰ {job.jobType}</span>
                                                </div>
                                                <div className="detail-row">
                                                    <span>🏭 {job.industry}</span>
                                                    <span>📅 Posted: {new Date(job.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                {job.applicationDeadline && (
                                                    <div className="detail-row">
                                                        <span>⏰ Deadline: {new Date(job.applicationDeadline).toLocaleDateString()}</span>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="job-card-stats">
                                                <div className="stat-item">
                                                    <span className="stat-number">{job.views || 0}</span>
                                                    <span className="stat-label">Views</span>
                                                </div>
                                                <div className="stat-item">
                                                    <span className="stat-number">{job.applications || 0}</span>
                                                    <span className="stat-label">Applications</span>
                                                </div>
                                                <div className="stat-item">
                                                    <span className="stat-number">{job.numberOfOpenings || 1}</span>
                                                    <span className="stat-label">Openings</span>
                                                </div>
                                            </div>
                                            
                                            <div className="job-card-actions">
                                                <button 
                                                    className="btn-edit"
                                                    onClick={() => handleEditJob(job)}
                                                    title="Edit Job"
                                                >
                                                    ✏️ Edit
                                                </button>
                                                
                                                <div className="status-dropdown">
                                                    <select 
                                                        value={job.status}
                                                        onChange={(e) => handleUpdateJobStatus(job._id, e.target.value)}
                                                        className="status-select"
                                                    >
                                                        <option value="Active">Active</option>
                                                        <option value="Draft">Draft</option>
                                                        <option value="Closed">Closed</option>
                                                        <option value="On Hold">On Hold</option>
                                                    </select>
                                                </div>
                                                
                                                <button 
                                                    className="btn-delete"
                                                    onClick={() => handleDeleteJob(job._id)}
                                                    title="Delete Job"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                );
            
            case 'applicants':
                // Pagination logic
                const indexOfLastItem = currentPage * itemsPerPage;
                const indexOfFirstItem = indexOfLastItem - itemsPerPage;
                const currentApplications = applications.slice(indexOfFirstItem, indexOfLastItem);
                const totalPages = Math.ceil(applications.length / itemsPerPage);
                
                const handlePageChange = (pageNumber) => {
                    setCurrentPage(pageNumber);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                };
                
                const handlePreviousPage = () => {
                    if (currentPage > 1) {
                        setCurrentPage(currentPage - 1);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                };
                
                const handleNextPage = () => {
                    if (currentPage < totalPages) {
                        setCurrentPage(currentPage + 1);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                };
                
                // Generate page numbers to display
                const getPageNumbers = () => {
                    const pageNumbers = [];
                    const maxPagesToShow = 5;
                    
                    if (totalPages <= maxPagesToShow) {
                        for (let i = 1; i <= totalPages; i++) {
                            pageNumbers.push(i);
                        }
                    } else {
                        if (currentPage <= 3) {
                            for (let i = 1; i <= 4; i++) {
                                pageNumbers.push(i);
                            }
                            pageNumbers.push('...');
                            pageNumbers.push(totalPages);
                        } else if (currentPage >= totalPages - 2) {
                            pageNumbers.push(1);
                            pageNumbers.push('...');
                            for (let i = totalPages - 3; i <= totalPages; i++) {
                                pageNumbers.push(i);
                            }
                        } else {
                            pageNumbers.push(1);
                            pageNumbers.push('...');
                            for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                                pageNumbers.push(i);
                            }
                            pageNumbers.push('...');
                            pageNumbers.push(totalPages);
                        }
                    }
                    
                    return pageNumbers;
                };
                
                return (
                    <div className="admin-page-content">
                        <div className="page-header">
                            <div>
                                <h1>Applicant Management</h1>
                                <p className="page-subtitle">Monitor and manage all job applications - Total: {applications.length} applicant{applications.length !== 1 ? 's' : ''}</p>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button className="btn-export" onClick={() => {
                                    console.log('🔄 Manual refresh triggered');
                                    fetchApplications();
                                }}>
                                    🔄 Refresh Data
                                </button>
                                <button className="btn-export" onClick={handleExportApplications}>
                                    📊 Export to CSV
                                </button>
                            </div>
                        </div>

                        {/* Statistics */}
                        <div className="applicant-stats">
                            <div className="stat-card">
                                <span className="stat-number">{applicationStats.total || 0}</span>
                                <span className="stat-label">Total Applications</span>
                            </div>
                            <div className="stat-card new">
                                <span className="stat-number">{applicationStats.new || 0}</span>
                                <span className="stat-label">New</span>
                            </div>
                            <div className="stat-card review">
                                <span className="stat-number">{applicationStats.underReview || 0}</span>
                                <span className="stat-label">Under Review</span>
                            </div>
                            <div className="stat-card shortlist">
                                <span className="stat-number">{applicationStats.shortlisted || 0}</span>
                                <span className="stat-label">Shortlisted</span>
                            </div>
                            <div className="stat-card interview">
                                <span className="stat-number">{applicationStats.forInterview || 0}</span>
                                <span className="stat-label">For Interview</span>
                            </div>
                            <div className="stat-card hired">
                                <span className="stat-number">{applicationStats.hired || 0}</span>
                                <span className="stat-label">Hired</span>
                            </div>
                            <div className="stat-card rejected">
                                <span className="stat-number">{applicationStats.rejected || 0}</span>
                                <span className="stat-label">Rejected</span>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="applicants-filters">
                            <input 
                                type="search" 
                                placeholder="Search by name, email, job title..." 
                                value={applicantSearch}
                                onChange={(e) => setApplicantSearch(e.target.value)}
                                className="search-input"
                            />
                            
                            <select 
                                value={applicantFilter}
                                onChange={(e) => setApplicantFilter(e.target.value)}
                                className="filter-select"
                            >
                                <option value="all">All Status</option>
                                <option value="New">New</option>
                                <option value="Under Review">Under Review</option>
                                <option value="Shortlisted">Shortlisted</option>
                                <option value="For Interview">For Interview</option>
                                <option value="Interviewed">Interviewed</option>
                                <option value="For Job Offer">For Job Offer</option>
                                <option value="Hired">Hired</option>
                                <option value="Rejected">Rejected</option>
                                <option value="Withdrawn">Withdrawn</option>
                            </select>
                        </div>

                        {/* Applicants List - Always Show Table */}
                        <div className="applicants-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Applicant Name</th>
                                        <th>Email</th>
                                        <th>Job Title</th>
                                        <th>Company</th>
                                        <th>Applied Date</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentApplications && currentApplications.length > 0 ? (
                                        currentApplications.map((app, index) => (
                                            <tr key={app._id || index}>
                                                <td>
                                                    <div className="applicant-info">
                                                        <div className="applicant-avatar">
                                                            {(app.user?.fullName?.[0] || app.user?.username?.[0] || '?').toUpperCase()}
                                                        </div>
                                                        <div className="applicant-name">
                                                            {app.user?.fullName || app.user?.username || 'Unknown'}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="applicant-email">{app.user?.email || 'N/A'}</td>
                                                <td className="job-title">{app.job?.jobTitle || app.job?.title || 'N/A'}</td>
                                                <td className="job-company">{app.job?.company || 'N/A'}</td>
                                                <td>{app.appliedDate ? new Date(app.appliedDate).toLocaleDateString() : 'N/A'}</td>
                                                <td>
                                                    <select
                                                        value={app.status}
                                                        onChange={(e) => handleStatusChange(app._id, e.target.value)}
                                                        className={`status-badge status-${app.status.toLowerCase().replace(/\s/g, '-')}`}
                                                    >
                                                        <option value="New">New</option>
                                                        <option value="Under Review">Under Review</option>
                                                        <option value="Shortlisted">Shortlisted</option>
                                                        <option value="For Interview">For Interview</option>
                                                        <option value="Interviewed">Interviewed</option>
                                                        <option value="For Job Offer">For Job Offer</option>
                                                        <option value="Hired">Hired</option>
                                                        <option value="Rejected">Rejected</option>
                                                        <option value="Withdrawn">Withdrawn</option>
                                                    </select>
                                                </td>
                                                <td>
                                                    <div className="action-buttons">
                                                        <button 
                                                            className="btn-view"
                                                            onClick={() => handleViewApplicant(app)}
                                                            title="View Applicant Profile"
                                                        >
                                                            Profile
                                                        </button>
                                                        {app.resume && (
                                                            <a 
                                                                href={`http://localhost:3001${app.resume.fileUrl}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="btn-resume"
                                                                title="View Resume"
                                                            >
                                                                Resume
                                                            </a>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
                                                No applications found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        
                        {/* Pagination Controls */}
                        {applications.length > 0 && (
                            <div className="pagination-container">
                                <div className="pagination-info">
                                    Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, applications.length)} of {applications.length} applications
                                </div>
                                <div className="pagination-controls">
                                    <button 
                                        className="pagination-btn"
                                        onClick={handlePreviousPage}
                                        disabled={currentPage === 1}
                                    >
                                        Previous
                                    </button>
                                    
                                    {getPageNumbers().map((pageNum, idx) => (
                                        pageNum === '...' ? (
                                            <span key={`ellipsis-${idx}`} className="pagination-ellipsis">...</span>
                                        ) : (
                                            <button
                                                key={pageNum}
                                                className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                                                onClick={() => handlePageChange(pageNum)}
                                            >
                                                {pageNum}
                                            </button>
                                        )
                                    ))}
                                    
                                    <button 
                                        className="pagination-btn"
                                        onClick={handleNextPage}
                                        disabled={currentPage === totalPages}
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                );
            
            case 'matching':
                return (
                    <div className="admin-page-content">
                        <h1>Job Matching</h1>
                        <div className="matching-container">
                            <p className="matching-description">
                                Automatically match candidates with suitable job positions based on their skills and experience.
                            </p>
                            <div className="empty-state">
                                <div className="empty-icon">🎯</div>
                                <p>No matching data available</p>
                            </div>
                        </div>
                    </div>
                );
            
            case 'settings':
                return (
                    <div className="admin-page-content">
                        <h1>Settings</h1>
                        <div className="settings-container">
                            <div className="settings-section">
                                <h3>Admin Profile</h3>
                                <div className="settings-info">
                                    <p><strong>Full Name:</strong> {adminData?.fullName}</p>
                                    <p><strong>Username:</strong> {adminData?.username}</p>
                                    <p><strong>Email:</strong> {adminData?.email}</p>
                                    <p><strong>Role:</strong> {adminData?.role}</p>
                                </div>
                            </div>
                            <div className="settings-section">
                                <h3>Platform Settings</h3>
                                <div className="settings-options">
                                    <label className="setting-item">
                                        <input type="checkbox" />
                                        <span>Email notifications</span>
                                    </label>
                                    <label className="setting-item">
                                        <input type="checkbox" />
                                        <span>Auto-approve applications</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            
            case 'reports':
                return (
                    <div className="admin-page-content">
                        <h1>Reports & Analytics</h1>
                        <div className="reports-container">
                            <div className="report-card">
                                <h3>📊 Job Performance</h3>
                                <p>View detailed analytics on job posting performance</p>
                                <button className="admin-btn-secondary" onClick={() => handleViewReport('job-performance')}>View Report</button>
                            </div>
                            <div className="report-card">
                                <h3>👥 User Activity</h3>
                                <p>Track user engagement and application trends</p>
                                <button className="admin-btn-secondary" onClick={() => handleViewReport('user-activity')}>View Report</button>
                            </div>
                            <div className="report-card">
                                <h3>📅 Monthly Summary</h3>
                                <p>Overview of platform activity for the month</p>
                                <button className="admin-btn-secondary" onClick={() => handleViewReport('monthly-summary')}>View Report</button>
                            </div>
                        </div>
                    </div>
                );
            
            case 'messages':
                return (
                    <div className="admin-page-content">
                        <div className="messages-container">
                            <div className="messages-sidebar">
                                <div className="messages-header">
                                    <h3>Messages</h3>
                                </div>
                                <div className="conversation-list">
                                    {conversations.length === 0 ? (
                                        <div style={{padding: '20px', textAlign: 'center', color: '#6b7280'}}>
                                            No conversations yet
                                        </div>
                                    ) : (
                                        conversations.map((conv) => {
                                            const otherUser = conv.otherParticipant?.details || {};
                                            const isActive = activeConversation?._id === conv._id;
                                            const unreadCount = conv.unreadCount?.admin || 0;
                                            
                                            return (
                                                <div 
                                                    key={conv._id} 
                                                    className={`conversation-item ${isActive ? 'active' : ''}`}
                                                    onClick={() => selectConversation(conv)}
                                                >
                                                    <div className="avatar">
                                                        {(otherUser.fullName || otherUser.username || 'U').charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="conversation-info">
                                                        <h4>{otherUser.fullName || otherUser.username || 'User'}</h4>
                                                        <p className="last-message">
                                                            {conv.lastMessage?.content || 'No messages yet'}
                                                        </p>
                                                        {conv.lastMessage?.timestamp && (
                                                            <span className="time">
                                                                {new Date(conv.lastMessage.timestamp).toLocaleDateString()}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {unreadCount > 0 && (
                                                        <span className="unread-badge">{unreadCount}</span>
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
                                                    {((activeConversation.otherParticipant?.details?.fullName || 
                                                       activeConversation.otherParticipant?.details?.username || 'U')).charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h3>
                                                        {activeConversation.otherParticipant?.details?.fullName || 
                                                         activeConversation.otherParticipant?.details?.username || 'User'}
                                                    </h3>
                                                    <span className="status">
                                                        {activeConversation.job?.jobTitle ? 
                                                            `Applied to: ${activeConversation.job.jobTitle}` : 
                                                            'General conversation'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="chat-messages">
                                            {messages.length === 0 ? (
                                                <div style={{padding: '40px', textAlign: 'center', color: '#6b7280'}}>
                                                    <p>No messages yet. Start the conversation!</p>
                                                </div>
                                            ) : (
                                                messages.map((msg, idx) => (
                                                    <div 
                                                        key={idx} 
                                                        className={`message ${msg.sender.userType === 'Admin' ? 'sent' : 'received'}`}
                                                    >
                                                        <div className="message-content">
                                                            <p>{msg.content}</p>
                                                            <span className="message-time">
                                                                {new Date(msg.timestamp).toLocaleString()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                        
                                        <div className="chat-input">
                                            <textarea
                                                value={newMessage}
                                                onChange={(e) => setNewMessage(e.target.value)}
                                                onKeyPress={handleKeyPress}
                                                placeholder="Type your message..."
                                                rows="2"
                                            />
                                            <button 
                                                onClick={sendMessage} 
                                                className="btn-send"
                                                disabled={loadingMessages || !newMessage.trim()}
                                            >
                                                {loadingMessages ? 'Sending...' : 'Send'}
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        height: '100%',
                                        color: '#6b7280',
                                        fontSize: '16px'
                                    }}>
                                        Select a conversation to start messaging
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            
            default:
                return <div>Page not found</div>;
        }
    };

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    return (
        <div className="admin-dashboard">
            <div className="admin-sidebar">
                <div className="admin-logo">
                    <h2>Admin Panel</h2>
                </div>
                
                <nav className="admin-nav">
                    <button 
                        className={`admin-nav-link ${activePage === 'dashboard' ? 'active' : ''}`}
                        onClick={() => setActivePage('dashboard')}
                    >
                        Main Dashboard
                    </button>
                    <button 
                        className={`admin-nav-link ${activePage === 'addJob' ? 'active' : ''}`}
                        onClick={() => setActivePage('addJob')}
                    >
                        Add New Job
                    </button>
                    <button 
                        className={`admin-nav-link ${activePage === 'viewJobs' ? 'active' : ''}`}
                        onClick={() => setActivePage('viewJobs')}
                    >
                        View All Jobs
                    </button>
                    <button 
                        className={`admin-nav-link ${activePage === 'monitoring' ? 'active' : ''}`}
                        onClick={() => setActivePage('monitoring')}
                    >
                        Job Post Monitoring
                    </button>
                    <button 
                        className={`admin-nav-link ${activePage === 'applicants' ? 'active' : ''}`}
                        onClick={() => setActivePage('applicants')}
                    >
                        Applicant Management
                    </button>
                    <button 
                        className={`admin-nav-link ${activePage === 'messages' ? 'active' : ''}`}
                        onClick={() => setActivePage('messages')}
                    >
                        Messages
                    </button>
                    <button 
                        className={`admin-nav-link ${activePage === 'reports' ? 'active' : ''}`}
                        onClick={() => setActivePage('reports')}
                    >
                        Reports & Analytics
                    </button>
                </nav>
            </div>
            
            <div className="admin-main">
                <div className="admin-topbar">
                    <h1>CareerWise Admin</h1>
                    <div className="admin-user-info">
                        <span>{adminData?.username}</span>
                        <button className="admin-logout-btn" onClick={handleLogout}>
                            Logout
                        </button>
                    </div>
                </div>
                
                <div className="admin-content">
                    {renderPageContent()}
                </div>
            </div>

            {/* Applicant Profile Modal */}
            {showApplicantModal && selectedApplication && (
                <div className="modal-overlay" onClick={() => setShowApplicantModal(false)}>
                    <div className="modal-content applicant-modal minimalist-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-body">
                            <div className="applicant-profile">
                                {/* Basic Info */}
                                <div className="profile-section">
                                    <h3>Personal Information</h3>
                                    <div className="info-grid">
                                        <div className="info-item">
                                            <label>Full Name:</label>
                                            <span>{selectedApplication.user?.fullName || selectedApplication.user?.username || 'N/A'}</span>
                                        </div>
                                        <div className="info-item">
                                            <label>Email Address:</label>
                                            <span>{selectedApplication.user?.email || 'N/A'}</span>
                                        </div>
                                        <div className="info-item">
                                            <label>Phone Number:</label>
                                            <span>{selectedApplication.profile?.phoneNumber || 'N/A'}</span>
                                        </div>
                                        <div className="info-item">
                                            <label>Location:</label>
                                            <span>
                                                {selectedApplication.profile?.location 
                                                    ? [
                                                        selectedApplication.profile.location.city,
                                                        selectedApplication.profile.location.state,
                                                        selectedApplication.profile.location.country
                                                    ].filter(Boolean).join(', ')
                                                    : 'N/A'
                                                }
                                            </span>
                                        </div>
                                        <div className="info-item">
                                            <label>Username:</label>
                                            <span>{selectedApplication.user?.username || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Professional Information */}
                                {selectedApplication.profile && (
                                    <div className="profile-section">
                                        <h3>Professional Information</h3>
                                        <div className="info-grid">
                                            {selectedApplication.profile.professionalTitle && (
                                                <div className="info-item">
                                                    <label>Job Title:</label>
                                                    <span>{selectedApplication.profile.professionalTitle}</span>
                                                </div>
                                            )}
                                            {selectedApplication.profile.yearsOfExperience && (
                                                <div className="info-item">
                                                    <label>Experience:</label>
                                                    <span>{selectedApplication.profile.yearsOfExperience} years</span>
                                                </div>
                                            )}
                                            {selectedApplication.profile.experienceLevel && (
                                                <div className="info-item">
                                                    <label>Experience Level:</label>
                                                    <span>{selectedApplication.profile.experienceLevel}</span>
                                                </div>
                                            )}
                                            {selectedApplication.profile.summary && (
                                                <div className="info-item" style={{gridColumn: '1 / -1'}}>
                                                    <label>Summary:</label>
                                                    <span>{selectedApplication.profile.summary}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Skills & Expertise */}
                                {selectedApplication.profile?.skills && selectedApplication.profile.skills.length > 0 && (
                                    <div className="profile-section">
                                        <h3>Skills & Expertise</h3>
                                        <div className="skills-list">
                                            {selectedApplication.profile.skills.map((skill, idx) => {
                                                const skillName = typeof skill === 'object' ? skill.name : skill;
                                                const skillLevel = typeof skill === 'object' ? skill.proficiency : null;
                                                return (
                                                    <span key={idx} className="skill-badge">
                                                        {skillName}{skillLevel ? ` (${skillLevel})` : ''}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Education */}
                                {selectedApplication.profile?.education && selectedApplication.profile.education.length > 0 && (
                                    <div className="profile-section">
                                        <h3>Education</h3>
                                        {selectedApplication.profile.education.map((edu, idx) => (
                                            <div key={idx} className="timeline-item">
                                                <h4>{edu.degree || edu.institution}</h4>
                                                <p className="timeline-meta">{edu.institution}</p>
                                                {edu.fieldOfStudy && <p>Field: {edu.fieldOfStudy}</p>}
                                                {edu.graduationYear && <p className="timeline-date">Graduated: {edu.graduationYear}</p>}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Work Experience */}
                                {selectedApplication.profile?.workExperience && selectedApplication.profile.workExperience.length > 0 && (
                                    <div className="profile-section">
                                        <h3>Work Experience</h3>
                                        {selectedApplication.profile.workExperience.map((exp, idx) => (
                                            <div key={idx} className="timeline-item">
                                                <h4>{exp.jobTitle || exp.title}</h4>
                                                <p className="timeline-meta">{exp.company}</p>
                                                {exp.description && <p>{exp.description}</p>}
                                                <p className="timeline-date">
                                                    {exp.startDate && new Date(exp.startDate).toLocaleDateString()} - 
                                                    {exp.currentlyWorking ? ' Present' : (exp.endDate ? ` ${new Date(exp.endDate).toLocaleDateString()}` : '')}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Job Applied */}
                                <div className="profile-section">
                                    <h3>Job Applied</h3>
                                    <div className="job-applied">
                                        <h4>{selectedApplication.job?.jobTitle || selectedApplication.job?.title || 'N/A'}</h4>
                                        <p>{selectedApplication.job?.company || 'N/A'}</p>
                                        <p>Applied: {new Date(selectedApplication.appliedDate).toLocaleDateString()}</p>
                                    </div>
                                </div>

                                {/* Cover Letter */}
                                {selectedApplication.coverLetter && (
                                    <div className="profile-section">
                                        <h3>Cover Letter</h3>
                                        <p className="cover-letter">{selectedApplication.coverLetter}</p>
                                    </div>
                                )}

                                {/* Application Details */}
                                <div className="profile-section">
                                    <h3>Application Details</h3>
                                    <div className="info-grid">
                                        {selectedApplication.portfolio && (
                                            <div className="info-item">
                                                <label>Portfolio:</label>
                                                <a href={selectedApplication.portfolio} target="_blank" rel="noopener noreferrer">
                                                    View Portfolio
                                                </a>
                                            </div>
                                        )}
                                        {selectedApplication.expectedSalary && (
                                            <div className="info-item">
                                                <label>Expected Salary:</label>
                                                <span>{selectedApplication.expectedSalary}</span>
                                            </div>
                                        )}
                                        {selectedApplication.availableStartDate && (
                                            <div className="info-item">
                                                <label>Available From:</label>
                                                <span>{new Date(selectedApplication.availableStartDate).toLocaleDateString()}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Status & Actions */}
                                <div className="profile-section">
                                    <h3>Actions</h3>
                                    <div className="profile-actions">
                                        <button
                                            onClick={async () => {
                                                setShowApplicantModal(false);
                                                setActivePage('messages');
                                                
                                                // Start conversation with full context
                                                const userId = selectedApplication.user?._id || selectedApplication.user?.id;
                                                const applicationId = selectedApplication._id;
                                                const jobId = selectedApplication.job?._id || selectedApplication.job?.id;
                                                
                                                if (userId && adminData?.id) {
                                                    try {
                                                        const response = await fetch('http://localhost:3001/api/messages/start', {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({
                                                                userId: userId,
                                                                adminId: adminData.id,
                                                                applicationId: applicationId,
                                                                jobId: jobId
                                                            })
                                                        });
                                                        
                                                        const data = await response.json();
                                                        setActiveConversation(data.conversation);
                                                        setMessages(data.conversation.messages || []);
                                                        fetchConversations();
                                                    } catch (error) {
                                                        console.error('Error starting conversation:', error);
                                                    }
                                                }
                                            }}
                                            className="btn-message"
                                        >
                                            💬 Send Message
                                        </button>
                                        <select
                                            value={selectedApplication.status}
                                            onChange={(e) => handleStatusChange(selectedApplication._id, e.target.value)}
                                            className="status-select-large"
                                        >
                                            <option value="New">New</option>
                                            <option value="Under Review">Under Review</option>
                                            <option value="Shortlisted">Shortlisted</option>
                                            <option value="For Interview">For Interview</option>
                                            <option value="Hired">Hired</option>
                                            <option value="Rejected">Rejected</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Job Modal */}
            {showEditModal && editingJob && (
                <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="modal-content edit-job-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Edit Job Details</h2>
                            <button className="modal-close" onClick={() => setShowEditModal(false)}>×</button>
                        </div>
                        
                        <div className="modal-body">
                            <form onSubmit={handleUpdateJob} className="job-edit-form">
                                {/* Basic Information */}
                                <div className="form-section">
                                    <h3>Basic Information</h3>
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label>Job Title *</label>
                                            <input
                                                type="text"
                                                name="jobTitle"
                                                value={jobFormData.jobTitle}
                                                onChange={(e) => setJobFormData({...jobFormData, jobTitle: e.target.value})}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Company *</label>
                                            <input
                                                type="text"
                                                name="company"
                                                value={jobFormData.company}
                                                onChange={(e) => setJobFormData({...jobFormData, company: e.target.value})}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Location */}
                                <div className="form-section">
                                    <h3>Location</h3>
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label>City</label>
                                            <input
                                                type="text"
                                                name="city"
                                                value={jobFormData.city}
                                                onChange={(e) => setJobFormData({...jobFormData, city: e.target.value})}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>State</label>
                                            <input
                                                type="text"
                                                name="state"
                                                value={jobFormData.state}
                                                onChange={(e) => setJobFormData({...jobFormData, state: e.target.value})}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Country</label>
                                            <input
                                                type="text"
                                                name="country"
                                                value={jobFormData.country}
                                                onChange={(e) => setJobFormData({...jobFormData, country: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Job Details */}
                                <div className="form-section">
                                    <h3>Job Details</h3>
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label>Work Arrangement</label>
                                            <select
                                                name="workArrangement"
                                                value={jobFormData.workArrangement}
                                                onChange={(e) => setJobFormData({...jobFormData, workArrangement: e.target.value})}
                                            >
                                                <option value="">Select...</option>
                                                <option value="On-site">On-site</option>
                                                <option value="Remote">Remote</option>
                                                <option value="Hybrid">Hybrid</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Job Type</label>
                                            <select
                                                name="jobType"
                                                value={jobFormData.jobType}
                                                onChange={(e) => setJobFormData({...jobFormData, jobType: e.target.value})}
                                            >
                                                <option value="">Select...</option>
                                                <option value="Full-time">Full-time</option>
                                                <option value="Part-time">Part-time</option>
                                                <option value="Contract">Contract</option>
                                                <option value="Internship">Internship</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Experience Level</label>
                                            <select
                                                name="experienceLevel"
                                                value={jobFormData.experienceLevel}
                                                onChange={(e) => setJobFormData({...jobFormData, experienceLevel: e.target.value})}
                                            >
                                                <option value="">Select...</option>
                                                <option value="Entry Level">Entry Level</option>
                                                <option value="Mid Level">Mid Level</option>
                                                <option value="Senior Level">Senior Level</option>
                                                <option value="Executive">Executive</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Industry</label>
                                            <input
                                                type="text"
                                                name="industry"
                                                value={jobFormData.industry}
                                                onChange={(e) => setJobFormData({...jobFormData, industry: e.target.value})}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Department</label>
                                            <input
                                                type="text"
                                                name="department"
                                                value={jobFormData.department}
                                                onChange={(e) => setJobFormData({...jobFormData, department: e.target.value})}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Status</label>
                                            <select
                                                name="status"
                                                value={jobFormData.status}
                                                onChange={(e) => setJobFormData({...jobFormData, status: e.target.value})}
                                            >
                                                <option value="Active">Active</option>
                                                <option value="Closed">Closed</option>
                                                <option value="Draft">Draft</option>
                                                <option value="On Hold">On Hold</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="form-section">
                                    <h3>Description & Responsibilities</h3>
                                    <div className="form-group">
                                        <label>Job Description</label>
                                        <textarea
                                            name="description"
                                            value={jobFormData.description}
                                            onChange={(e) => setJobFormData({...jobFormData, description: e.target.value})}
                                            rows="4"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Responsibilities (one per line)</label>
                                        <textarea
                                            name="responsibilities"
                                            value={jobFormData.responsibilities}
                                            onChange={(e) => setJobFormData({...jobFormData, responsibilities: e.target.value})}
                                            rows="4"
                                        />
                                    </div>
                                </div>

                                {/* Experience & Education */}
                                <div className="form-section">
                                    <h3>Experience & Education</h3>
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label>Min Experience (years)</label>
                                            <input
                                                type="number"
                                                name="minExperience"
                                                value={jobFormData.minExperience}
                                                onChange={(e) => setJobFormData({...jobFormData, minExperience: e.target.value})}
                                                min="0"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Max Experience (years)</label>
                                            <input
                                                type="number"
                                                name="maxExperience"
                                                value={jobFormData.maxExperience}
                                                onChange={(e) => setJobFormData({...jobFormData, maxExperience: e.target.value})}
                                                min="0"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Education Degree</label>
                                            <input
                                                type="text"
                                                name="educationDegree"
                                                value={jobFormData.educationDegree}
                                                onChange={(e) => setJobFormData({...jobFormData, educationDegree: e.target.value})}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Field of Study</label>
                                            <input
                                                type="text"
                                                name="fieldOfStudy"
                                                value={jobFormData.fieldOfStudy}
                                                onChange={(e) => setJobFormData({...jobFormData, fieldOfStudy: e.target.value})}
                                                placeholder="Comma separated"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Skills & Certifications */}
                                <div className="form-section">
                                    <h3>Skills & Certifications</h3>
                                    <div className="form-group">
                                        <label>Required Skills</label>
                                        <input
                                            type="text"
                                            name="requiredSkills"
                                            value={jobFormData.requiredSkills}
                                            onChange={(e) => setJobFormData({...jobFormData, requiredSkills: e.target.value})}
                                            placeholder="Comma separated"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Preferred Skills</label>
                                        <input
                                            type="text"
                                            name="preferredSkills"
                                            value={jobFormData.preferredSkills}
                                            onChange={(e) => setJobFormData({...jobFormData, preferredSkills: e.target.value})}
                                            placeholder="Comma separated"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Required Certifications</label>
                                        <input
                                            type="text"
                                            name="requiredCertifications"
                                            value={jobFormData.requiredCertifications}
                                            onChange={(e) => setJobFormData({...jobFormData, requiredCertifications: e.target.value})}
                                            placeholder="Comma separated"
                                        />
                                    </div>
                                </div>

                                {/* Compensation */}
                                <div className="form-section">
                                    <h3>Compensation</h3>
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label>Min Salary</label>
                                            <input
                                                type="number"
                                                name="minSalary"
                                                value={jobFormData.minSalary}
                                                onChange={(e) => setJobFormData({...jobFormData, minSalary: e.target.value})}
                                                min="0"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Max Salary</label>
                                            <input
                                                type="number"
                                                name="maxSalary"
                                                value={jobFormData.maxSalary}
                                                onChange={(e) => setJobFormData({...jobFormData, maxSalary: e.target.value})}
                                                min="0"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Currency</label>
                                            <select
                                                name="currency"
                                                value={jobFormData.currency}
                                                onChange={(e) => setJobFormData({...jobFormData, currency: e.target.value})}
                                            >
                                                <option value="USD">USD</option>
                                                <option value="PHP">PHP</option>
                                                <option value="EUR">EUR</option>
                                                <option value="GBP">GBP</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Benefits</label>
                                        <input
                                            type="text"
                                            name="benefits"
                                            value={jobFormData.benefits}
                                            onChange={(e) => setJobFormData({...jobFormData, benefits: e.target.value})}
                                            placeholder="Comma separated"
                                        />
                                    </div>
                                </div>

                                {/* Additional Details */}
                                <div className="form-section">
                                    <h3>Additional Details</h3>
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label>Number of Openings</label>
                                            <input
                                                type="number"
                                                name="numberOfOpenings"
                                                value={jobFormData.numberOfOpenings}
                                                onChange={(e) => setJobFormData({...jobFormData, numberOfOpenings: e.target.value})}
                                                min="1"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Application Deadline</label>
                                            <input
                                                type="date"
                                                name="applicationDeadline"
                                                value={jobFormData.applicationDeadline}
                                                onChange={(e) => setJobFormData({...jobFormData, applicationDeadline: e.target.value})}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Contact Email</label>
                                            <input
                                                type="email"
                                                name="contactEmail"
                                                value={jobFormData.contactEmail}
                                                onChange={(e) => setJobFormData({...jobFormData, contactEmail: e.target.value})}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Contact Phone</label>
                                            <input
                                                type="tel"
                                                name="contactPhone"
                                                value={jobFormData.contactPhone}
                                                onChange={(e) => setJobFormData({...jobFormData, contactPhone: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Form Actions */}
                                <div className="form-actions">
                                    <button type="button" className="btn-cancel" onClick={() => setShowEditModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-save">
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Job Details Modal */}
            {showJobDetailsModal && selectedJobDetails && (
                <div className="modal-overlay" onClick={() => setShowJobDetailsModal(false)}>
                    <div className="modal-content job-details-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Job Details</h2>
                            <button className="modal-close" onClick={() => setShowJobDetailsModal(false)}>×</button>
                        </div>
                        
                        <div className="modal-body">
                            <div className="job-details-content">
                                {/* Basic Information */}
                                <div className="details-section">
                                    <h3>Basic Information</h3>
                                    <div className="info-grid">
                                        <div className="info-item">
                                            <label>Job Title:</label>
                                            <span>{selectedJobDetails.jobTitle || 'N/A'}</span>
                                        </div>
                                        <div className="info-item">
                                            <label>Company:</label>
                                            <span>{selectedJobDetails.company || 'N/A'}</span>
                                        </div>
                                        <div className="info-item">
                                            <label>Status:</label>
                                            <span className={`status-badge status-${selectedJobDetails.status?.toLowerCase()}`}>
                                                {selectedJobDetails.status || 'N/A'}
                                            </span>
                                        </div>
                                        <div className="info-item">
                                            <label>Posted Date:</label>
                                            <span>{selectedJobDetails.postedDate ? new Date(selectedJobDetails.postedDate).toLocaleDateString() : 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Location */}
                                <div className="details-section">
                                    <h3>Location</h3>
                                    <div className="info-grid">
                                        <div className="info-item">
                                            <label>City:</label>
                                            <span>{selectedJobDetails.location?.city || 'N/A'}</span>
                                        </div>
                                        <div className="info-item">
                                            <label>State:</label>
                                            <span>{selectedJobDetails.location?.state || 'N/A'}</span>
                                        </div>
                                        <div className="info-item">
                                            <label>Country:</label>
                                            <span>{selectedJobDetails.location?.country || 'N/A'}</span>
                                        </div>
                                        <div className="info-item">
                                            <label>Remote:</label>
                                            <span>{selectedJobDetails.location?.isRemote ? 'Yes' : 'No'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Job Details */}
                                <div className="details-section">
                                    <h3>Job Details</h3>
                                    <div className="info-grid">
                                        <div className="info-item">
                                            <label>Work Arrangement:</label>
                                            <span>{selectedJobDetails.workArrangement || 'N/A'}</span>
                                        </div>
                                        <div className="info-item">
                                            <label>Job Type:</label>
                                            <span>{selectedJobDetails.jobType || 'N/A'}</span>
                                        </div>
                                        <div className="info-item">
                                            <label>Experience Level:</label>
                                            <span>{selectedJobDetails.experienceLevel || 'N/A'}</span>
                                        </div>
                                        <div className="info-item">
                                            <label>Industry:</label>
                                            <span>{selectedJobDetails.industry || 'N/A'}</span>
                                        </div>
                                        <div className="info-item">
                                            <label>Department:</label>
                                            <span>{selectedJobDetails.department || 'N/A'}</span>
                                        </div>
                                        <div className="info-item">
                                            <label>Number of Openings:</label>
                                            <span>{selectedJobDetails.numberOfOpenings || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Description */}
                                {selectedJobDetails.description && (
                                    <div className="details-section">
                                        <h3>Job Description</h3>
                                        <p className="description-text">{selectedJobDetails.description}</p>
                                    </div>
                                )}

                                {/* Responsibilities */}
                                {selectedJobDetails.responsibilities && selectedJobDetails.responsibilities.length > 0 && (
                                    <div className="details-section">
                                        <h3>Responsibilities</h3>
                                        <ul className="responsibilities-list">
                                            {selectedJobDetails.responsibilities.map((resp, idx) => (
                                                <li key={idx}>{resp}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Experience & Education */}
                                <div className="details-section">
                                    <h3>Experience & Education</h3>
                                    <div className="info-grid">
                                        {selectedJobDetails.yearsOfExperienceRequired && (
                                            <div className="info-item">
                                                <label>Years of Experience:</label>
                                                <span>
                                                    {selectedJobDetails.yearsOfExperienceRequired.min || 0} - {selectedJobDetails.yearsOfExperienceRequired.max || 'N/A'} years
                                                </span>
                                            </div>
                                        )}
                                        {selectedJobDetails.educationRequired && (
                                            <>
                                                <div className="info-item">
                                                    <label>Education Degree:</label>
                                                    <span>{selectedJobDetails.educationRequired.degree || 'N/A'}</span>
                                                </div>
                                                {selectedJobDetails.educationRequired.fieldOfStudy && selectedJobDetails.educationRequired.fieldOfStudy.length > 0 && (
                                                    <div className="info-item" style={{gridColumn: '1 / -1'}}>
                                                        <label>Field of Study:</label>
                                                        <span>{selectedJobDetails.educationRequired.fieldOfStudy.join(', ')}</span>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Skills */}
                                {selectedJobDetails.requiredSkills && selectedJobDetails.requiredSkills.length > 0 && (
                                    <div className="details-section">
                                        <h3>Required Skills</h3>
                                        <div className="skills-list">
                                            {selectedJobDetails.requiredSkills.map((skill, idx) => (
                                                <span key={idx} className="skill-badge">
                                                    {typeof skill === 'object' ? skill.name : skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {selectedJobDetails.preferredSkills && selectedJobDetails.preferredSkills.length > 0 && (
                                    <div className="details-section">
                                        <h3>Preferred Skills</h3>
                                        <div className="skills-list">
                                            {selectedJobDetails.preferredSkills.map((skill, idx) => (
                                                <span key={idx} className="skill-badge skill-badge-preferred">
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Certifications */}
                                {selectedJobDetails.requiredCertifications && selectedJobDetails.requiredCertifications.length > 0 && (
                                    <div className="details-section">
                                        <h3>Required Certifications</h3>
                                        <div className="skills-list">
                                            {selectedJobDetails.requiredCertifications.map((cert, idx) => (
                                                <span key={idx} className="skill-badge">
                                                    {cert}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Compensation */}
                                <div className="details-section">
                                    <h3>Compensation & Benefits</h3>
                                    <div className="info-grid">
                                        {selectedJobDetails.salary && (
                                            <div className="info-item">
                                                <label>Salary Range:</label>
                                                <span>
                                                    {selectedJobDetails.salary.currency || 'USD'} {selectedJobDetails.salary.min?.toLocaleString() || 'N/A'} - {selectedJobDetails.salary.max?.toLocaleString() || 'N/A'}
                                                </span>
                                            </div>
                                        )}
                                        {selectedJobDetails.benefits && selectedJobDetails.benefits.length > 0 && (
                                            <div className="info-item" style={{gridColumn: '1 / -1'}}>
                                                <label>Benefits:</label>
                                                <span>{selectedJobDetails.benefits.join(', ')}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Application Details */}
                                <div className="details-section">
                                    <h3>Application Details</h3>
                                    <div className="info-grid">
                                        <div className="info-item">
                                            <label>Application Deadline:</label>
                                            <span>{selectedJobDetails.applicationDeadline ? new Date(selectedJobDetails.applicationDeadline).toLocaleDateString() : 'N/A'}</span>
                                        </div>
                                        <div className="info-item">
                                            <label>Contact Email:</label>
                                            <span>{selectedJobDetails.contactEmail || 'N/A'}</span>
                                        </div>
                                        <div className="info-item">
                                            <label>Contact Phone:</label>
                                            <span>{selectedJobDetails.contactPhone || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Statistics */}
                                <div className="details-section">
                                    <h3>Statistics</h3>
                                    <div className="info-grid">
                                        <div className="info-item">
                                            <label>Views:</label>
                                            <span>{selectedJobDetails.views || 0}</span>
                                        </div>
                                        <div className="info-item">
                                            <label>Applications:</label>
                                            <span>{selectedJobDetails.applications || 0}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Report Modal */}
            {showReportModal && (
                <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
                    <div className="modal-content matched-applicants-modal minimalist-modal report-modal-clean" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-body report-modal-body-clean">
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                                <button className="admin-btn-secondary" onClick={() => window.print()} style={{ marginRight: 8 }}>
                                    🖨️ Print Report
                                </button>
                            </div>
                            {!reportData ? (
                                <div className="loading-state">
                                    <p>Loading report data...</p>
                                </div>
                            ) : (
                                <div className="report-content">
                                    {selectedReport === 'job-performance' && (
                                        <div className="report-section">
                                            <h3>Job Statistics</h3>
                                            <div className="report-stats-grid">
                                                <div className="stat-card">
                                                    <span className="stat-label">Total Jobs Posted</span>
                                                    <span className="stat-value">{reportData.totalJobs || 0}</span>
                                                </div>
                                                <div className="stat-card">
                                                    <span className="stat-label">Active Jobs</span>
                                                    <span className="stat-value">{reportData.activeJobs || 0}</span>
                                                </div>
                                                <div className="stat-card">
                                                    <span className="stat-label">Total Views</span>
                                                    <span className="stat-value">{reportData.totalViews || 0}</span>
                                                </div>
                                                <div className="stat-card">
                                                    <span className="stat-label">Total Applications</span>
                                                    <span className="stat-value">{reportData.totalApplications || 0}</span>
                                                </div>
                                            </div>
                                            {reportData.topPerformingJobs && reportData.topPerformingJobs.length > 0 && (
                                                <div className="report-table-section">
                                                    <h4>Top Performing Jobs</h4>
                                                    <table className="report-table">
                                                        <thead>
                                                            <tr>
                                                                <th>Job Title</th>
                                                                <th>Company</th>
                                                                <th>Views</th>
                                                                <th>Applications</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {reportData.topPerformingJobs.map((job, idx) => (
                                                                <tr key={idx}>
                                                                    <td>{job.jobTitle}</td>
                                                                    <td>{job.company}</td>
                                                                    <td>{job.views || 0}</td>
                                                                    <td>{job.applications || 0}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    
                                    {selectedReport === 'user-activity' && (
                                        <div className="report-section">
                                            <h3>User Engagement Metrics</h3>
                                            <div className="report-stats-grid">
                                                <div className="stat-card">
                                                    <span className="stat-label">Total Users</span>
                                                    <span className="stat-value">{reportData.totalUsers || 0}</span>
                                                </div>
                                                <div className="stat-card">
                                                    <span className="stat-label">Active Applicants</span>
                                                    <span className="stat-value">{reportData.activeApplicants || 0}</span>
                                                </div>
                                                <div className="stat-card">
                                                    <span className="stat-label">Total Applications</span>
                                                    <span className="stat-value">{reportData.totalApplications || 0}</span>
                                                </div>
                                                <div className="stat-card">
                                                    <span className="stat-label">Avg Applications/User</span>
                                                    <span className="stat-value">{reportData.avgApplicationsPerUser?.toFixed(1) || 0}</span>
                                                </div>
                                            </div>
                                            {reportData.recentActivity && reportData.recentActivity.length > 0 && (
                                                <div className="report-table-section">
                                                    <h4>Recent User Activity</h4>
                                                    <table className="report-table">
                                                        <thead>
                                                            <tr>
                                                                <th>User</th>
                                                                <th>Email</th>
                                                                <th>Applications</th>
                                                                <th>Last Active</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {reportData.recentActivity.map((user, idx) => (
                                                                <tr key={idx}>
                                                                    <td>{user.fullName}</td>
                                                                    <td>{user.email}</td>
                                                                    <td>{user.applicationCount || 0}</td>
                                                                    <td>{new Date(user.lastActive).toLocaleDateString()}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    
                                    {selectedReport === 'monthly-summary' && (
                                        <div className="report-section">
                                            <h3>Platform Overview - {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
                                            <div className="report-stats-grid">
                                                <div className="stat-card">
                                                    <span className="stat-label">Jobs Posted This Month</span>
                                                    <span className="stat-value">{reportData.monthlyJobs || 0}</span>
                                                </div>
                                                <div className="stat-card">
                                                    <span className="stat-label">Applications This Month</span>
                                                    <span className="stat-value">{reportData.monthlyApplications || 0}</span>
                                                </div>
                                                <div className="stat-card">
                                                    <span className="stat-label">New Users This Month</span>
                                                    <span className="stat-value">{reportData.newUsers || 0}</span>
                                                </div>
                                                <div className="stat-card">
                                                    <span className="stat-label">Total Page Views</span>
                                                    <span className="stat-value">{reportData.totalPageViews || 0}</span>
                                                </div>
                                            </div>
                                            <div className="summary-section">
                                                <h4>Status Breakdown</h4>
                                                <div className="status-breakdown">
                                                    <div className="status-item">
                                                        <span className="status-label">New Applications</span>
                                                        <span className="status-count">{reportData.statusBreakdown?.new || 0}</span>
                                                    </div>
                                                    <div className="status-item">
                                                        <span className="status-label">Under Review</span>
                                                        <span className="status-count">{reportData.statusBreakdown?.underReview || 0}</span>
                                                    </div>
                                                    <div className="status-item">
                                                        <span className="status-label">Interviewed</span>
                                                        <span className="status-count">{reportData.statusBreakdown?.interviewed || 0}</span>
                                                    </div>
                                                    <div className="status-item">
                                                        <span className="status-label">Accepted</span>
                                                        <span className="status-count">{reportData.statusBreakdown?.accepted || 0}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Matched Applicants Modal */}
            {showMatchedApplicantsModal && selectedJobForMatching && (
                <div className="modal-overlay" onClick={() => setShowMatchedApplicantsModal(false)}>
                    <div className="modal-content matched-applicants-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Matched Applicants - {selectedJobForMatching.jobTitle}</h2>
                            <button className="modal-close" onClick={() => setShowMatchedApplicantsModal(false)}>×</button>
                        </div>
                        
                        <div className="modal-body">
                            {matchedApplicants.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-icon">🔍</div>
                                    <p>No matched applicants found for this position</p>
                                    <small>Applicants are matched based on skills, job title, and industry relevance</small>
                                </div>
                            ) : (
                                <div className="matched-applicants-list">
                                    <div className="matched-count">
                                        <strong>{matchedApplicants.length}</strong> matched applicant{matchedApplicants.length !== 1 ? 's' : ''} found
                                    </div>
                                    
                                    {matchedApplicants.map((app) => (
                                        <div key={app._id} className="matched-applicant-card">
                                            <div className="applicant-header">
                                                <div className="applicant-avatar-large">
                                                    {(app.user?.fullName?.[0] || app.user?.username?.[0] || '?').toUpperCase()}
                                                </div>
                                                <div className="applicant-info-main">
                                                    <h3>{app.user?.fullName || app.user?.username || 'Unknown'}</h3>
                                                    <p className="applicant-title">{app.profile?.professionalTitle || 'N/A'}</p>
                                                    <p className="applicant-email">{app.user?.email || 'N/A'}</p>
                                                </div>
                                                <div className="match-badge">
                                                    ✓ Matched
                                                </div>
                                            </div>
                                            
                                            <div className="applicant-details">
                                                {app.profile?.experienceLevel && (
                                                    <div className="detail-chip">
                                                        <strong>Experience:</strong> {app.profile.experienceLevel}
                                                    </div>
                                                )}
                                                {app.profile?.yearsOfExperience && (
                                                    <div className="detail-chip">
                                                        <strong>Years:</strong> {app.profile.yearsOfExperience}
                                                    </div>
                                                )}
                                                {app.profile?.industry && (
                                                    <div className="detail-chip">
                                                        <strong>Industry:</strong> {app.profile.industry}
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {app.profile?.skills && app.profile.skills.length > 0 && (
                                                <div className="applicant-skills">
                                                    <strong>Skills:</strong>
                                                    <div className="skills-list">
                                                        {app.profile.skills.slice(0, 5).map((skill, idx) => (
                                                            <span key={idx} className="skill-badge">
                                                                {typeof skill === 'object' ? `${skill.name}${skill.proficiency ? ` (${skill.proficiency})` : ''}` : skill}
                                                            </span>
                                                        ))}
                                                        {app.profile.skills.length > 5 && (
                                                            <span className="skill-badge">+{app.profile.skills.length - 5} more</span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            
                                            <div className="applicant-actions">
                                                <button 
                                                    className="btn-view-profile"
                                                    onClick={() => {
                                                        setShowMatchedApplicantsModal(false);
                                                        handleViewApplicant(app);
                                                    }}
                                                >
                                                    View Full Profile
                                                </button>
                                                {app.resume && (
                                                    <a 
                                                        href={`http://localhost:3001${app.resume.fileUrl}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="btn-view-resume"
                                                    >
                                                        View Resume
                                                    </a>
                                                )}
                                                <select
                                                    value={app.status}
                                                    onChange={(e) => {
                                                        handleStatusChange(app._id, e.target.value);
                                                        // Refresh matched applicants after status change
                                                        setTimeout(() => handleViewMatchedApplicants(selectedJobForMatching), 500);
                                                    }}
                                                    className="status-select-small"
                                                >
                                                    <option value="New">New</option>
                                                    <option value="Under Review">Under Review</option>
                                                    <option value="Shortlisted">Shortlisted</option>
                                                    <option value="For Interview">For Interview</option>
                                                    <option value="Hired">Hired</option>
                                                    <option value="Rejected">Rejected</option>
                                                </select>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminDashboard;


