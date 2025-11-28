const loginForm = document.getElementById('loginForm');
const messageDiv = document.getElementById('message');

// Regular Password Login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    
    messageDiv.className = 'message';
    messageDiv.textContent = '';
    
    if (!username || !password) {
        showMessage('Please fill in all fields', 'error');
        return;
    }
    
    try {
        console.log('Attempting login with:', username);
        const response = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ 
                username: username,
                email: username,
                password: password 
            })
        });
        
        console.log('Response status:', response.status);
        console.log('Response OK:', response.ok);
        
        // Check if response is ok
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', errorText);
            try {
                const errorData = JSON.parse(errorText);
                showMessage(errorData.message || 'Login failed', 'error');
            } catch (parseError) {
                showMessage('Server error. Please try again.', 'error');
            }
            return;
        }
        
        const data = await response.json();
        console.log('Response data:', data);
        
        if (data.success) {
            showMessage('Login successful! Redirecting...', 'success');
            localStorage.setItem('user', JSON.stringify(data.user));
            setTimeout(() => {
                if (data.user.role === 'Admin') {
                    window.location.href = '/admin-dashboard.html';
                } else {
                    window.location.href = '/dashboard.html';
                }
            }, 1000);
        } else {
            showMessage(data.message || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        console.error('Error type:', error.name);
        console.error('Error message:', error.message);
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            showMessage('Unable to connect to server. Please try again.', 'error');
        } else if (error.name === 'SyntaxError') {
            showMessage('Server returned invalid response. Please refresh and try again.', 'error');
        } else {
            showMessage(error.message || 'An error occurred. Please try again.', 'error');
        }
    }
});

// OTP Login Handler
async function handleOTPLogin() {
    const username = document.getElementById('username').value.trim();
    
    if (!username) {
        showMessage('Please enter your email or username', 'error');
        return;
    }

    try {
        showMessage('Sending verification code...', 'info');

        const response = await fetch('http://localhost:3000/api/auth/request-otp-login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                email: username
            })
        });

        const data = await response.json();

        if (data.success) {
            showMessage('✅ Code sent! Redirecting...', 'success');
            sessionStorage.setItem('otpEmail', username);
            sessionStorage.setItem('otpPurpose', 'login');
            
            setTimeout(() => {
                window.location.href = '/verify-otp.html?purpose=login&email=' + encodeURIComponent(username);
            }, 1500);
        } else {
            showMessage(data.message || 'Failed to send code', 'error');
        }
    } catch (error) {
        console.error('OTP request error:', error);
        showMessage('Failed to send verification code', 'error');
    }
}

// Google Sign In Handler
function handleGoogleSignIn() {
    showMessage('Google Sign-In will be implemented with OAuth 2.0', 'info');
    // TODO: Implement Google OAuth
    // window.location.href = 'http://localhost:3000/api/auth/google';
}

// Show message function
function showMessage(message, type) {
    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;
}

// Initialize button handlers when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    const otpLoginBtn = document.getElementById('otpLoginBtn');
    if (otpLoginBtn) {
        otpLoginBtn.addEventListener('click', handleOTPLogin);
        console.log('OTP Login button initialized');
    }

    const googleSignInBtn = document.getElementById('googleSignIn');
    if (googleSignInBtn) {
        googleSignInBtn.addEventListener('click', handleGoogleSignIn);
        console.log('Google Sign In button initialized');
    }
});
