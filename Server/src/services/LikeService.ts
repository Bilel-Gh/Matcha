import pool from '../config/database';
import { FameRatingService } from './FameRatingService';
import { AppError } from '../utils/AppError';

export interface LikeResponse {
  liker_id: number;
  liked_id: number;
  created_at: string;
}

export class LikeService {
  /**
   * Add a like (user likes another user)
   */
  static async addLike(likerId: number, likedId: number): Promise<LikeResponse> {
    if (likerId === likedId) {
      throw new AppError('Cannot like yourself', 400);
    }

    // Check if like already exists
    const existingQuery = 'SELECT id FROM likes WHERE liker_id = $1 AND liked_id = $2';
    const existingResult = await pool.query(existingQuery, [likerId, likedId]);

    if (existingResult.rows.length > 0) {
      throw new AppError('Like already exists', 409);
    }

    // Add the like
    const insertQuery = `
      INSERT INTO likes (liker_id, liked_id, created_at)
      VALUES ($1, $2, NOW())
      RETURNING liker_id, liked_id, created_at
    `;
    const result = await pool.query(insertQuery, [likerId, likedId]);

    // Auto-update fame rating for the liked user
    try {
      await FameRatingService.updateUserFameRating(likedId);
    } catch (error) {
      console.error('Failed to update fame rating after like:', error);
      // Continue even if fame rating update fails
    }

    return {
      liker_id: result.rows[0].liker_id,
      liked_id: result.rows[0].liked_id,
      created_at: result.rows[0].created_at.toISOString(),
    };
  }

  /**
   * Remove a like
   */
  static async removeLike(likerId: number, likedId: number): Promise<void> {
    const query = 'DELETE FROM likes WHERE liker_id = $1 AND liked_id = $2';
    const result = await pool.query(query, [likerId, likedId]);

    if (result.rowCount === 0) {
      throw new AppError('Like not found', 404);
    }

    // Auto-update fame rating for the unliked user
    try {
      await FameRatingService.updateUserFameRating(likedId);
    } catch (error) {
      console.error('Failed to update fame rating after unlike:', error);
      // Continue even if fame rating update fails
    }
  }

  /**
   * Get likes count for a user
   */
  static async getLikesCount(userId: number): Promise<number> {
    return FameRatingService.getLikesCount(userId);
  }

  /**
   * Check if user A likes user B
   */
  static async hasLiked(likerId: number, likedId: number): Promise<boolean> {
    const query = 'SELECT EXISTS(SELECT 1 FROM likes WHERE liker_id = $1 AND liked_id = $2)';
    const result = await pool.query(query, [likerId, likedId]);
    return result.rows[0].exists;
  }
}
