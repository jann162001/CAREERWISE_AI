// Get OTP purpose and contact info from URL params or sessionStorage
const urlParams = new URLSearchParams(window.location.search);
const purpose = urlParams.get('purpose') || sessionStorage.getItem('otpPurpose') || 'login';
const email = urlParams.get('email') || sessionStorage.getItem('otpEmail');
const phoneNumber = sessionStorage.getItem('otpPhone');
const signupData = JSON.parse(sessionStorage.getItem('signupData') || '{}');

const messageDiv = document.getElementById('message');
const resendBtn = document.getElementById('resendBtn');
const timerSpan = document.getElementById('timer');
const contactInfo = document.getElementById('contactInfo');
const otpInputs = document.querySelectorAll('.otp-input');
const otpForm = document.getElementById('otpForm');

let countdown = 60;
let countdownInterval;

// Display contact information
if (email) {
    contactInfo.textContent = email;
} else if (phoneNumber) {
    contactInfo.textContent = phoneNumber;
} else {
    contactInfo.textContent = 'your registered contact';
}

// OTP Input Handling
otpInputs.forEach((input, index) => {
    input.addEventListener('input', (e) => {
        const value = e.target.value;
        
        // Only allow numbers
        if (!/^\d*$/.test(value)) {
            e.target.value = '';
            return;
        }

        // Add filled class
        if (value) {
            e.target.classList.add('filled');
        } else {
            e.target.classList.remove('filled');
        }

        // Auto-focus next input
        if (value && index < otpInputs.length - 1) {
            otpInputs[index + 1].focus();
        }

        // Auto-submit if all fields filled
        if (index === otpInputs.length - 1 && value) {
            const otp = Array.from(otpInputs).map(input => input.value).join('');
            if (otp.length === 6) {
                setTimeout(() => verifyOTP(otp), 300);
            }
        }
    });

    // Handle backspace
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !e.target.value && index > 0) {
            otpInputs[index - 1].focus();
        }
    });

    // Handle paste
    input.addEventListener('paste', (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '');
        
        if (pastedData.length === 6) {
            pastedData.split('').forEach((char, i) => {
                if (otpInputs[i]) {
                    otpInputs[i].value = char;
                    otpInputs[i].classList.add('filled');
                }
            });
            otpInputs[5].focus();
        }
    });
});

// Focus first input on load
otpInputs[0].focus();

// Form submission
otpForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const otp = Array.from(otpInputs).map(input => input.value).join('');
    
    if (otp.length !== 6) {
        showMessage('Please enter complete 6-digit code', 'error');
        return;
    }

    await verifyOTP(otp);
});

// Verify OTP function
async function verifyOTP(otp) {
    try {
        showMessage('Verifying...', 'info');

        const endpoint = purpose === 'signup' 
            ? 'http://localhost:3000/api/auth/verify-otp-signup'
            : 'http://localhost:3000/api/auth/verify-otp-login';

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                email,
                phoneNumber,
                otp
            })
        });

        const data = await response.json();

        if (data.success) {
            showMessage('✅ Verified successfully!', 'success');
            
            if (purpose === 'signup') {
                // Complete registration
                setTimeout(async () => {
                    await completeSignup();
                }, 1000);
            } else {
                // Redirect to dashboard
                setTimeout(() => {
                    if (data.user && data.user.role === 'Admin') {
                        window.location.href = '/admin-dashboard.html';
                    } else {
                        window.location.href = '/dashboard.html';
                    }
                }, 1000);
            }
        } else {
            showMessage(data.message || 'Invalid OTP. Please try again.', 'error');
            clearOTPInputs();
        }
    } catch (error) {
        console.error('Verification error:', error);
        showMessage('Verification failed. Please try again.', 'error');
        clearOTPInputs();
    }
}

// Complete signup after OTP verification
async function completeSignup() {
    try {
        showMessage('Creating your account...', 'info');

        const response = await fetch('http://localhost:3000/api/auth/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(signupData)
        });

        const data = await response.json();

        if (data.success) {
            showMessage('Account created successfully! Redirecting...', 'success');
            sessionStorage.removeItem('signupData');
            sessionStorage.removeItem('otpEmail');
            sessionStorage.removeItem('otpPhone');
            sessionStorage.removeItem('otpPurpose');
            
            setTimeout(() => {
                window.location.href = '/dashboard.html';
            }, 1500);
        } else {
            showMessage(data.message || 'Failed to create account', 'error');
        }
    } catch (error) {
        console.error('Signup error:', error);
        showMessage('Failed to complete registration', 'error');
    }
}

// Resend OTP
resendBtn.addEventListener('click', async () => {
    if (resendBtn.disabled) return;

    try {
        showMessage('Sending new code...', 'info');

        const endpoint = purpose === 'signup'
            ? 'http://localhost:3000/api/auth/request-otp-signup'
            : 'http://localhost:3000/api/auth/request-otp-login';

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                email,
                phoneNumber
            })
        });

        const data = await response.json();

        if (data.success) {
            showMessage('New code sent successfully!', 'success');
            clearOTPInputs();
            startCountdown();
        } else {
            showMessage(data.message || 'Failed to resend code', 'error');
        }
    } catch (error) {
        console.error('Resend error:', error);
        showMessage('Failed to resend code', 'error');
    }
});

// Countdown timer
function startCountdown() {
    countdown = 60;
    resendBtn.disabled = true;
    
    countdownInterval = setInterval(() => {
        countdown--;
        timerSpan.textContent = `(${countdown}s)`;
        
        if (countdown <= 0) {
            clearInterval(countdownInterval);
            timerSpan.textContent = '';
            resendBtn.disabled = false;
        }
    }, 1000);
}

// Clear OTP inputs
function clearOTPInputs() {
    otpInputs.forEach(input => {
        input.value = '';
        input.classList.remove('filled');
    });
    otpInputs[0].focus();
}

// Show message
function showMessage(message, type) {
    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;
}

// Start countdown on load
startCountdown();

// Check if user data exists
if (!email && !phoneNumber) {
    showMessage('Session expired. Please login again.', 'error');
    setTimeout(() => {
        window.location.href = '/login';
    }, 2000);
}
