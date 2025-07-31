import nodemailer from 'nodemailer';
import config from '../config/config';
import { AppError } from '../utils/AppError';

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: false,
      auth: {
        user: config.SMTP_USER,
        pass: config.SMTP_PASS,
      },
    });
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/verify/${token}`;

    const mailOptions = {
      from: config.SMTP_USER,
      to: email,
      subject: 'Verify your Matcha account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #4CAF50;">Welcome to Matcha!</h2>
          <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}"
               style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Verify Email
            </a>
          </div>
          <p>Or copy and paste this link in your browser:</p>
          <p style="color: #666; word-break: break-all;">${verificationUrl}</p>
          <p>If you didn't create this account, you can safely ignore this email.</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      // Silent error handling - no console output for defense requirements
      throw new AppError('Failed to send verification email', 500);
    }
  }

  async sendPasswordResetEmail(email: string, username: string, token: string): Promise<void> {
    const resetUrl = `${config.FRONTEND_URL}/reset-password/${token}`;

    const mailOptions = {
      from: config.EMAIL_FROM,
      to: email,
      subject: 'Réinitialisation de votre mot de passe - Matcha',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <h2 style="color: #fd297b;">Réinitialisation de votre mot de passe</h2>
          <p>Bonjour ${username},</p>
          <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
          <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}"
               style="background-color: #fd297b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Réinitialiser le mot de passe
            </a>
          </div>
          <p>Ce lien expirera dans ${config.PASSWORD_RESET_EXPIRES_HOURS} heure(s).</p>
          <p>Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email en toute sécurité.</p>
          <hr style="border: none; border-top: 1px solid #eee;" />
          <p style="font-size: 0.9em; color: #888;">Cordialement,<br/>L'équipe Matcha</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      // Silent error handling - no console output for defense requirements
      throw new AppError('Failed to send password reset email', 500);
    }
  }

  async sendReportNotificationEmail(reporterUsername: string, reportedUsername: string, reportedEmail: string, reason: string): Promise<void> {
    const mailOptions = {
      from: config.SMTP_USER,
      to: reportedEmail,
      subject: 'Important: Your Matcha account has been reported',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <h2 style="color: #ff6b6b;">Account Report Notification</h2>
          <p>Dear ${reportedUsername},</p>
          <p>We wanted to inform you that your account has been reported by another user.</p>

          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; padding: 15px; margin: 20px 0;">
            <strong>Report Details:</strong><br/>
            <strong>Reason:</strong> ${reason}<br/>
            <strong>Date:</strong> ${new Date().toLocaleDateString()}
          </div>

          <p>Please note that:</p>
          <ul>
            <li>This is an automated notification</li>
            <li>All reports are reviewed by our moderation team</li>
            <li>If the report is found to be valid, appropriate action may be taken</li>
            <li>False reports are also subject to penalties</li>
          </ul>

          <p><strong>What you should do:</strong></p>
          <ul>
            <li>Review our community guidelines</li>
            <li>Ensure your profile and behavior comply with our terms of service</li>
            <li>Contact support if you believe this report was made in error</li>
          </ul>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${config.FRONTEND_URL}/profile"
               style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Review Your Profile
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #eee;" />
          <p style="font-size: 0.9em; color: #888;">
            Best regards,<br/>
            The Matcha Moderation Team<br/>
            <em>This email was sent automatically. Please do not reply to this email.</em>
          </p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      // Silent error handling - no console output for defense requirements
      throw new AppError('Failed to send report notification email', 500);
    }
  }
}

export default new EmailService();
