const signupForm = document.getElementById('signupForm');
const messageDiv = document.getElementById('message');

signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Clear previous messages
    messageDiv.className = 'message';
    messageDiv.textContent = '';
    
    // Validation
    if (!username || !email || !password || !confirmPassword) {
        showMessage('Please fill in all fields', 'error');
        return;
    }
    
    if (username.length < 3) {
        showMessage('Username must be at least 3 characters', 'error');
        return;
    }
    
    if (password.length < 6) {
        showMessage('Password must be at least 6 characters', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showMessage('Passwords do not match', 'error');
        return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showMessage('Please enter a valid email address', 'error');
        return;
    }
    
    try {
        console.log('Attempting signup:', { username, email });
        
        // Store signup data for later (after OTP verification)
        const signupData = {
            fullName: username, // Using username as fullName for now
            username,
            email,
            password
        };
        sessionStorage.setItem('signupData', JSON.stringify(signupData));
        sessionStorage.setItem('otpEmail', email);
        sessionStorage.setItem('otpPurpose', 'signup');

        // Request OTP
        showMessage('Sending verification code...', 'info');
        
        const response = await fetch('http://localhost:3000/api/auth/request-otp-signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ 
                email
            })
        });
        
        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);
        
        if (data.success) {
            showMessage('✅ Verification code sent! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = '/verify-otp.html?purpose=signup&email=' + encodeURIComponent(email);
            }, 1500);
        } else {
            showMessage(data.message || 'Signup failed', 'error');
            sessionStorage.removeItem('signupData');
            sessionStorage.removeItem('otpEmail');
            sessionStorage.removeItem('otpPurpose');
        }
    } catch (error) {
        console.error('Signup error:', error);
        showMessage('An error occurred. Please try again.', 'error');
    }
});

function showMessage(message, type) {
    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;
}

// Google Sign Up
const googleSignUpBtn = document.getElementById('googleSignUp');

googleSignUpBtn.addEventListener('click', () => {
    showMessage('Google Sign-Up will be implemented with OAuth 2.0', 'info');
    // TODO: Implement Google OAuth
    // This will require:
    // 1. Google Cloud Console setup
    // 2. OAuth 2.0 credentials
    // 3. Backend route for Google authentication
    // window.location.href = 'http://localhost:3000/api/auth/google';
});
