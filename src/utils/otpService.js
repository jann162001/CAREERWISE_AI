const nodemailer = require('nodemailer');
const otpGenerator = require('otp-generator');
const OTP = require('../models/OTP');

// Configure email transporter (for localhost testing, use Ethereal Email or your Gmail)
const createTransporter = () => {
    // For development/testing on localhost, we'll use console logging
    // In production, configure with real SMTP settings
    return nodemailer.createTransporter({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER || 'your-email@gmail.com', // Add to .env
            pass: process.env.EMAIL_PASSWORD || 'your-app-password' // Add to .env (use App Password for Gmail)
        }
    });
};

// Generate OTP
const generateOTP = () => {
    return otpGenerator.generate(6, {
        digits: true,
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false
    });
};

// Send OTP via Email
const sendEmailOTP = async (email, otp, purpose) => {
    try {
        const transporter = createTransporter();
        
        const subject = purpose === 'signup' ? 'Verify Your Email - CareerWise' :
                       purpose === 'login' ? 'Login Verification Code - CareerWise' :
                       'Verification Code - CareerWise';
        
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                    .otp-box { background: white; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; border: 2px solid #667eea; }
                    .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; }
                    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎯 CareerWise</h1>
                        <p>Your Verification Code</p>
                    </div>
                    <div class="content">
                        <h2>Hello!</h2>
                        <p>Your verification code is:</p>
                        <div class="otp-box">
                            <div class="otp-code">${otp}</div>
                        </div>
                        <p><strong>This code will expire in 10 minutes.</strong></p>
                        <p>If you didn't request this code, please ignore this email.</p>
                        <div class="footer">
                            <p>© 2025 CareerWise. All rights reserved.</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;

        // For localhost development, log to console instead of sending
        if (process.env.NODE_ENV === 'development' || !process.env.EMAIL_USER) {
            console.log('📧 [DEV MODE] Email OTP would be sent to:', email);
            console.log('📧 OTP Code:', otp);
            console.log('📧 Purpose:', purpose);
            return { success: true, message: 'OTP logged to console (dev mode)' };
        }

        // Send actual email in production
        await transporter.sendMail({
            from: '"CareerWise" <noreply@careerwise.com>',
            to: email,
            subject: subject,
            html: html
        });

        console.log('✅ Email OTP sent to:', email);
        return { success: true, message: 'OTP sent successfully' };
    } catch (error) {
        console.error('❌ Email send error:', error);
        return { success: false, message: 'Failed to send OTP email' };
    }
};

// Send OTP via SMS (Mock for localhost - would use Twilio in production)
const sendSMSOTP = async (phoneNumber, otp, purpose) => {
    try {
        // For localhost development, just log to console
        console.log('📱 [DEV MODE] SMS OTP would be sent to:', phoneNumber);
        console.log('📱 OTP Code:', otp);
        console.log('📱 Purpose:', purpose);
        
        // In production, integrate Twilio:
        /*
        const client = require('twilio')(
            process.env.TWILIO_ACCOUNT_SID,
            process.env.TWILIO_AUTH_TOKEN
        );
        
        await client.messages.create({
            body: `Your CareerWise verification code is: ${otp}. Valid for 10 minutes.`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: phoneNumber
        });
        */

        return { success: true, message: 'OTP logged to console (dev mode)' };
    } catch (error) {
        console.error('❌ SMS send error:', error);
        return { success: false, message: 'Failed to send OTP SMS' };
    }
};

// Create and store OTP
const createOTP = async ({ userId, email, phoneNumber, purpose }) => {
    try {
        // Delete any existing OTPs for this user/email/phone with same purpose
        const deleteQuery = {};
        if (userId) deleteQuery.userId = userId;
        if (email) deleteQuery.email = email;
        if (phoneNumber) deleteQuery.phoneNumber = phoneNumber;
        deleteQuery.purpose = purpose;
        
        await OTP.deleteMany(deleteQuery);

        // Generate new OTP
        const otp = generateOTP();

        // Create OTP record
        const otpRecord = new OTP({
            userId,
            email,
            phoneNumber,
            otp,
            purpose,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
        });

        await otpRecord.save();

        console.log('✅ OTP created:', { userId, email, phoneNumber, purpose });
        return { success: true, otp, otpId: otpRecord._id };
    } catch (error) {
        console.error('❌ Create OTP error:', error);
        return { success: false, message: 'Failed to create OTP' };
    }
};

// Verify OTP
const verifyOTP = async ({ email, phoneNumber, otp, purpose }) => {
    try {
        const query = { otp, purpose, verified: false };
        if (email) query.email = email;
        if (phoneNumber) query.phoneNumber = phoneNumber;

        const otpRecord = await OTP.findOne(query);

        if (!otpRecord) {
            return { success: false, message: 'Invalid or expired OTP' };
        }

        // Check expiration
        if (new Date() > otpRecord.expiresAt) {
            await OTP.deleteOne({ _id: otpRecord._id });
            return { success: false, message: 'OTP has expired' };
        }

        // Check attempts
        if (otpRecord.attempts >= 5) {
            await OTP.deleteOne({ _id: otpRecord._id });
            return { success: false, message: 'Too many attempts. Please request a new OTP' };
        }

        // Verify successful
        otpRecord.verified = true;
        await otpRecord.save();

        console.log('✅ OTP verified successfully');
        return { success: true, message: 'OTP verified successfully', userId: otpRecord.userId };
    } catch (error) {
        console.error('❌ Verify OTP error:', error);
        return { success: false, message: 'Failed to verify OTP' };
    }
};

// Increment failed attempt
const incrementAttempt = async ({ email, phoneNumber, otp }) => {
    try {
        const query = { otp };
        if (email) query.email = email;
        if (phoneNumber) query.phoneNumber = phoneNumber;

        await OTP.findOneAndUpdate(query, { $inc: { attempts: 1 } });
    } catch (error) {
        console.error('❌ Increment attempt error:', error);
    }
};

module.exports = {
    generateOTP,
    sendEmailOTP,
    sendSMSOTP,
    createOTP,
    verifyOTP,
    incrementAttempt
};
