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
  location?: string;
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
  common_interests_names?: string[];
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
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
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
  private static applyFilters(filters: BrowseFilters, startParamIndex: number = 9): {
    whereClause: string;
    havingClause: string;
    joinClause: string;
    params: any[];
    nextParamIndex: number;
  } {
    let whereClause = '';
    let havingClause = '';
    let joinClause = '';
    const params: any[] = [];
    let paramIndex = startParamIndex;

    // Age filter
    if (filters.age_min) {
      whereClause += ` AND EXTRACT(YEAR FROM AGE(CURRENT_DATE, u.birth_date)) >= $${paramIndex}`;
      params.push(filters.age_min);
      paramIndex++;
    }
    if (filters.age_max) {
      whereClause += ` AND EXTRACT(YEAR FROM AGE(CURRENT_DATE, u.birth_date)) <= $${paramIndex}`;
      params.push(filters.age_max);
      paramIndex++;
    }

    // Fame rating filter
    if (filters.fame_min) {
      whereClause += ` AND u.fame_rating >= $${paramIndex}`;
      params.push(filters.fame_min);
      paramIndex++;
    }
    if (filters.fame_max) {
      whereClause += ` AND u.fame_rating <= $${paramIndex}`;
      params.push(filters.fame_max);
      paramIndex++;
    }

    // Location filter (city/country search)
    if (filters.location && filters.location.trim()) {
      const locationSearch = `%${filters.location.trim().toLowerCase()}%`;
      whereClause += ` AND (
        LOWER(u.city) LIKE $${paramIndex} OR
        LOWER(u.country) LIKE $${paramIndex}
      )`;
      params.push(locationSearch);
      paramIndex++;
    }

    // Distance filter (applied in HAVING clause using alias)
    if (filters.max_distance) {
      havingClause += havingClause ? ` AND distance_km <= $${paramIndex}` : ` HAVING distance_km <= $${paramIndex}`;
      params.push(filters.max_distance);
      paramIndex++;
    }

    // Common interests filter (applied in HAVING clause)
    if (filters.min_common_interests) {
      havingClause += havingClause ? ` AND common_interests_count >= $${paramIndex}` : ` HAVING common_interests_count >= $${paramIndex}`;
      params.push(filters.min_common_interests);
      paramIndex++;
    }

    return { whereClause, havingClause, joinClause, params, nextParamIndex: paramIndex };
  }

    /**
   * Get sort clause with geographic priority (mandatory)
   */
  private static getSortClause(sortBy: string): string {
    switch (sortBy) {
      case 'age':
        return 'age ASC, distance_km ASC'; // Geographic priority maintained
      case 'fame_rating':
        return 'fame_rating DESC, distance_km ASC';
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
  static async getBrowseResults(userId: number, filters: BrowseFilters = {}, sortBy: string = 'distance', page: number = 1, limit: number = 20): Promise<BrowseResponse> {
    // Validate pagination parameters
    if (page < 1) page = 1;
    if (limit < 1) limit = 20;
    if (limit > 100) limit = 100; // Prevent excessive load

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

    // First, get total count for pagination
    let countQuery = `
      WITH user_data AS (
        SELECT u.id,
               COUNT(DISTINCT common_interests.interest_id) as common_interests_count,
               ROUND(
                 6371 * acos(
                   cos(radians($1)) * cos(radians(u.latitude)) *
                   cos(radians(u.longitude) - radians($2)) +
                   sin(radians($3)) * sin(radians(u.latitude))
                 )::numeric, 1
               ) as distance_km
        FROM users u
        LEFT JOIN user_interests common_interests ON common_interests.user_id = u.id
          AND common_interests.interest_id IN (
            SELECT interest_id FROM user_interests WHERE user_id = $4
          )
    `;

    // Apply filters for count query
    const { whereClause: countWhereClause, havingClause: countHavingClause, joinClause: countJoinClause, params: countFilterParams } = this.applyFilters(filters);
    countQuery += countJoinClause;

    countQuery += `
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
    countQuery += this.getOrientationFilter(currentUser);

    // Apply additional WHERE filters
    countQuery += countWhereClause;

    countQuery += ` GROUP BY u.id
      )
      SELECT COUNT(*) as total FROM user_data`;

    // Apply HAVING clause if needed
    if (countHavingClause) {
      countQuery += countHavingClause.replace('HAVING', ' WHERE');
    }

    // Get total count
    const countQueryParams = [
      currentUser.latitude,
      currentUser.longitude,
      currentUser.latitude,
      userId,
      userId,
      userId,
      userId,
      userId,
      ...countFilterParams
    ];

    const countResult = await pool.query(countQuery, countQueryParams);
    const total = parseInt(countResult.rows[0].total);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    // If no results, return empty response
    if (total === 0) {
      return {
        users: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
        hasNext: false,
        hasPrev: false
      };
    }

    // Main query with pagination
    let query = `
      WITH user_data AS (
        SELECT u.*,
               COUNT(DISTINCT common_interests.interest_id) as common_interests_count,
               ARRAY_AGG(DISTINCT interests.name) FILTER (WHERE interests.name IS NOT NULL) as common_interests_names,
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
        LEFT JOIN interests ON interests.id = common_interests.interest_id
    `;

    // Apply filters (including specific interests join)
    const { whereClause, havingClause, joinClause, params } = this.applyFilters(filters);
    query += joinClause;

    query += `
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

    // Apply additional WHERE filters
    query += whereClause;

    query += ` GROUP BY u.id
      )
      SELECT * FROM user_data`;

    // Apply HAVING clause if needed (now as WHERE clause on the outer query)
    if (havingClause) {
      query += havingClause.replace('HAVING', ' WHERE');
    }

    // Geographic priority (mandatory)
    query += ` ORDER BY ${this.getSortClause(sortBy)}`;

    // Add pagination
    query += ` LIMIT $${params.length + 9} OFFSET $${params.length + 10}`;

    // Combine base parameters with filter parameters and pagination
    const queryParams = [
      currentUser.latitude,
      currentUser.longitude,
      currentUser.latitude,
      userId,
      userId,
      userId,
      userId,
      userId,
      ...params,
      limit,
      offset
    ];

    const result = await pool.query(query, queryParams);

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
      common_interests_names: row.common_interests_names || [],
      is_online: row.is_online,
      last_connection: row.last_connection?.toISOString(),
      gender: row.gender,
      sexual_preferences: row.sexual_preferences,
      city: row.city,
      country: row.country
    }));

    return {
      users,
      total,
      page,
      limit,
      totalPages,
      hasNext,
      hasPrev
    };
  }

  /**
   * Search users by name, firstname, or username
   */
  static async searchUsersByName(userId: number, searchQuery: string, page: number = 1, limit: number = 20): Promise<BrowseResponse> {
    // Validate pagination parameters
    if (page < 1) page = 1;
    if (limit < 1) limit = 20;
    if (limit > 100) limit = 100;

    // Get current user info for distance calculation and compatibility
    const userQuery = 'SELECT * FROM users WHERE id = $1';
    const userResult = await pool.query(userQuery, [userId]);

    if (userResult.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    const currentUser = userResult.rows[0];

    if (!currentUser.latitude || !currentUser.longitude) {
      throw new AppError('Location required for search', 400);
    }

    // Prepare search terms for ILIKE matching
    const searchTerm = `%${searchQuery.toLowerCase()}%`;

    // First, get total count for pagination
    let countQuery = `
      WITH user_data AS (
        SELECT u.id
        FROM users u
        WHERE u.id != $1
        AND u.email_verified = true
        AND u.profile_picture_url IS NOT NULL
        AND u.latitude IS NOT NULL
        AND u.longitude IS NOT NULL
        AND (
          LOWER(u.firstname) LIKE $2
          OR LOWER(u.lastname) LIKE $3
          OR LOWER(u.username) LIKE $4
          OR LOWER(CONCAT(u.firstname, ' ', u.lastname)) LIKE $5
        )
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
    countQuery += this.getOrientationFilter(currentUser);

    countQuery += `)
      SELECT COUNT(*) as total FROM user_data`;

    const countParams = [
      userId,                  // $1 - exclude self
      searchTerm,              // $2 - firstname like
      searchTerm,              // $3 - lastname like
      searchTerm,              // $4 - username like
      searchTerm,              // $5 - full name like
      userId,                  // $6 - blocks check
      userId,                  // $7 - blocks check
      userId                   // $8 - likes check
    ];

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    // If no results, return empty response
    if (total === 0) {
      return {
        users: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
        hasNext: false,
        hasPrev: false
      };
    }

    let query = `
      WITH user_data AS (
        SELECT u.*,
               COUNT(DISTINCT common_interests.interest_id) as common_interests_count,
               ARRAY_AGG(DISTINCT interests.name) FILTER (WHERE interests.name IS NOT NULL) as common_interests_names,
               ROUND(
                 6371 * acos(
                   cos(radians($1)) * cos(radians(u.latitude)) *
                   cos(radians(u.longitude) - radians($2)) +
                   sin(radians($3)) * sin(radians(u.latitude))
                 )::numeric, 1
               ) as distance_km,
               EXTRACT(YEAR FROM AGE(CURRENT_DATE, u.birth_date)) as age,
               -- Calculate relevance score for sorting
               (
                 CASE
                   WHEN LOWER(u.firstname) = LOWER($4) THEN 100
                   WHEN LOWER(u.lastname) = LOWER($5) THEN 95
                   WHEN LOWER(u.username) = LOWER($6) THEN 90
                   WHEN LOWER(u.firstname) LIKE $7 THEN 80
                   WHEN LOWER(u.lastname) LIKE $8 THEN 75
                   WHEN LOWER(u.username) LIKE $9 THEN 70
                   WHEN LOWER(CONCAT(u.firstname, ' ', u.lastname)) LIKE $10 THEN 85
                   ELSE 50
                 END
               ) as relevance_score
        FROM users u
        LEFT JOIN user_interests common_interests ON common_interests.user_id = u.id
          AND common_interests.interest_id IN (
            SELECT interest_id FROM user_interests WHERE user_id = $11
          )
        LEFT JOIN interests ON interests.id = common_interests.interest_id
        WHERE u.id != $12
        AND u.email_verified = true
        AND u.profile_picture_url IS NOT NULL
        AND u.latitude IS NOT NULL
        AND u.longitude IS NOT NULL
        AND (
          LOWER(u.firstname) LIKE $13
          OR LOWER(u.lastname) LIKE $14
          OR LOWER(u.username) LIKE $15
          OR LOWER(CONCAT(u.firstname, ' ', u.lastname)) LIKE $16
        )
        AND NOT EXISTS (
          SELECT 1 FROM blocks
          WHERE (blocker_id = $17 AND blocked_id = u.id)
          OR (blocker_id = u.id AND blocked_id = $18)
        )
        AND NOT EXISTS (
          SELECT 1 FROM likes
          WHERE liker_id = $19 AND liked_id = u.id
        )
    `;

    // Sexual orientation compatibility (mandatory)
    query += this.getOrientationFilter(currentUser);

    query += ` GROUP BY u.id
      )
      SELECT * FROM user_data
      ORDER BY relevance_score DESC, distance_km ASC
      LIMIT $20 OFFSET $21`;

    const queryParams = [
      currentUser.latitude,    // $1
      currentUser.longitude,   // $2
      currentUser.latitude,    // $3
      searchQuery,             // $4 - exact firstname match
      searchQuery,             // $5 - exact lastname match
      searchQuery,             // $6 - exact username match
      searchTerm,              // $7 - firstname like
      searchTerm,              // $8 - lastname like
      searchTerm,              // $9 - username like
      searchTerm,              // $10 - full name like
      userId,                  // $11 - for common interests
      userId,                  // $12 - exclude self
      searchTerm,              // $13 - firstname like (WHERE clause)
      searchTerm,              // $14 - lastname like (WHERE clause)
      searchTerm,              // $15 - username like (WHERE clause)
      searchTerm,              // $16 - full name like (WHERE clause)
      userId,                  // $17 - blocks check
      userId,                  // $18 - blocks check
      userId,                  // $19 - likes check
      limit,                   // $20 - limit
      offset                   // $21 - offset
    ];

    const result = await pool.query(query, queryParams);

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
      common_interests_names: row.common_interests_names || [],
      is_online: row.is_online,
      last_connection: row.last_connection?.toISOString(),
      gender: row.gender,
      sexual_preferences: row.sexual_preferences,
      city: row.city,
      country: row.country
    }));

    return {
      users,
      total,
      page,
      limit,
      totalPages,
      hasNext,
      hasPrev
    };
  }

  /**
   * Advanced search (same logic as browse)
   */
  static async getSearchResults(userId: number, filters: BrowseFilters = {}, sortBy: string = 'distance', page: number = 1, limit: number = 20): Promise<BrowseResponse> {
    return this.getBrowseResults(userId, filters, sortBy, page, limit);
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
             ARRAY_AGG(DISTINCT interests.name) FILTER (WHERE interests.name IS NOT NULL) as common_interests_names,
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
      LEFT JOIN interests ON interests.id = common_interests.interest_id
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
      common_interests_names: row.common_interests_names || [],
      is_online: row.is_online,
      last_connection: row.last_connection?.toISOString(),
      gender: row.gender,
      sexual_preferences: row.sexual_preferences,
      city: row.city,
      country: row.country
    };
  }
}
