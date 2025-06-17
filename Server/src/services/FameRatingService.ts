import { UserRepository } from '../repositories/UserRepository';
import { PhotoRepository } from '../repositories/PhotoRepository';
import pool from '../config/database';
import { User } from '../types/user';

export interface FameRatingResponse {
  user_id: number;
  fame_rating: number;
}

export class FameRatingService {
  /**
   * Simple fame rating calculation based on profile completeness and likes received
   */
  static calculateSimpleFameRating(user: User, likesReceived: number, hasProfilePicture: boolean): number {
    let score = 0;

    // Profile completeness (0-50 points)
    if (hasProfilePicture) score += 20;
    if (user.biography) score += 10;
    if (user.gender && user.sexual_preferences) score += 10;
    if (user.latitude && user.longitude) score += 10;

    // Likes received (0-50 points)
    score += Math.min(likesReceived * 5, 50);

    return Math.min(score, 100);
  }

  /**
   * Get likes count for a user
   */
  static async getLikesCount(userId: number): Promise<number> {
    const query = 'SELECT COUNT(*) as likes_count FROM likes WHERE liked_id = $1';
    const result = await pool.query(query, [userId]);
    return parseInt(result.rows[0].likes_count);
  }

  /**
   * Update user's fame rating in database
   */
  static async updateUserFameRating(userId: number): Promise<FameRatingResponse> {
    // Get user data
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get likes count
    const likesCount = await this.getLikesCount(userId);

    // Check if user has profile picture
    const hasProfilePicture = await PhotoRepository.hasProfilePhoto(userId);

    // Calculate rating
    const rating = this.calculateSimpleFameRating(user, likesCount, hasProfilePicture);

    // Update database
    const query = 'UPDATE users SET fame_rating = $1 WHERE id = $2 RETURNING fame_rating';
    const result = await pool.query(query, [rating, userId]);

    return {
      user_id: userId,
      fame_rating: result.rows[0].fame_rating,
    };
  }

  /**
   * Batch update fame ratings for multiple users
   */
  static async batchUpdateFameRatings(userIds: number[]): Promise<FameRatingResponse[]> {
    const results: FameRatingResponse[] = [];

    for (const userId of userIds) {
      try {
        const result = await this.updateUserFameRating(userId);
        results.push(result);
      } catch (error) {
        console.error(`Failed to update fame rating for user ${userId}:`, error);
      }
    }

    return results;
  }
}
