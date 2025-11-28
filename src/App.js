import React, { useState } from 'react';
import './App.css';
import Dashboard from './Dashboard';
import ProfileCreation from './ProfileCreation';

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showProfileCreation, setShowProfileCreation] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  });
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleGoogleSignIn = () => {
    // Check if Google OAuth is configured
    if (!process.env.REACT_APP_GOOGLE_ENABLED) {
      // Redirect to Google OAuth
      window.location.href = 'http://localhost:3000/api/auth/google';
    } else {
      setMessage({ 
        text: 'Google Sign-In is not configured yet. Please use email/password or OTP login.', 
        type: 'error' 
      });
    }
  };

  const handleOTPLogin = async () => {
    try {
      setMessage({ text: '', type: '' });
      
      const identifier = formData.username.trim();
      if (!identifier) {
        setMessage({ text: 'Please enter your email or username', type: 'error' });
        return;
      }

      const response = await fetch('http://localhost:3000/api/auth/request-otp-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ text: 'OTP sent! Redirecting to verification...', type: 'success' });
        sessionStorage.setItem('otpContact', data.contactInfo);
        sessionStorage.setItem('otpPurpose', 'login');
        setTimeout(() => {
          window.location.href = '/verify-otp.html';
        }, 1500);
      } else {
        setMessage({ text: data.message || 'Failed to send OTP', type: 'error' });
      }
    } catch (error) {
      console.error('OTP request error:', error);
      setMessage({ text: 'Failed to send OTP. Please try again.', type: 'error' });
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    if (!formData.username || !formData.password) {
      setMessage({ text: 'Please fill in all fields', type: 'error' });
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          username: formData.username,
          password: formData.password
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ text: 'Login successful! Redirecting...', type: 'success' });
        setTimeout(() => {
          setIsLoggedIn(true);
        }, 1000);
      } else {
        setMessage({ text: data.message || 'Login failed', type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'An error occurred. Please try again.', type: 'error' });
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    if (!formData.fullName || !formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      setMessage({ text: 'Please fill in all fields', type: 'error' });
      return;
    }

    if (!formData.agreeToTerms) {
      setMessage({ text: 'Please agree to the Terms & Conditions', type: 'error' });
      return;
    }

    if (formData.username.length < 3) {
      setMessage({ text: 'Username must be at least 3 characters', type: 'error' });
      return;
    }

    if (formData.password.length < 6) {
      setMessage({ text: 'Password must be at least 6 characters', type: 'error' });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setMessage({ text: 'Passwords do not match', type: 'error' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setMessage({ text: 'Please enter a valid email address', type: 'error' });
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          fullName: formData.fullName,
          username: formData.username,
          email: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ text: 'Account created successfully! Creating profile...', type: 'success' });
        setTimeout(() => {
          setShowProfileCreation(true);
        }, 1500);
      } else {
        setMessage({ text: data.message || 'Signup failed', type: 'error' });
      }
    } catch (error) {
      console.error('Signup error details:', error);
      setMessage({ text: `Error: ${error.message || 'An error occurred. Please try again.'}`, type: 'error' });
    }
  };

  const handleProfileComplete = async (formDataToSend) => {
    try {
      const response = await fetch('http://localhost:3000/api/profiles/create', {
        method: 'POST',
        credentials: 'include',
        body: formDataToSend // FormData object, don't set Content-Type header
      });

      const data = await response.json();

      if (data.success) {
        setShowProfileCreation(false);
        setIsLoggedIn(true);
      } else {
        alert('Error saving profile: ' + data.message);
      }
    } catch (error) {
      console.error('Profile save error:', error);
      alert('Error saving profile. Please try again.');
    }
  };

  const handleProfileSkip = () => {
    // Allow user to skip profile creation and go to dashboard
    setShowProfileCreation(false);
    setIsLoggedIn(true);
  };

  // Show dashboard if logged in
  if (isLoggedIn) {
    return <Dashboard />;
  }

  // Show profile creation after signup
  if (showProfileCreation) {
    return <ProfileCreation onProfileComplete={handleProfileComplete} onCancel={handleProfileSkip} />;
  }

  return (
    <>
      {/* Header */}
      <header className="login-header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-text">CareerWise</span>
          </div>
          <nav className="header-nav">
            <a href="#jobs" className="nav-link">Jobs</a>
            <a href="#about" className="nav-link">About Us</a>
            <a href="#contact" className="nav-link">Contact</a>
          </nav>
          <div className="header-buttons">
            <button 
              className="btn-header btn-login" 
              onClick={() => { setIsLogin(true); setShowAuthModal(true); setMessage({ text: '', type: '' }); }}
            >
              Sign In
            </button>
            <button 
              className="btn-header btn-signup" 
              onClick={() => { setIsLogin(false); setShowAuthModal(true); setMessage({ text: '', type: '' }); }}
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Welcome Section */}
      <div className="welcome-section" id="hero">
        <div className="welcome-content">
          <div className="welcome-text">
            <div className="update-badge">
              <span className="badge-icon">✨</span>
              <span>New update available</span>
            </div>
            <h1 className="welcome-title">CareerWise</h1>
            <h2 className="welcome-subtitle">Navigate Your Future</h2>
            <p className="welcome-description">
              Using our app you can explore career paths, build essential skills, and connect with opportunities to achieve your goals
            </p>
          </div>
          <div className="welcome-image">
            <div className="phone-mockup phone-1">
              <div className="phone-screen">
                <div className="screen-header">
                  <div className="screen-time">9:41</div>
                  <div className="screen-icons">📶 📶 🔋</div>
                </div>
                <div className="screen-content">
                  <h3>Job Search</h3>
                  <div className="job-card">
                    <div className="job-icon">💼</div>
                    <div className="job-info">
                      <div className="job-title">Software Engineer</div>
                      <div className="job-company">Tech Corp</div>
                      <div className="job-salary">$80k - $120k</div>
                    </div>
                  </div>
                  <div className="job-card">
                    <div className="job-icon">🎨</div>
                    <div className="job-info">
                      <div className="job-title">UI/UX Designer</div>
                      <div className="job-company">Creative Studio</div>
                      <div className="job-salary">$70k - $100k</div>
                    </div>
                  </div>
                  <div className="job-card">
                    <div className="job-icon">📊</div>
                    <div className="job-info">
                      <div className="job-title">Data Analyst</div>
                      <div className="job-company">Analytics Co</div>
                      <div className="job-salary">$75k - $110k</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="phone-mockup phone-2">
              <div className="phone-screen">
                <div className="screen-header">
                  <div className="screen-time">9:41</div>
                  <div className="screen-icons">📶 📶 🔋</div>
                </div>
                <div className="screen-content">
                  <h3>My Profile</h3>
                  <div className="profile-avatar">👤</div>
                  <div className="profile-name">Job Seeker</div>
                  <div className="profile-stats">
                    <div className="stat-item">
                      <div className="stat-value">24</div>
                      <div className="stat-label">Applications</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-value">12</div>
                      <div className="stat-label">Interviews</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-value">3</div>
                      <div className="stat-label">Offers</div>
                    </div>
                  </div>
                  <button className="profile-btn">View Full Profile</button>
                </div>
              </div>
            </div>
            <div className="phone-mockup phone-3">
              <div className="phone-screen">
                <div className="screen-header">
                  <div className="screen-time">9:41</div>
                  <div className="screen-icons">📶 📶 🔋</div>
                </div>
                <div className="screen-content">
                  <h3>Career Path</h3>
                  <div className="path-item">
                    <div className="path-icon">🎯</div>
                    <div className="path-text">Set Goals</div>
                  </div>
                  <div className="path-item">
                    <div className="path-icon">📚</div>
                    <div className="path-text">Learn Skills</div>
                  </div>
                  <div className="path-item">
                    <div className="path-icon">💡</div>
                    <div className="path-text">Get Insights</div>
                  </div>
                  <div className="path-item">
                    <div className="path-icon">🚀</div>
                    <div className="path-text">Land Job</div>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width: '65%'}}></div>
                  </div>
                  <div className="progress-text">65% Complete</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Jobs Section */}
      <div className="jobs-section" id="jobs">
        <div className="jobs-container">
          <div className="section-header">
            <h2>Featured Job Opportunities</h2>
            <p>Explore exciting career opportunities tailored for you</p>
          </div>
          
          <div className="jobs-grid">
            <div className="job-listing-card">
              <div className="job-listing-header">
                <div className="company-logo">💼</div>
                <div className="job-badge">Full-time</div>
              </div>
              <h3>Software Engineer</h3>
              <p className="company-name">Tech Corporation</p>
              <p className="job-description">Join our team to build innovative solutions using modern technologies. We're looking for passionate developers.</p>
              <div className="job-details">
                <span className="detail-item">📍 Remote</span>
                <span className="detail-item">💰 $80k - $120k</span>
                <span className="detail-item">⏰ Posted 2 days ago</span>
              </div>
              <button className="apply-btn" onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setTimeout(() => { setIsLogin(false); setShowAuthModal(true); }, 500); }}>
                Apply Now
              </button>
            </div>

            <div className="job-listing-card">
              <div className="job-listing-header">
                <div className="company-logo">🎨</div>
                <div className="job-badge">Full-time</div>
              </div>
              <h3>UI/UX Designer</h3>
              <p className="company-name">Creative Studio Inc.</p>
              <p className="job-description">Design beautiful and intuitive user experiences for our clients. Work with a talented creative team.</p>
              <div className="job-details">
                <span className="detail-item">📍 New York, NY</span>
                <span className="detail-item">💰 $70k - $100k</span>
                <span className="detail-item">⏰ Posted 3 days ago</span>
              </div>
              <button className="apply-btn" onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setTimeout(() => { setIsLogin(false); setShowAuthModal(true); }, 500); }}>
                Apply Now
              </button>
            </div>

            <div className="job-listing-card">
              <div className="job-listing-header">
                <div className="company-logo">📊</div>
                <div className="job-badge">Full-time</div>
              </div>
              <h3>Data Analyst</h3>
              <p className="company-name">Analytics Solutions</p>
              <p className="job-description">Analyze data and provide insights to drive business decisions. Experience with SQL and Python required.</p>
              <div className="job-details">
                <span className="detail-item">📍 San Francisco, CA</span>
                <span className="detail-item">💰 $75k - $110k</span>
                <span className="detail-item">⏰ Posted 5 days ago</span>
              </div>
              <button className="apply-btn" onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setTimeout(() => { setIsLogin(false); setShowAuthModal(true); }, 500); }}>
                Apply Now
              </button>
            </div>

            <div className="job-listing-card">
              <div className="job-listing-header">
                <div className="company-logo">🚀</div>
                <div className="job-badge">Full-time</div>
              </div>
              <h3>Product Manager</h3>
              <p className="company-name">Innovation Labs</p>
              <p className="job-description">Lead product development from concept to launch. Define roadmaps and work with cross-functional teams.</p>
              <div className="job-details">
                <span className="detail-item">📍 Austin, TX</span>
                <span className="detail-item">💰 $90k - $130k</span>
                <span className="detail-item">⏰ Posted 1 week ago</span>
              </div>
              <button className="apply-btn" onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setTimeout(() => { setIsLogin(false); setShowAuthModal(true); }, 500); }}>
                Apply Now
              </button>
            </div>

            <div className="job-listing-card">
              <div className="job-listing-header">
                <div className="company-logo">💻</div>
                <div className="job-badge">Part-time</div>
              </div>
              <h3>Frontend Developer</h3>
              <p className="company-name">Digital Agency</p>
              <p className="job-description">Create responsive web applications using React and modern JavaScript frameworks.</p>
              <div className="job-details">
                <span className="detail-item">📍 Remote</span>
                <span className="detail-item">💰 $60k - $85k</span>
                <span className="detail-item">⏰ Posted 4 days ago</span>
              </div>
              <button className="apply-btn" onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setTimeout(() => { setIsLogin(false); setShowAuthModal(true); }, 500); }}>
                Apply Now
              </button>
            </div>

            <div className="job-listing-card">
              <div className="job-listing-header">
                <div className="company-logo">📱</div>
                <div className="job-badge">Contract</div>
              </div>
              <h3>Mobile App Developer</h3>
              <p className="company-name">App Development Co.</p>
              <p className="job-description">Build native mobile applications for iOS and Android platforms using React Native.</p>
              <div className="job-details">
                <span className="detail-item">📍 Chicago, IL</span>
                <span className="detail-item">💰 $85k - $115k</span>
                <span className="detail-item">⏰ Posted 6 days ago</span>
              </div>
              <button className="apply-btn" onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setTimeout(() => { setIsLogin(false); setShowAuthModal(true); }, 500); }}>
                Apply Now
              </button>
            </div>
          </div>

          <div className="view-all-container">
            <button className="btn-view-all" onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setTimeout(() => { setIsLogin(false); setShowAuthModal(true); }, 500); }}>
              Sign Up to View All Jobs
            </button>
          </div>
        </div>
      </div>

      {/* About Us Section */}
      <div className="about-section" id="about">
        <div className="about-container">
          <div className="about-content">
            <div className="about-text-section">
              <h2 className="about-title">About Us</h2>
              <p className="about-description">
                CareerWise is a platform dedicated to helping students and professionals make informed career decisions. We provide guidance, resources, and tools to explore career options, develop essential skills, and prepare for real-world opportunities. Our mission is to empower individuals to confidently build their future and achieve long-term success through learning, planning, and growth.
              </p>
              <div className="about-stats">
                
                
                
              </div>
            </div>
            <div className="about-visuals">
              <div className="visual-card card-1">
                
                <h3>Our Mission</h3>
                <p>Empowering career growth through innovative guidance</p>
              </div>
              <div className="visual-card card-2">
                
                <h3>Innovation</h3>
                <p>Cutting-edge tools for career development</p>
              </div>
              <div className="visual-card card-3">
                
                <h3>Community</h3>
                <p>Building connections for success</p>
              </div>
              <div className="visual-card card-4">
               
                <h3>Growth</h3>
                <p>Continuous learning and advancement</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="contact-section" id="contact">
        <div className="contact-container">
          <h2 className="contact-title">Get In Touch</h2>
          <p className="contact-subtitle">Have questions? We'd love to hear from you.</p>
          <div className="contact-content">
            <div className="contact-info">
              <div className="contact-item">
                
                <div>
                  <h3>Email</h3>
                  <p>@careerwise.com</p>
                </div>
              </div>
              <div className="contact-item">
                
                <div>
                  <h3>Phone</h3>
                  <p>+639266849882</p>
                </div>
              </div>
              <div className="contact-item">
                
                <div>
                  <h3>Location</h3>
                  <p>Olongapo City</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="auth-modal-overlay" onClick={() => setShowAuthModal(false)}>
          <div className="auth-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowAuthModal(false)}>×</button>
            
            <div className="form-container">
              <div className="form-header">
                <h1>{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
                <p>{isLogin ? 'Login to your account' : 'Sign up to get started'}</p>
              </div>

        <form onSubmit={isLogin ? handleLogin : handleSignup}>
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="fullName">Full Name</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="username">{isLogin ? 'Username or Email' : 'Username'}</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              minLength={isLogin ? undefined : 3}
            />
            {!isLogin && <small>At least 3 characters</small>}
          </div>

          {!isLogin && (
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={isLogin ? undefined : 6}
            />
            {!isLogin && <small>At least 6 characters</small>}
          </div>

          {!isLogin && (
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
          )}

          {!isLogin && (
            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={(e) => setFormData({...formData, agreeToTerms: e.target.checked})}
                  required
                />
                <span>I agree to the Terms & Conditions and Privacy Policy</span>
              </label>
            </div>
          )}

          {message.text && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}

          <button type="submit" className="btn btn-primary">
            {isLogin ? 'Login' : 'Sign Up'}
          </button>

          {isLogin && (
            <>
              <button type="button" className="btn btn-otp" onClick={handleOTPLogin}>
                Login with OTP
              </button>

              <div className="or-divider">
                <span>OR</span>
              </div>

              <button type="button" className="btn btn-google" onClick={handleGoogleSignIn}>
                <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9.003 18c2.43 0 4.467-.806 5.956-2.18L12.05 13.56c-.806.54-1.836.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9.003 18z" fill="#34A853"/>
                  <path d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.96H.957C.347 6.175 0 7.55 0 9.002c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.426 0 9.003 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29c.708-2.127 2.692-3.71 5.036-3.71z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>
            </>
          )}
        </form>

        <div className="form-footer">
          <p>
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button 
              type="button"
              className="btn-link" 
              onClick={() => { setIsLogin(!isLogin); setMessage({ text: '', type: '' }); }}
            >
              {isLogin ? 'Sign up' : 'Login'}
            </button>
          </p>
        </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default App;

