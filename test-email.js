const nodemailer = require('nodemailer');
require('dotenv').config();

async function sendTestEmail() {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  try {
    const info = await transporter.sendMail({
      from: `"CareerWise Test" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // send to yourself
      subject: 'CareerWise Test Email',
      text: 'This is a test email from your CareerWise backend setup.',
      html: '<b>This is a test email from your CareerWise backend setup.</b>'
    });
    console.log('✅ Test email sent:', info.response);
  } catch (error) {
    console.error('❌ Test email send error:', error);
  }
}

sendTestEmail();
