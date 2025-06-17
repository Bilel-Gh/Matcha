import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { UserRepository } from '../repositories/UserRepository';
import { User } from '../types/user';
import { AppError } from '../utils/AppError';
import config from '../config/config';
import emailService from './EmailService';
import { LocationService } from './LocationService';

export interface RegisterUserData {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  password: string;
  birthDate: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
  };
}

export class AuthService {
  static async registerUser(data: RegisterUserData, userIP?: string): Promise<AuthResponse> {
    const { email, username, firstName, lastName, password, birthDate } = data;

    // Check if user already exists
    const existingUser = await UserRepository.findByEmail(email);
    if (existingUser) {
      throw new AppError('User already exists', 409);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate verification token
    const verificationToken = uuidv4();

    // Create user
    const user = await UserRepository.create({
      email,
      username,
      firstname: firstName,
      lastname: lastName,
      password: hashedPassword,
      birth_date: new Date(birthDate),
      verification_token: verificationToken,
      email_verified: false,
    });

    // Send verification email
    try {
      await emailService.sendVerificationEmail(email, verificationToken);
    } catch (error) {
      console.error('Failed to send verification email:', error);
      // Continue with registration even if email fails
    }

    // Set initial location from IP if provided
    if (userIP) {
      try {
        await LocationService.setLocationFromIP(user.id, userIP);
      } catch (error) {
        console.error('Failed to set initial location from IP:', error);
        // Continue even if IP location fails
      }
    }

        // Generate JWT token
    const signOptions: SignOptions = {
      expiresIn: config.JWT_EXPIRES_IN as any
    };

    const token = jwt.sign(
      { id: user.id },
      config.JWT_SECRET,
      signOptions
    );

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.firstname,
        last_name: user.lastname,
      },
    };
  }

  static async loginUser(credentials: LoginCredentials): Promise<AuthResponse> {
    const { username, password } = credentials;

    // Find user
    const user = await UserRepository.findByUsername(username);
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    // Check if email is verified
    if (!user.email_verified) {
      throw new AppError('Please verify your email before logging in', 403);
    }

    // Validate password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
    }

        // Generate JWT token
    const signOptions: SignOptions = {
      expiresIn: config.JWT_EXPIRES_IN as any
    };

    const token = jwt.sign(
      { id: user.id },
      config.JWT_SECRET,
      signOptions
    );

    // Update last connection
    await UserRepository.updateLastConnection(user.id);

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.firstname,
        last_name: user.lastname,
      },
    };
  }

  static async verifyEmail(token: string): Promise<void> {
    console.log('Verifying email with token:', token);
    const user = await UserRepository.findByVerificationToken(token);
    console.log('Found user:', user ? 'yes' : 'no');

    if (!user) {
      throw new AppError('Invalid or expired token', 400);
    }

    console.log('Marking user as verified:', user.id);
    await UserRepository.markAsVerified(user.id);
    console.log('User marked as verified successfully');
  }

  static async requestPasswordReset(email: string): Promise<void> {
    const user = await UserRepository.findByEmail(email);

    if (user) {
      const resetToken = uuidv4();
      const expires = new Date(Date.now() + config.PASSWORD_RESET_EXPIRES_HOURS * 3600000);

      await UserRepository.updatePasswordResetToken(user.id, resetToken, expires);

      // TODO: Send password reset email
      console.log(`Password reset token for ${email}: ${resetToken}`);
    }
  }

  static async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await UserRepository.findByPasswordResetToken(token);

    if (!user) {
      throw new AppError('Invalid or expired password reset token', 400);
    }

    const hashedPassword = await bcrypt.hash(newPassword, config.BCRYPT_SALT_ROUNDS);
    await UserRepository.updatePassword(user.id, hashedPassword);
  }
}
