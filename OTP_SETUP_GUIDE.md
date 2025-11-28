# OTP Authentication System - Setup Guide

## Overview
This system implements OTP (One-Time Password) verification for both sign-up and sign-in processes. Users can verify their identity via email or SMS (email configured for localhost).

## Features Implemented

### ✅ Sign-Up Flow with OTP
1. User enters email and password
2. System sends 6-digit OTP to email
3. User enters OTP on verification page
4. Upon successful verification, account is created
5. User is automatically logged in

### ✅ Sign-In Flow with OTP
1. User can choose "Login with OTP" instead of password
2. System sends OTP to registered email
3. User enters OTP to login
4. No password required!

### ✅ Features
- **6-digit OTP codes** with 10-minute expiration
- **Auto-focus** between input fields
- **Paste support** for OTP codes
- **Resend OTP** with 60-second cooldown
- **Attempt limiting** (max 5 attempts per OTP)
- **Auto-cleanup** of expired OTPs
- **Development mode** - OTPs logged to console

## For Localhost Development

### Current Setup (Development Mode)
Since you're on localhost, the system is configured to log OTPs to the console instead of actually sending emails.

**How to test:**

1. **Start your server:**
   ```bash
   node server.js
   ```

2. **Sign up with a new account:**
   - Go to http://localhost:3000/signup
   - Enter your details
   - Click "Sign Up"

3. **Check the console:**
   ```
   📧 [DEV MODE] Email OTP would be sent to: test@example.com
   📧 OTP Code: 123456
   📧 Purpose: signup
   ```

4. **Enter the OTP from console** into the verification page

5. **Your account will be created!**

### Testing OTP Login:
1. Go to http://localhost:3000/login
2. Click "📱 Login with OTP" button
3. Enter your email
4. Check console for the OTP code
5. Enter it on the verification page

## Production Setup (Real Email/SMS)

### Email Configuration (Gmail)

1. **Enable 2-Factor Authentication** on your Gmail account

2. **Generate App Password:**
   - Go to Google Account → Security
   - Select "App Passwords"
   - Choose "Mail" and "Other"
   - Copy the generated password

3. **Update .env file:**
   ```env
   NODE_ENV=production
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-16-digit-app-password
   ```

### SMS Configuration (Twilio)

1. **Sign up for Twilio:** https://www.twilio.com/

2. **Get credentials:**
   - Account SID
   - Auth Token
   - Phone Number

3. **Install Twilio SDK:**
   ```bash
   npm install twilio
   ```

4. **Update .env file:**
   ```env
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE_NUMBER=your_twilio_phone
   ```

5. **Uncomment Twilio code** in `src/utils/otpService.js`

## API Endpoints

### Request OTP for Signup
```javascript
POST /api/auth/request-otp-signup
Body: { "email": "user@example.com" }
Response: { "success": true, "message": "OTP sent successfully" }
```

### Verify OTP for Signup
```javascript
POST /api/auth/verify-otp-signup
Body: { "email": "user@example.com", "otp": "123456" }
Response: { "success": true, "message": "OTP verified successfully" }
```

### Request OTP for Login
```javascript
POST /api/auth/request-otp-login
Body: { "email": "user@example.com" }
Response: { "success": true, "message": "OTP sent" }
```

### Verify OTP for Login
```javascript
POST /api/auth/verify-otp-login
Body: { "email": "user@example.com", "otp": "123456" }
Response: { "success": true, "user": {...} }
```

## Files Created/Modified

### New Files:
- `src/models/OTP.js` - OTP database model
- `src/utils/otpService.js` - OTP generation and sending utilities
- `public/verify-otp.html` - OTP verification page
- `public/js/verify-otp.js` - OTP verification logic

### Modified Files:
- `src/models/User.js` - Added verification fields
- `src/routes/auth.js` - Added OTP endpoints
- `public/js/signup.js` - Integrated OTP flow
- `public/js/login.js` - Added OTP login option
- `public/login.html` - Added OTP login button
- `.env` - Added email/SMS configuration

## Database Schema

### OTP Collection:
```javascript
{
  userId: ObjectId (optional),
  email: String,
  phoneNumber: String,
  otp: String,
  purpose: String (signup/login/reset-password),
  verified: Boolean,
  attempts: Number,
  expiresAt: Date,
  createdAt: Date
}
```

### User Model Updates:
```javascript
{
  // ... existing fields
  phoneNumber: String,
  isEmailVerified: Boolean,
  isPhoneVerified: Boolean,
  role: String
}
```

## Security Features

✅ OTP expires after 10 minutes
✅ Maximum 5 verification attempts
✅ Automatic cleanup of expired OTPs
✅ OTP is deleted after successful verification
✅ Rate limiting on resend (60 seconds)
✅ Secure session management

## Testing Checklist

- [ ] Sign up with email → receive OTP → verify → account created
- [ ] Sign up with existing email → shows error
- [ ] Enter wrong OTP → shows error message
- [ ] Resend OTP → new code generated
- [ ] Login with OTP → receive code → verify → logged in
- [ ] Login with password → still works
- [ ] OTP expires after 10 minutes
- [ ] Can paste 6-digit code

## Troubleshooting

**OTP not showing in console?**
- Check that `NODE_ENV=development` in .env
- Check server console output

**Email not sending in production?**
- Verify Gmail App Password is correct
- Check that 2FA is enabled
- Try with a different email provider

**Verification page not loading?**
- Check session storage has `otpEmail` and `otpPurpose`
- Verify redirect URL is correct

## Next Steps

1. **Add phone number field** to signup form
2. **Implement SMS verification** with Twilio
3. **Add "Forgot Password"** with OTP
4. **Multi-factor authentication** (password + OTP)
5. **Email templates** customization
6. **Rate limiting** on OTP requests

## Support

For issues or questions:
- Check server console logs
- Verify MongoDB is running
- Check .env configuration
- Review browser console for errors
