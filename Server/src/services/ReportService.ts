import pool from '../config/database';
import { AppError } from '../utils/AppError';

export interface ReportResponse {
  reporter_id: number;
  reported_id: number;
  reason: string;
  created_at: string;
}

export interface ReportInfo {
  id: number;
  reported_user: {
    id: number;
    username: string;
    firstname: string;
    lastname: string;
    profile_picture_url: string;
  };
  reason: string;
  created_at: string;
}

export class ReportService {
  /**
   * Report a user for fake account or inappropriate behavior
   */
  static async reportUser(reporterId: number, reportedId: number, reason: string): Promise<ReportResponse> {
    if (reporterId === reportedId) {
      throw new AppError('Cannot report yourself', 400);
    }

    if (!reason || reason.trim().length === 0) {
      throw new AppError('Report reason is required', 400);
    }

    // Check if user already reported this person recently (within 24 hours)
    const recentReportQuery = `
      SELECT id FROM reports
      WHERE reporter_id = $1 AND reported_id = $2
      AND created_at > NOW() - INTERVAL '24 hours'
    `;
    const recentResult = await pool.query(recentReportQuery, [reporterId, reportedId]);

    if (recentResult.rows.length > 0) {
      throw new AppError('You have already reported this user recently', 429);
    }

    // Insert report
    const insertQuery = `
      INSERT INTO reports (reporter_id, reported_id, reason, created_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING reporter_id, reported_id, reason, created_at
    `;
    const result = await pool.query(insertQuery, [reporterId, reportedId, reason.trim()]);

    return {
      reporter_id: result.rows[0].reporter_id,
      reported_id: result.rows[0].reported_id,
      reason: result.rows[0].reason,
      created_at: result.rows[0].created_at.toISOString(),
    };
  }

  /**
   * Get reports made by the current user
   */
  static async getMyReports(reporterId: number): Promise<ReportInfo[]> {
    const query = `
      SELECT r.id, r.reason, r.created_at,
             u.id as user_id, u.username, u.firstname, u.lastname, u.profile_picture_url
      FROM reports r
      JOIN users u ON r.reported_id = u.id
      WHERE r.reporter_id = $1
      ORDER BY r.created_at DESC
    `;

    const result = await pool.query(query, [reporterId]);
    return result.rows.map(row => ({
      id: row.id,
      reported_user: {
        id: row.user_id,
        username: row.username,
        firstname: row.firstname,
        lastname: row.lastname,
        profile_picture_url: row.profile_picture_url
      },
      reason: row.reason,
      created_at: row.created_at.toISOString()
    }));
  }

  /**
   * Get report count for a specific user (how many times they were reported)
   */
  static async getReportCount(userId: number): Promise<number> {
    const query = 'SELECT COUNT(*) as count FROM reports WHERE reported_id = $1';
    const result = await pool.query(query, [userId]);
    return parseInt(result.rows[0].count);
  }

  /**
   * Check if user A has reported user B
   */
  static async hasReported(reporterId: number, reportedId: number): Promise<boolean> {
    const query = 'SELECT EXISTS(SELECT 1 FROM reports WHERE reporter_id = $1 AND reported_id = $2)';
    const result = await pool.query(query, [reporterId, reportedId]);
    return result.rows[0].exists;
  }

  /**
   * Get recent reports for a user (within specified days)
   */
  static async getRecentReportCount(userId: number, days: number = 7): Promise<number> {
    const query = `
      SELECT COUNT(*) as count FROM reports
      WHERE reported_id = $1
      AND created_at > NOW() - INTERVAL '${days} days'
    `;
    const result = await pool.query(query, [userId]);
    return parseInt(result.rows[0].count);
  }

  /**
   * Get available report reasons (predefined)
   */
  static getReportReasons(): string[] {
    return [
      'Fake account',
      'Inappropriate photos',
      'Harassment',
      'Spam or promotional content',
      'Underage user',
      'Offensive behavior',
      'Scam or fraud',
      'Impersonation',
      'Other'
    ];
  }

  /**
   * Validate report reason
   */
  static validateReportReason(reason: string): boolean {
    const validReasons = this.getReportReasons();
    return validReasons.includes(reason) || reason === 'Other';
  }

  /**
   * Get reports statistics for a user
   */
  static async getUserReportStats(userId: number): Promise<{
    total_reports: number;
    recent_reports: number;
    most_common_reason?: string;
  }> {
    // Get total reports
    const totalQuery = 'SELECT COUNT(*) as count FROM reports WHERE reported_id = $1';
    const totalResult = await pool.query(totalQuery, [userId]);
    const totalReports = parseInt(totalResult.rows[0].count);

    // Get recent reports (last 30 days)
    const recentQuery = `
      SELECT COUNT(*) as count FROM reports
      WHERE reported_id = $1
      AND created_at > NOW() - INTERVAL '30 days'
    `;
    const recentResult = await pool.query(recentQuery, [userId]);
    const recentReports = parseInt(recentResult.rows[0].count);

    // Get most common reason
    let mostCommonReason: string | undefined;
    if (totalReports > 0) {
      const reasonQuery = `
        SELECT reason, COUNT(*) as count
        FROM reports
        WHERE reported_id = $1
        GROUP BY reason
        ORDER BY count DESC
        LIMIT 1
      `;
      const reasonResult = await pool.query(reasonQuery, [userId]);
      mostCommonReason = reasonResult.rows[0]?.reason;
    }

    return {
      total_reports: totalReports,
      recent_reports: recentReports,
      most_common_reason: mostCommonReason
    };
  }
}
