import pool from '../config/database';
import { LikeService } from './LikeService';
import { AppError } from '../utils/AppError';

export interface BlockResponse {
  blocker_id: number;
  blocked_id: number;
  reason?: string;
  created_at: string;
}

export interface BlockedUserInfo {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  age: number;
  profile_picture_url: string;
  reason?: string;
  blocked_at: string;
}

export class BlockService {
  /**
   * Block a user
   */
  static async blockUser(blockerId: number, blockedId: number, reason?: string): Promise<BlockResponse> {
    if (blockerId === blockedId) {
      throw new AppError('Cannot block yourself', 400);
    }

    // Check if block already exists
    const existingQuery = 'SELECT id FROM blocks WHERE blocker_id = $1 AND blocked_id = $2';
    const existingResult = await pool.query(existingQuery, [blockerId, blockedId]);

    if (existingResult.rows.length > 0) {
      throw new AppError('User already blocked', 409);
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Insert block
      const insertQuery = `
        INSERT INTO blocks (blocker_id, blocked_id, reason, created_at)
        VALUES ($1, $2, $3, NOW())
        RETURNING blocker_id, blocked_id, reason, created_at
      `;
      const result = await client.query(insertQuery, [blockerId, blockedId, reason || null]);

      // Remove any existing likes between users
      await LikeService.removeLikesBetweenUsers(blockerId, blockedId);

      await client.query('COMMIT');

      return {
        blocker_id: result.rows[0].blocker_id,
        blocked_id: result.rows[0].blocked_id,
        reason: result.rows[0].reason,
        created_at: result.rows[0].created_at.toISOString(),
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Unblock a user
   */
  static async unblockUser(blockerId: number, blockedId: number): Promise<void> {
    const query = 'DELETE FROM blocks WHERE blocker_id = $1 AND blocked_id = $2';
    const result = await pool.query(query, [blockerId, blockedId]);

    if (result.rowCount === 0) {
      throw new AppError('Block not found', 404);
    }
  }

  /**
   * Get list of users blocked by the current user
   */
  static async getBlockedUsers(blockerId: number): Promise<BlockedUserInfo[]> {
    const query = `
      SELECT u.id, u.username, u.firstname, u.lastname, u.profile_picture_url,
             EXTRACT(YEAR FROM AGE(CURRENT_DATE, u.birth_date)) as age,
             b.reason, b.created_at as blocked_at
      FROM blocks b
      JOIN users u ON b.blocked_id = u.id
      WHERE b.blocker_id = $1
      ORDER BY b.created_at DESC
    `;

    const result = await pool.query(query, [blockerId]);
    return result.rows.map(row => ({
      id: row.id,
      username: row.username,
      firstname: row.firstname,
      lastname: row.lastname,
      age: parseInt(row.age),
      profile_picture_url: row.profile_picture_url,
      reason: row.reason,
      blocked_at: row.blocked_at.toISOString()
    }));
  }

  /**
   * Check if user A blocked user B
   */
  static async hasBlocked(blockerId: number, blockedId: number): Promise<boolean> {
    const query = 'SELECT EXISTS(SELECT 1 FROM blocks WHERE blocker_id = $1 AND blocked_id = $2)';
    const result = await pool.query(query, [blockerId, blockedId]);
    return result.rows[0].exists;
  }

  /**
   * Check if two users are blocked from each other (either direction)
   */
  static async areUsersBlocked(userId1: number, userId2: number): Promise<boolean> {
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
   * Get block count for a user (how many people blocked them)
   */
  static async getBlockedCount(userId: number): Promise<number> {
    const query = 'SELECT COUNT(*) as count FROM blocks WHERE blocked_id = $1';
    const result = await pool.query(query, [userId]);
    return parseInt(result.rows[0].count);
  }

  /**
   * Get blocking count for a user (how many people they blocked)
   */
  static async getBlockingCount(userId: number): Promise<number> {
    const query = 'SELECT COUNT(*) as count FROM blocks WHERE blocker_id = $1';
    const result = await pool.query(query, [userId]);
    return parseInt(result.rows[0].count);
  }

  /**
   * Get block status between two users
   */
  static async getBlockStatus(currentUserId: number, otherUserId: number): Promise<{
    i_blocked_them: boolean;
    they_blocked_me: boolean;
    blocked_either_way: boolean;
  }> {
    const query = `
      SELECT
        EXISTS(SELECT 1 FROM blocks WHERE blocker_id = $1 AND blocked_id = $2) as i_blocked_them,
        EXISTS(SELECT 1 FROM blocks WHERE blocker_id = $2 AND blocked_id = $1) as they_blocked_me
    `;

    const result = await pool.query(query, [currentUserId, otherUserId]);
    const row = result.rows[0];

    return {
      i_blocked_them: !!row.i_blocked_them,
      they_blocked_me: !!row.they_blocked_me,
      blocked_either_way: row.i_blocked_them || row.they_blocked_me
    };
  }
}
