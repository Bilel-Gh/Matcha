import bcrypt from 'bcrypt';
import { UserRepository } from '../repositories/UserRepository';
import { PhotoRepository } from '../repositories/PhotoRepository';
import { User } from '../types/user';
import { AppError } from '../utils/AppError';
import config from '../config/config';
import { FameRatingService } from './FameRatingService';

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
  fame_rating: number;
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
      fame_rating: user.fame_rating,
      created_at: user.created_at.toISOString(),
    };
  }

  static async getProfile(userId: number): Promise<ProfileResponse> {
    const user = await UserRepository.findById(userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Auto-update fame rating to ensure it's current
    try {
      await FameRatingService.updateUserFameRating(userId);
      // Refetch user data to get updated fame rating
      const updatedUser = await UserRepository.findById(userId);
      if (updatedUser) {
        return this.formatProfileResponse(updatedUser);
      }
    } catch (error) {
      console.error('Failed to update fame rating during profile fetch:', error);
      // Continue with existing user data if fame rating update fails
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

    // Auto-update fame rating when profile is updated
    try {
      await FameRatingService.updateUserFameRating(userId);
      // Refetch user data to get updated fame rating
      const finalUser = await UserRepository.findById(userId);
      if (finalUser) {
        return this.formatProfileResponse(finalUser);
      }
    } catch (error) {
      console.error('Failed to update fame rating after profile update:', error);
      // Continue even if fame rating update fails
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

  static async getUserProfile(viewerId: number, targetUserId: number): Promise<any> {
    // Check if target user exists
    const targetUser = await UserRepository.findById(targetUserId);
    if (!targetUser) {
      throw new AppError('User not found', 404);
    }

    // Check if viewer has blocked target user or vice versa
    const isBlocked = await UserRepository.isBlocked(viewerId, targetUserId);
    if (isBlocked) {
      throw new AppError('User not accessible', 403);
    }

    // Get user photos
    const photos = await PhotoRepository.findByUserId(targetUserId);

    // Get user interests
    const interests = await UserRepository.getUserInterests(targetUserId);

    // Calculate distance between users
    const viewer = await UserRepository.findById(viewerId);
    let distance = 0;
    if (viewer && viewer.latitude && viewer.longitude && targetUser.latitude && targetUser.longitude) {
      distance = this.calculateDistance(
        viewer.latitude,
        viewer.longitude,
        targetUser.latitude,
        targetUser.longitude
      );
    }

    // Get common interests
    const commonInterests = await UserRepository.getCommonInterests(viewerId, targetUserId);

    return {
      id: targetUser.id,
      username: targetUser.username,
      firstname: targetUser.firstname,
      lastname: targetUser.lastname,
      age: targetUser.birth_date ? this.calculateAge(targetUser.birth_date) : 0,
      birth_date: targetUser.birth_date ? targetUser.birth_date.toISOString().split('T')[0] : null,
      email: targetUser.email,
      gender: targetUser.gender,
      sexual_preferences: targetUser.sexual_preferences,
      biography: targetUser.biography,
      city: targetUser.city,
      country: targetUser.country,
      latitude: targetUser.latitude,
      longitude: targetUser.longitude,
      profile_picture_url: targetUser.profile_picture_url,
      fame_rating: targetUser.fame_rating,
      distance_km: Math.round(distance),
      common_interests: commonInterests.count,
      common_interests_names: commonInterests.names,
      is_online: targetUser.is_online,
      last_connection: targetUser.last_connection ? targetUser.last_connection.toISOString() : null,
      photos: photos.map(photo => ({
        id: photo.id,
        url: photo.url,
        is_profile_picture: photo.is_profile_picture
      })),
      interests: interests.map(interest => ({
        id: interest.id,
        name: interest.name
      }))
    };
  }

  private static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
