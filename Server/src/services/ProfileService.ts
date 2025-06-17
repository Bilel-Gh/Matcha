import bcrypt from 'bcrypt';
import { UserRepository } from '../repositories/UserRepository';
import { PhotoRepository } from '../repositories/PhotoRepository';
import { User } from '../types/user';
import { AppError } from '../utils/AppError';
import config from '../config/config';

export interface ProfileResponse {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  email: string;
  gender?: string;
  sexual_preferences?: string;
  biography?: string;
  birth_date?: string;
  age?: number;
  profile_completed: boolean;
  has_profile_picture: boolean;
  profile_picture_url?: string;
  photos_count: number;
  has_location: boolean;
  location?: {
    city?: string;
    country?: string;
    source?: string;
    updated_at?: string;
  };
  created_at: string;
}

export interface ProfileUpdateData {
  firstname?: string;
  lastname?: string;
  email?: string;
  username?: string;
  gender?: string;
  sexual_preferences?: string;
  biography?: string;
  birth_date?: string;
}

export class ProfileService {
  static calculateAge(birthDate: Date): number {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age;
  }

  static isProfileComplete(user: User): boolean {
    return !!(user.gender && user.sexual_preferences && user.biography && user.latitude && user.longitude);
  }

  static async formatProfileResponse(user: User): Promise<ProfileResponse> {
    const hasProfilePicture = await PhotoRepository.hasProfilePhoto(user.id);
    const photosCount = await PhotoRepository.countByUserId(user.id);
    const hasLocation = !!(user.latitude && user.longitude);

    return {
      id: user.id,
      username: user.username,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      gender: user.gender || undefined,
      sexual_preferences: user.sexual_preferences || undefined,
      biography: user.biography || undefined,
      birth_date: user.birth_date ? user.birth_date.toISOString().split('T')[0] : undefined,
      age: user.birth_date ? this.calculateAge(user.birth_date) : undefined,
      profile_completed: this.isProfileComplete(user),
      has_profile_picture: hasProfilePicture,
      profile_picture_url: user.profile_picture_url || undefined,
      photos_count: photosCount,
      has_location: hasLocation,
      location: hasLocation ? {
        city: user.city || undefined,
        country: user.country || undefined,
        source: user.location_source || undefined,
        updated_at: user.location_updated_at?.toISOString(),
      } : undefined,
      created_at: user.created_at.toISOString(),
    };
  }

  static async getProfile(userId: number): Promise<ProfileResponse> {
    const user = await UserRepository.findById(userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return this.formatProfileResponse(user);
  }

  static async updateProfile(userId: number, updateData: ProfileUpdateData): Promise<ProfileResponse> {
    const updates: any = {};

    // Check for email/username uniqueness if provided
    if (updateData.email !== undefined) {
      const emailExists = await UserRepository.checkEmailExists(updateData.email, userId);
      if (emailExists) {
        throw new AppError('Email already exists', 409);
      }
      updates.email = updateData.email;
    }

    if (updateData.username !== undefined) {
      const usernameExists = await UserRepository.checkUsernameExists(updateData.username, userId);
      if (usernameExists) {
        throw new AppError('Username already exists', 409);
      }
      updates.username = updateData.username;
    }

    // Process and validate each field
    if (updateData.firstname !== undefined) {
      updates.firstname = updateData.firstname.trim();
    }

    if (updateData.lastname !== undefined) {
      updates.lastname = updateData.lastname.trim();
    }

    if (updateData.gender !== undefined) {
      updates.gender = updateData.gender;
    }

    if (updateData.sexual_preferences !== undefined) {
      updates.sexual_preferences = updateData.sexual_preferences;
    }

    if (updateData.biography !== undefined) {
      updates.biography = updateData.biography.trim();
    }

    if (updateData.birth_date !== undefined) {
      updates.birth_date = new Date(updateData.birth_date);
    }

    const updatedUser = await UserRepository.updateProfile(userId, updates);

    if (!updatedUser) {
      throw new AppError('Failed to update profile', 500);
    }

    return this.formatProfileResponse(updatedUser);
  }

  static async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<void> {
    const user = await UserRepository.findById(userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new AppError('Current password is incorrect', 400);
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, config.BCRYPT_SALT_ROUNDS);

    // Update password
    await UserRepository.updatePassword(userId, hashedNewPassword);
  }
}
