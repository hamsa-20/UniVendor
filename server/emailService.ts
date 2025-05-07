import nodemailer from 'nodemailer';

// Create a test SMTP service account for development
// For production, you should set up a real SMTP server and provide appropriate credentials
const createTestAccount = async () => {
  const testAccount = await nodemailer.createTestAccount();
  return {
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  };
};

// Create a transporter with either test account or real SMTP credentials
const createTransporter = async () => {
  // Check if we have real SMTP credentials in environment variables
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Use test account for development
    const testConfig = await createTestAccount();
    return nodemailer.createTransport(testConfig);
  }
};

/**
 * Send an email with OTP for authentication
 * 
 * @param to - Recipient email address
 * @param otp - One-time password to send
 * @returns Email delivery information including preview URL for test accounts
 */
export const sendOtpEmail = async (to: string, otp: string) => {
  const transporter = await createTransporter();
  
  // Send mail with defined transport object
  const info = await transporter.sendMail({
    from: '"MultiVend" <noreply@multivend.app>',
    to,
    subject: 'Your MultiVend verification code',
    text: `Your verification code is: ${otp}. It will expire in 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #6366f1; margin-bottom: 10px;">MultiVend</h1>
          <p style="color: #4b5563; font-size: 16px;">Your eCommerce platform</p>
        </div>
        <div style="padding: 20px; background-color: #f9fafb; border-radius: 5px; margin-bottom: 20px;">
          <h2 style="color: #111827; margin-top: 0;">Your verification code</h2>
          <p style="color: #4b5563; margin-bottom: 20px;">Please use the following code to verify your email address:</p>
          <div style="text-align: center; margin: 30px 0;">
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #111827; background-color: #e5e7eb; padding: 15px; border-radius: 5px; display: inline-block;">
              ${otp}
            </div>
          </div>
          <p style="color: #4b5563; font-size: 14px;">This code will expire in 10 minutes. If you didn't request this code, you can safely ignore this email.</p>
        </div>
        <div style="text-align: center; color: #9ca3af; font-size: 14px;">
          <p>&copy; ${new Date().getFullYear()} MultiVend. All rights reserved.</p>
        </div>
      </div>
    `,
  });
  
  // Log URL for test accounts (development only)
  if (info.messageId && !process.env.SMTP_HOST) {
    console.log('Email sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    return {
      success: true,
      messageId: info.messageId,
      previewUrl: nodemailer.getTestMessageUrl(info),
    };
  }
  
  return {
    success: true,
    messageId: info.messageId,
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