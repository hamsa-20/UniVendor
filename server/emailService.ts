import nodemailer from 'nodemailer';
import { type SentMessageInfo } from 'nodemailer';

// Check for required email environment variables
if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
  console.warn('Email credentials not set. Email functionality will be limited or disabled.');
}

// Create email transporter
const createTransporter = async () => {
  // Use Hostinger SMTP credentials from environment variables
  if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    console.log(`Creating email transporter with host: ${process.env.EMAIL_HOST}, user: ${process.env.EMAIL_USER}`);
    
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '465'),
      secure: true, // Use SSL
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  // Fallback to console output if no email config
  console.warn('No email credentials found. Using console transport instead.');
  return {
    sendMail: async (mailOptions: any) => {
      console.log('⚠️ Email credentials not configured. Email would have been sent:');
      console.log('To:', mailOptions.to);
      console.log('Subject:', mailOptions.subject);
      console.log('Text:', mailOptions.text);
      console.log('HTML:', mailOptions.html);
      return {
        messageId: 'test-message-id',
        previewURL: null,
      } as SentMessageInfo;
    },
  };
};

/**
 * Generate a random 6-digit OTP code
 * 
 * @returns A 6-digit OTP code
 */
export const generateOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send an email with OTP for authentication
 * 
 * @param to - Recipient email address
 * @param otp - One-time password to send
 * @returns Email delivery information including preview URL for test accounts
 */
export const sendOtpEmail = async (to: string, otp: string) => {
  try {
    const transporter = await createTransporter();
    
    const appName = process.env.VITE_APP_NAME || 'MultiVend';
    
    const mailOptions = {
      from: process.env.EMAIL_USER || `"${appName}" <no-reply@multivend.app>`,
      to,
      subject: `Your ${appName} Verification Code`,
      text: `Your verification code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this code, please ignore this email.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px; color: white; text-align: center; margin-bottom: 20px;">
            <h1 style="margin: 0;">${appName}</h1>
            <p style="margin: 10px 0 0;">Your Verification Code</p>
          </div>
          
          <div style="background-color: #f9f9f9; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 20px;">
            <p style="font-size: 16px; color: #333; margin-bottom: 15px;">Use the following code to verify your email:</p>
            <div style="background-color: #eee; padding: 15px; border-radius: 4px; font-family: monospace; font-size: 24px; letter-spacing: 5px; font-weight: bold; color: #333;">
              ${otp}
            </div>
            <p style="font-size: 14px; color: #666; margin-top: 15px;">This code will expire in 10 minutes.</p>
          </div>
          
          <div style="text-align: center; color: #666; font-size: 14px;">
            <p>If you didn't request this code, please ignore this email.</p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    
    // Only attempt to get test message URL for Ethereal (testing) email
    const isEtherealEmail = typeof info === 'object' && 
                           info.envelope && 
                           info.envelope.from && 
                           info.envelope.from.includes('ethereal.email');
    
    return { 
      success: true, 
      messageId: info.messageId,
      previewUrl: isEtherealEmail ? nodemailer.getTestMessageUrl(info) : undefined
    };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error };
  }
};

export default {
  generateOtp,
  sendOtpEmail,
};