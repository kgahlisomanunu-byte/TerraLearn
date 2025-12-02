import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const createTransporter = () => {
  return nodemailer.createTransporter({
    service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

export const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `GeoLearnHub <${process.env.EMAIL_USERNAME}>`,
      to: options.email,
      subject: options.subject,
      html: options.html,
    };

    if (options.text) {
      mailOptions.text = options.text;
    }

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('Email sending failed:', error);
    throw new Error('Email could not be sent');
  }
};

export const sendWelcomeEmail = async (user) => {
  const subject = 'Welcome to GeoLearnHub!';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #2E86AB; text-align: center;">Welcome to GeoLearnHub! 🌍</h1>
      <p>Hello ${user.name},</p>
      <p>Welcome to GeoLearnHub - your gateway to interactive geography learning!</p>
      <p>We're excited to have you on board. Here's what you can do:</p>
      <ul>
        <li>Explore interactive geography lessons</li>
        <li>Take quizzes to test your knowledge</li>
        <li>Discover the world through interactive maps</li>
        <li>Track your learning progress</li>
      </ul>
      <p>Start your geography journey today!</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard" 
           style="background-color: #2E86AB; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 5px; display: inline-block;">
          Go to Dashboard
        </a>
      </div>
      <p>Best regards,<br>The GeoLearnHub Team</p>
    </div>
  `;

  return sendEmail({
    email: user.email,
    subject,
    html,
  });
};

export const sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
  
  const subject = 'Password Reset Request - GeoLearnHub';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #2E86AB; text-align: center;">Password Reset</h1>
      <p>Hello ${user.name},</p>
      <p>You requested a password reset for your GeoLearnHub account.</p>
      <p>Click the button below to reset your password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" 
           style="background-color: #2E86AB; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 5px; display: inline-block;">
          Reset Password
        </a>
      </div>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this reset, please ignore this email.</p>
      <p>Best regards,<br>The GeoLearnHub Team</p>
    </div>
  `;

  return sendEmail({
    email: user.email,
    subject,
    html,
  });
};

export const sendProgressNotification = async (user, progress) => {
  const subject = 'Great Progress! - GeoLearnHub';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #2E86AB; text-align: center;">Amazing Progress! 🎉</h1>
      <p>Hello ${user.name},</p>
      <p>You're making great progress in your geography learning journey!</p>
      <p>You've completed <strong>${progress.completedLessons}</strong> lessons and passed <strong>${progress.passedQuizzes}</strong> quizzes.</p>
      <p>Keep up the excellent work!</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/progress" 
           style="background-color: #2E86AB; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 5px; display: inline-block;">
          View Progress
        </a>
      </div>
      <p>Best regards,<br>The GeoLearnHub Team</p>
    </div>
  `;

  return sendEmail({
    email: user.email,
    subject,
    html,
  });
};