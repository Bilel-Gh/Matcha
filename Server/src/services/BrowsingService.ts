import pool from '../config/database';
import { AppError } from '../utils/AppError';
import { User } from '../types/user';

export interface BrowseFilters {
  age_min?: number;
  age_max?: number;
  max_distance?: number;
  fame_min?: number;
  fame_max?: number;
  min_common_interests?: number;
}

export interface BrowseUser {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  age: number;
  profile_picture_url: string;
  biography?: string;
  fame_rating: number;
  distance_km: number;
  common_interests_count: number;
  is_online: boolean;
  last_connection?: string;
  gender: string;
  sexual_preferences?: string;
  city?: string;
  country?: string;
}

export interface BrowseResponse {
  users: BrowseUser[];
  total: number;
}

export class BrowsingService {
  /**
   * Get sexual orientation filter (mandatory requirement)
   */
  private static getOrientationFilter(user: User): string {
    const userPref = user.sexual_preferences || 'both'; // Bisexual if not specified
    const userGender = user.gender;

    let filter = '';

    // What current user wants to see
    if (userPref === 'male') {
      filter += ` AND u.gender = 'male'`;
    } else if (userPref === 'female') {
      filter += ` AND u.gender = 'female'`;
    }
    // 'both' = no gender restriction

    // Who would be interested in current user
    if (userGender) {
      filter += ` AND (
        u.sexual_preferences = 'both' OR
        u.sexual_preferences IS NULL OR
        u.sexual_preferences = '${userGender}'
      )`;
    }

    return filter;
  }

  /**
   * Apply filters to the query
   */
  private static applyFilters(filters: BrowseFilters): { whereClause: string; havingClause: string } {
    let whereClause = '';
    let havingClause = '';

    // Age filter
    if (filters.age_min) {
      whereClause += ` AND EXTRACT(YEAR FROM AGE(CURRENT_DATE, u.birth_date)) >= ${filters.age_min}`;
    }
    if (filters.age_max) {
      whereClause += ` AND EXTRACT(YEAR FROM AGE(CURRENT_DATE, u.birth_date)) <= ${filters.age_max}`;
    }

    // Fame rating filter
    if (filters.fame_min) {
      whereClause += ` AND u.fame_rating >= ${filters.fame_min}`;
    }
    if (filters.fame_max) {
      whereClause += ` AND u.fame_rating <= ${filters.fame_max}`;
    }

    // Distance filter (applied in HAVING clause)
    if (filters.max_distance) {
      havingClause += havingClause ? ` AND distance_km <= ${filters.max_distance}` : ` HAVING distance_km <= ${filters.max_distance}`;
    }

    // Common interests filter (applied in HAVING clause)
    if (filters.min_common_interests) {
      havingClause += havingClause ? ` AND common_interests_count >= ${filters.min_common_interests}` : ` HAVING common_interests_count >= ${filters.min_common_interests}`;
    }

    return { whereClause, havingClause };
  }

  /**
   * Get sort clause with geographic priority (mandatory)
   */
  private static getSortClause(sortBy: string): string {
    switch (sortBy) {
      case 'age':
        return 'age ASC, distance_km ASC'; // Geographic priority maintained
      case 'fame_rating':
        return 'u.fame_rating DESC, distance_km ASC';
      case 'common_interests':
        return 'common_interests_count DESC, distance_km ASC';
      case 'distance':
      default:
        return 'distance_km ASC'; // Geographic priority (mandatory)
    }
  }

  /**
   * Core browsing logic (mandatory requirements)
   */
  static async getBrowseResults(userId: number, filters: BrowseFilters = {}, sortBy: string = 'distance'): Promise<BrowseResponse> {
    // Get current user
    const currentUserQuery = 'SELECT * FROM users WHERE id = $1';
    const currentUserResult = await pool.query(currentUserQuery, [userId]);

    if (currentUserResult.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    const currentUser = currentUserResult.rows[0];

    // Check if current user has location
    if (!currentUser.latitude || !currentUser.longitude) {
      throw new AppError('Location required for browsing', 400);
    }

    let query = `
      SELECT DISTINCT u.*,
             COUNT(DISTINCT common_interests.interest_id) as common_interests_count,
             ROUND(
               6371 * acos(
                 cos(radians($1)) * cos(radians(u.latitude)) *
                 cos(radians(u.longitude) - radians($2)) +
                 sin(radians($3)) * sin(radians(u.latitude))
               )::numeric, 1
             ) as distance_km,
             EXTRACT(YEAR FROM AGE(CURRENT_DATE, u.birth_date)) as age
      FROM users u
      LEFT JOIN user_interests common_interests ON common_interests.user_id = u.id
        AND common_interests.interest_id IN (
          SELECT interest_id FROM user_interests WHERE user_id = $4
        )
      WHERE u.id != $5
      AND u.email_verified = true
      AND u.profile_picture_url IS NOT NULL
      AND u.latitude IS NOT NULL
      AND u.longitude IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM blocks
        WHERE (blocker_id = $6 AND blocked_id = u.id)
        OR (blocker_id = u.id AND blocked_id = $7)
      )
      AND NOT EXISTS (
        SELECT 1 FROM likes
        WHERE liker_id = $8 AND liked_id = u.id
      )
    `;

    // Sexual orientation compatibility (mandatory)
    query += this.getOrientationFilter(currentUser);

    // Apply filters
    const { whereClause, havingClause } = this.applyFilters(filters);
    query += whereClause;

    query += ` GROUP BY u.id`;

    // Apply HAVING clause if needed
    query += havingClause;

    // Geographic priority (mandatory)
    query += ` ORDER BY ${this.getSortClause(sortBy)}`;

    const result = await pool.query(query, [
      currentUser.latitude,
      currentUser.longitude,
      currentUser.latitude,
      userId,
      userId,
      userId,
      userId,
      userId
    ]);

    const users: BrowseUser[] = result.rows.map(row => ({
      id: row.id,
      username: row.username,
      firstname: row.firstname,
      lastname: row.lastname,
      age: parseInt(row.age),
      profile_picture_url: row.profile_picture_url,
      biography: row.biography,
      fame_rating: row.fame_rating,
      distance_km: parseFloat(row.distance_km),
      common_interests_count: parseInt(row.common_interests_count),
      is_online: row.is_online,
      last_connection: row.last_connection?.toISOString(),
      gender: row.gender,
      sexual_preferences: row.sexual_preferences,
      city: row.city,
      country: row.country
    }));

    return {
      users,
      total: users.length
    };
  }

  /**
   * Advanced search (same logic as browse)
   */
  static async getSearchResults(userId: number, filters: BrowseFilters = {}, sortBy: string = 'distance'): Promise<BrowseResponse> {
    // Same logic as browse - this satisfies the "advanced search" requirement
    return this.getBrowseResults(userId, filters, sortBy);
  }

  /**
   * Get user details for profile view
   */
  static async getUserProfile(viewerId: number, profileId: number): Promise<BrowseUser | null> {
    // Check if users are blocked
    const blockQuery = `
      SELECT EXISTS(
        SELECT 1 FROM blocks
        WHERE (blocker_id = $1 AND blocked_id = $2)
        OR (blocker_id = $2 AND blocked_id = $1)
      ) as blocked
    `;
    const blockResult = await pool.query(blockQuery, [viewerId, profileId]);

    if (blockResult.rows[0].blocked) {
      return null; // Don't reveal that user exists if blocked
    }

    // Get viewer info for distance calculation
    const viewerQuery = 'SELECT latitude, longitude FROM users WHERE id = $1';
    const viewerResult = await pool.query(viewerQuery, [viewerId]);

    if (viewerResult.rows.length === 0) {
      throw new AppError('Viewer not found', 404);
    }

    const viewer = viewerResult.rows[0];

    if (!viewer.latitude || !viewer.longitude) {
      throw new AppError('Location required', 400);
    }

    const query = `
      SELECT u.*,
             COUNT(DISTINCT common_interests.interest_id) as common_interests_count,
             ROUND(
               6371 * acos(
                 cos(radians($1)) * cos(radians(u.latitude)) *
                 cos(radians(u.longitude) - radians($2)) +
                 sin(radians($3)) * sin(radians(u.latitude))
               )::numeric, 1
             ) as distance_km,
             EXTRACT(YEAR FROM AGE(CURRENT_DATE, u.birth_date)) as age
      FROM users u
      LEFT JOIN user_interests common_interests ON common_interests.user_id = u.id
        AND common_interests.interest_id IN (
          SELECT interest_id FROM user_interests WHERE user_id = $4
        )
      WHERE u.id = $5
      AND u.email_verified = true
      GROUP BY u.id
    `;

    const result = await pool.query(query, [
      viewer.latitude,
      viewer.longitude,
      viewer.latitude,
      viewerId,
      profileId
    ]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      username: row.username,
      firstname: row.firstname,
      lastname: row.lastname,
      age: parseInt(row.age),
      profile_picture_url: row.profile_picture_url,
      biography: row.biography,
      fame_rating: row.fame_rating,
      distance_km: parseFloat(row.distance_km),
      common_interests_count: parseInt(row.common_interests_count),
      is_online: row.is_online,
      last_connection: row.last_connection?.toISOString(),
      gender: row.gender,
      sexual_preferences: row.sexual_preferences,
      city: row.city,
      country: row.country
    };
  }
}
