import pool from '../config/database';
import { FameRatingService } from './FameRatingService';
import { AppError } from '../utils/AppError';

export interface VisitResponse {
  visitor_id: number;
  visited_id: number;
  visit_date: string;
}

export interface VisitUserInfo {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  age: number;
  profile_picture_url: string;
  fame_rating: number;
  is_online: boolean;
  last_connection?: string;
  visited_at: string;
  visit_count: number;
}

export class VisitService {
  /**
   * Record a profile visit
   */
  static async recordVisit(visitorId: number, visitedId: number): Promise<VisitResponse> {
    if (visitorId === visitedId) {
      throw new AppError('Cannot visit own profile', 400);
    }

    // Check if users are blocked
    const isBlocked = await this.checkIfUsersBlocked(visitorId, visitedId);
    if (isBlocked) {
      throw new AppError('Cannot visit blocked user', 400);
    }

    // Record visit (allow multiple visits)
    const insertQuery = `
      INSERT INTO visits (visitor_id, visited_id, visit_date)
      VALUES ($1, $2, NOW())
      RETURNING visitor_id, visited_id, visit_date
    `;
    const result = await pool.query(insertQuery, [visitorId, visitedId]);

    // Auto-update fame rating for the visited user
    try {
      await FameRatingService.updateUserFameRating(visitedId);
    } catch (error) {
      console.error('Failed to update fame rating after visit:', error);
    }

    return {
      visitor_id: result.rows[0].visitor_id,
      visited_id: result.rows[0].visited_id,
      visit_date: result.rows[0].visit_date.toISOString(),
    };
  }

  /**
   * Get users who visited the current user's profile
   */
  static async getVisitsReceived(userId: number): Promise<VisitUserInfo[]> {
    const query = `
      SELECT u.id, u.username, u.firstname, u.lastname, u.profile_picture_url,
             u.fame_rating, u.is_online, u.last_connection,
             EXTRACT(YEAR FROM AGE(CURRENT_DATE, u.birth_date)) as age,
             COUNT(*) as visit_count,
             MAX(v.visit_date) as visited_at
      FROM visits v
      JOIN users u ON v.visitor_id = u.id
      WHERE v.visited_id = $1
      AND NOT EXISTS (
        SELECT 1 FROM blocks
        WHERE (blocker_id = $1 AND blocked_id = u.id)
        OR (blocker_id = u.id AND blocked_id = $1)
      )
      GROUP BY u.id, u.username, u.firstname, u.lastname, u.profile_picture_url,
               u.fame_rating, u.is_online, u.last_connection, u.birth_date
      ORDER BY visited_at DESC
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
      visited_at: row.visited_at.toISOString(),
      visit_count: parseInt(row.visit_count)
    }));
  }

  /**
   * Get profiles the current user visited
   */
  static async getVisitsGiven(userId: number): Promise<VisitUserInfo[]> {
    const query = `
      SELECT u.id, u.username, u.firstname, u.lastname, u.profile_picture_url,
             u.fame_rating, u.is_online, u.last_connection,
             EXTRACT(YEAR FROM AGE(CURRENT_DATE, u.birth_date)) as age,
             COUNT(*) as visit_count,
             MAX(v.visit_date) as visited_at
      FROM visits v
      JOIN users u ON v.visited_id = u.id
      WHERE v.visitor_id = $1
      AND NOT EXISTS (
        SELECT 1 FROM blocks
        WHERE (blocker_id = $1 AND blocked_id = u.id)
        OR (blocker_id = u.id AND blocked_id = $1)
      )
      GROUP BY u.id, u.username, u.firstname, u.lastname, u.profile_picture_url,
               u.fame_rating, u.is_online, u.last_connection, u.birth_date
      ORDER BY visited_at DESC
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
      visited_at: row.visited_at.toISOString(),
      visit_count: parseInt(row.visit_count)
    }));
  }

  /**
   * Get visit count for a user
   */
  static async getVisitCount(userId: number): Promise<number> {
    const query = 'SELECT COUNT(*) as count FROM visits WHERE visited_id = $1';
    const result = await pool.query(query, [userId]);
    return parseInt(result.rows[0].count);
  }

  /**
   * Check if user A visited user B recently (within last hour)
   */
  static async hasRecentlyVisited(visitorId: number, visitedId: number): Promise<boolean> {
    const query = `
      SELECT EXISTS(
        SELECT 1 FROM visits
        WHERE visitor_id = $1 AND visited_id = $2
        AND visit_date > NOW() - INTERVAL '1 hour'
      )
    `;
    const result = await pool.query(query, [visitorId, visitedId]);
    return result.rows[0].exists;
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
   * Clean up old visits (optional - for performance)
   */
  static async cleanupOldVisits(daysOld: number = 90): Promise<number> {
    const query = `
      DELETE FROM visits
      WHERE visit_date < NOW() - INTERVAL '${daysOld} days'
    `;
    const result = await pool.query(query);
    return result.rowCount || 0;
  }
}
