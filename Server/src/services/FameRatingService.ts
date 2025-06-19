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
   * Enhanced fame rating calculation based on profile completeness, likes, and visits
   */
  static calculateFameRating(
    user: User,
    likesReceived: number,
    visitsReceived: number,
    hasProfilePicture: boolean,
    photosCount: number = 0
  ): number {
    let score = 0;

    // Profile completeness (0-40 points)
    if (hasProfilePicture) score += 15;
    if (user.biography && user.biography.length > 20) score += 10;
    if (user.gender && user.sexual_preferences) score += 5;
    if (user.latitude && user.longitude) score += 5;
    if (photosCount >= 3) score += 5; // Bonus for having multiple photos

    // Social activity (0-60 points)
    // Likes received (0-40 points) - more valuable than visits
    score += Math.min(likesReceived * 4, 40);

    // Profile visits (0-20 points) - shows profile attractiveness
    score += Math.min(Math.floor(visitsReceived / 2), 20);

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
   * Get visits count for a user
   */
  static async getVisitsCount(userId: number): Promise<number> {
    const query = 'SELECT COUNT(*) as visits_count FROM visits WHERE visited_id = $1';
    const result = await pool.query(query, [userId]);
    return parseInt(result.rows[0].visits_count);
  }

  /**
   * Get photos count for a user
   */
  static async getPhotosCount(userId: number): Promise<number> {
    const query = 'SELECT COUNT(*) as photos_count FROM photos WHERE user_id = $1';
    const result = await pool.query(query, [userId]);
    return parseInt(result.rows[0].photos_count);
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

    // Get all required data in parallel for efficiency
    const [likesCount, visitsCount, hasProfilePicture, photosCount] = await Promise.all([
      this.getLikesCount(userId),
      this.getVisitsCount(userId),
      PhotoRepository.hasProfilePhoto(userId),
      this.getPhotosCount(userId)
    ]);

    // Calculate rating with enhanced algorithm
    const rating = this.calculateFameRating(user, likesCount, visitsCount, hasProfilePicture, photosCount);

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
