import pool from '../config/database';
import { FameRatingService } from './FameRatingService';
import { NotificationService } from './NotificationService';
import { AppError } from '../utils/AppError';
import { UserRepository } from '../repositories/UserRepository';

export interface LikeResponse {
  liker_id: number;
  liked_id: number;
  created_at: string;
}

export interface LikeUserInfo {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  age: number;
  profile_picture_url: string;
  fame_rating: number;
  is_online: boolean;
  last_connection?: string;
  created_at: string;
}

export interface MatchInfo {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  age: number;
  profile_picture_url: string;
  fame_rating: number;
  is_online: boolean;
  last_connection?: string;
  match_date: string;
}

export interface LikeStatusResponse {
  i_liked_them: boolean;
  they_liked_me: boolean;
  is_match: boolean;
}

export class LikeService {
  /**
   * Add a like (user likes another user)
   */
  static async addLike(likerId: number, likedId: number): Promise<{ success: boolean; match: boolean; message: string }> {
    if (likerId === likedId) {
      throw new AppError('Cannot like yourself', 400);
    }

    // Check if liker has profile picture (mandatory requirement)
    const liker = await UserRepository.findById(likerId);
    if (!liker?.profile_picture_url) {
      throw new AppError('You must have a profile picture to like other users. Please upload a photo in your profile settings.', 400);
    }

    // Check if liked user exists
    const likedUser = await UserRepository.findById(likedId);
    if (!likedUser) {
      throw new AppError('User not found', 404);
    }

    // Check if users are blocked
    const isBlocked = await this.checkIfUsersBlocked(likerId, likedId);
    if (isBlocked) {
      throw new AppError('Cannot like blocked user', 400);
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
    await pool.query(insertQuery, [likerId, likedId]);

    // Check for match (mutual like)
    const isMatch = await this.checkForMatch(likerId, likedId);

    // Auto-update fame rating for the liked user
    try {
      await FameRatingService.updateUserFameRating(likedId);
    } catch (error) {
      // Silent error handling - no console output for defense requirements
    }

    // Create notifications
    try {
      if (isMatch) {
        // Create match notification for both users
        await NotificationService.createMatchNotification(likerId, likedId);
      } else {
        // Create like notification for the liked user
        await NotificationService.createLikeNotification(likedId, likerId);
      }
    } catch (error) {
      // Silent error handling - no console output for defense requirements
    }

    return {
      success: true,
      match: isMatch,
      message: isMatch ? "It's a match! 🎉" : "Like sent! ❤️"
    };
  }

  /**
   * Remove a like
   */
  static async removeLike(likerId: number, likedId: number): Promise<void> {
    // Vérifier d'abord si c'était un match avant de supprimer
    const wasMatch = await this.checkForMatch(likerId, likedId);

    const query = 'DELETE FROM likes WHERE liker_id = $1 AND liked_id = $2';
    const result = await pool.query(query, [likerId, likedId]);

    if (result.rowCount === 0) {
      throw new AppError('Like not found', 404);
    }

    try {
      await NotificationService.createUnlikeNotification(likedId, likerId, wasMatch);
    } catch (error) {
      // Silent error handling - no console output for defense requirements
    }

    // Auto-update fame rating for the unliked user
    try {
      await FameRatingService.updateUserFameRating(likedId);
    } catch (error) {
      // Silent error handling - no console output for defense requirements
    }
  }

  /**
   * Get users who liked the current user
   */
  static async getLikesReceived(userId: number): Promise<LikeUserInfo[]> {
    const query = `
      SELECT u.id, u.username, u.firstname, u.lastname, u.profile_picture_url,
             u.fame_rating, u.is_online, u.last_connection, l.created_at,
             EXTRACT(YEAR FROM AGE(CURRENT_DATE, u.birth_date)) as age
      FROM likes l
      JOIN users u ON l.liker_id = u.id
      WHERE l.liked_id = $1
      AND NOT EXISTS (
        SELECT 1 FROM blocks
        WHERE (blocker_id = $1 AND blocked_id = u.id)
        OR (blocker_id = u.id AND blocked_id = $1)
      )
      ORDER BY l.created_at DESC
    `;

    const result = await pool.query(query, [userId]);
    return result.rows.map(row => ({
      id: row.id,
      username: row.username,
      firstname: row.firstname,
      lastname: row.lastname,
      age: parseInt(row.age),
      profile_picture_url: row.profile_picture_url,
      fame_rating: row.fame_rating,
      is_online: row.is_online,
      last_connection: row.last_connection?.toISOString(),
      created_at: row.created_at.toISOString()
    }));
  }

  /**
   * Get users the current user liked
   */
  static async getLikesGiven(userId: number): Promise<LikeUserInfo[]> {
    const query = `
      SELECT u.id, u.username, u.firstname, u.lastname, u.profile_picture_url,
             u.fame_rating, u.is_online, u.last_connection, l.created_at,
             EXTRACT(YEAR FROM AGE(CURRENT_DATE, u.birth_date)) as age
      FROM likes l
      JOIN users u ON l.liked_id = u.id
      WHERE l.liker_id = $1
      AND NOT EXISTS (
        SELECT 1 FROM blocks
        WHERE (blocker_id = $1 AND blocked_id = u.id)
        OR (blocker_id = u.id AND blocked_id = $1)
      )
      ORDER BY l.created_at DESC
    `;

    const result = await pool.query(query, [userId]);
    return result.rows.map(row => ({
      id: row.id,
      username: row.username,
      firstname: row.firstname,
      lastname: row.lastname,
      age: parseInt(row.age),
      profile_picture_url: row.profile_picture_url,
      fame_rating: row.fame_rating,
      is_online: row.is_online,
      last_connection: row.last_connection?.toISOString(),
      created_at: row.created_at.toISOString()
    }));
  }

  /**
   * Get matches (mutual likes)
   */
  static async getMatches(userId: number): Promise<MatchInfo[]> {
    const query = `
      SELECT DISTINCT u.id, u.username, u.firstname, u.lastname, u.profile_picture_url,
             u.fame_rating, u.is_online, u.last_connection,
             EXTRACT(YEAR FROM AGE(CURRENT_DATE, u.birth_date)) as age,
             GREATEST(l1.created_at, l2.created_at) as match_date
      FROM likes l1
      JOIN likes l2 ON l1.liker_id = l2.liked_id AND l1.liked_id = l2.liker_id
      JOIN users u ON u.id = CASE
        WHEN l1.liker_id = $1 THEN l1.liked_id
        ELSE l1.liker_id
      END
      WHERE (l1.liker_id = $1 OR l1.liked_id = $1)
      AND u.id != $1
      AND NOT EXISTS (
        SELECT 1 FROM blocks
        WHERE (blocker_id = $1 AND blocked_id = u.id)
        OR (blocker_id = u.id AND blocked_id = $1)
      )
      ORDER BY match_date DESC
    `;

    const result = await pool.query(query, [userId]);
    return result.rows.map(row => ({
      id: row.id,
      username: row.username,
      firstname: row.firstname,
      lastname: row.lastname,
      age: parseInt(row.age),
      profile_picture_url: row.profile_picture_url,
      fame_rating: row.fame_rating,
      is_online: row.is_online,
      last_connection: row.last_connection?.toISOString(),
      match_date: row.match_date.toISOString()
    }));
  }

  /**
   * Get like status between two users
   */
  static async getLikeStatus(currentUserId: number, otherUserId: number): Promise<LikeStatusResponse> {
    const query = `
      SELECT
        EXISTS(SELECT 1 FROM likes WHERE liker_id = $1 AND liked_id = $2) as i_liked_them,
        EXISTS(SELECT 1 FROM likes WHERE liker_id = $2 AND liked_id = $1) as they_liked_me
    `;

    const result = await pool.query(query, [currentUserId, otherUserId]);
    const row = result.rows[0];
    const isMatch = row.i_liked_them && row.they_liked_me;

    return {
      i_liked_them: !!row.i_liked_them,
      they_liked_me: !!row.they_liked_me,
      is_match: isMatch
    };
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

  /**
   * Check for match (mutual like)
   */
  private static async checkForMatch(userId1: number, userId2: number): Promise<boolean> {
    const query = `
      SELECT COUNT(*) as count FROM likes
      WHERE (liker_id = $1 AND liked_id = $2)
      AND EXISTS (
        SELECT 1 FROM likes
        WHERE liker_id = $2 AND liked_id = $1
      )
    `;

    const result = await pool.query(query, [userId1, userId2]);
    return result.rows[0].count > 0;
  }

  /**
   * Check if users are blocked from each other
   */
  private static async checkIfUsersBlocked(userId1: number, userId2: number): Promise<boolean> {
    const query = `
      SELECT EXISTS(
        SELECT 1 FROM blocks
        WHERE (blocker_id = $1 AND blocked_id = $2)
        OR (blocker_id = $2 AND blocked_id = $1)
      ) as blocked
    `;

    const result = await pool.query(query, [userId1, userId2]);
    return result.rows[0].blocked;
  }

  /**
   * Remove all likes between two users (used when blocking)
   */
  static async removeLikesBetweenUsers(userId1: number, userId2: number): Promise<void> {
    const query = `
      DELETE FROM likes
      WHERE (liker_id = $1 AND liked_id = $2)
      OR (liker_id = $2 AND liked_id = $1)
    `;

    await pool.query(query, [userId1, userId2]);

    // Update fame ratings for both users
    try {
      await Promise.all([
        FameRatingService.updateUserFameRating(userId1),
        FameRatingService.updateUserFameRating(userId2)
      ]);
    } catch (error) {
      // Silent error handling - no console output for defense requirements
    }
  }
}
