import nodemailer from 'nodemailer';
import config from '../config/config';

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
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/api/auth/verify/${token}`;

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
      console.error('Error sending verification email:', error);
      throw new Error('Failed to send verification email');
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
      console.error('Error sending password reset email:', error);
      // We don't throw an error to the user, as per requirements.
      // The calling service should handle this gracefully.
    }
  }
}

export default new EmailService();
