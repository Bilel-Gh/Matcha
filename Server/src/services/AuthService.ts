import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { UserRepository } from '../repositories/UserRepository';
import { User } from '../types/user';
import { AppError } from '../utils/AppError';
import config from '../config/config';

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
  static async registerUser(userData: RegisterUserData): Promise<void> {
    const { email, username, firstName, lastName, password, birthDate } = userData;

    // Check if user already exists
    const existingUser = await UserRepository.findByEmail(email) ||
                        await UserRepository.findByUsername(username);

    if (existingUser) {
      throw new AppError('User already exists', 409);
    }

    // Hash password and generate verification token
    const hashedPassword = await bcrypt.hash(password, config.BCRYPT_SALT_ROUNDS);
    const verificationToken = uuidv4();

    // Create user
    await UserRepository.create({
      email,
      username,
      firstname: firstName,
      lastname: lastName,
      password: hashedPassword,
      verification_token: verificationToken,
      birth_date: new Date(birthDate),
    });

    // TODO: Send verification email
    console.log(`Verification token for ${email}: ${verificationToken}`);
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
    const token = jwt.sign(
      { id: user.id },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
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
    const user = await UserRepository.findByVerificationToken(token);
    if (!user) {
      throw new AppError('Invalid verification token', 404);
    }

    await UserRepository.markAsVerified(user.id);
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
