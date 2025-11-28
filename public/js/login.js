const loginForm = document.getElementById('loginForm');
const messageDiv = document.getElementById('message');

// Regular Password Login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    
    // Clear previous messages
    messageDiv.className = 'message';
    messageDiv.textContent = '';
    
    // Validation
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
        console.log('Response headers:', response.headers);
        
        // Check if response is ok
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response text:', errorText);
            try {
                const errorData = JSON.parse(errorText);
                showMessage(errorData.message || 'Login failed', 'error');
            } catch (parseError) {
                showMessage('Server error: ' + errorText, 'error');
            }
            return;
        }
        
        const data = await response.json();
        console.log('Response data:', data);
        
        if (data.success) {
            showMessage('Login successful! Redirecting...', 'success');
            // Store user data
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
        console.error('Error stack:', error.stack);
        if (error.message.includes('Failed to fetch')) {
            showMessage('Cannot connect to server. Please make sure the server is running on port 3000.', 'error');
        } else if (error.name === 'SyntaxError') {
            showMessage('Server returned invalid response. Please check server logs.', 'error');
        } else {
            showMessage(error.message || 'An error occurred. Please try again.', 'error');
        }
    }
});

function showMessage(message, type) {
    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;
}

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    // Google Sign In Button
    const googleSignInBtn = document.getElementById('googleSignIn');
    if (googleSignInBtn) {
        googleSignInBtn.addEventListener('click', () => {
            showMessage('Google Sign-In is not configured yet', 'error');
            // TODO: Configure OAuth credentials in Google Cloud Console
            // window.location.href = 'http://localhost:3000/api/auth/google';
        });
    }

    // OTP Login Button
    const otpLoginBtn = document.getElementById('otpLoginBtn');
    if (otpLoginBtn) {
        otpLoginBtn.addEventListener('click', async () => {
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
        });
    }
});
