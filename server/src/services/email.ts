import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

/**
 * Send account deletion confirmation email
 */
export async function sendAccountDeletionEmail(
    email: string,
    userName: string = 'User'
): Promise<void> {
    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Account Deletion Confirmation',
        html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9fafb; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Account Deletion Confirmation</h1>
            </div>
            <div class="content">
              <h2>Hi ${userName},</h2>
              <p>This email confirms that your account has been <strong>permanently deleted</strong> from ATS for Candidates.</p>
              
              <p><strong>What this means:</strong></p>
              <ul>
                <li>Your account and all personal data have been removed</li>
                <li>All application history has been deleted</li>
                <li>This action cannot be undone</li>
                <li>You cannot log in with this email address anymore</li>
              </ul>
              
              <p>If you did not request this deletion, please contact our support team immediately.</p>
              
              <p>Thank you for using ATS for Candidates.</p>
            </div>
            <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
              <p>&copy; ${new Date().getFullYear()} ATS for Candidates. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Account deletion email sent to ${email}`);
}

/**
 * Verify email configuration on startup
 */
export async function verifyEmailConfig(): Promise<boolean> {
    try {
        await transporter.verify();
        console.log('✅ Email server is ready');
        return true;
    } catch (error) {
        console.error('❌ Email server error:', error);
        return false;
    }
}