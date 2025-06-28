import pool from '../config/database';
import { User } from '../types/user';

export interface CreateUserData {
  email: string;
  username: string;
  firstname: string;
  lastname: string;
  password: string;
  verification_token: string;
  birth_date: Date;
  email_verified?: boolean;
}

export class UserRepository {
  static async create(userData: CreateUserData): Promise<User> {
    const { email, username, firstname, lastname, password, verification_token, birth_date, email_verified = false } = userData;

    const query = `
      INSERT INTO users (email, username, firstname, lastname, password, verification_token, birth_date, email_verified)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const result = await pool.query(query, [
      email, username, firstname, lastname, password, verification_token, birth_date, email_verified
    ]);

    return result.rows[0];
  }

  static async findByEmail(email: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
  }

  static async findByUsername(username: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE username = $1';
    const result = await pool.query(query, [username]);
    return result.rows[0] || null;
  }

  static async findById(id: number): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  static async findByVerificationToken(token: string): Promise<User | null> {
    // Silent token search - no console output for defense requirements
    const result = await pool.query('SELECT * FROM users WHERE verification_token = $1', [token]);
    // Silent query result handling - no console output for defense requirements
    return result.rows[0] || null;
  }

  static async markAsVerified(id: number): Promise<void> {
    // Silent verification update - no console output for defense requirements
    await pool.query('UPDATE users SET email_verified = true, verification_token = null WHERE id = $1', [id]);
    // Silent update completion - no console output for defense requirements
  }

  static async findByPasswordResetToken(token: string): Promise<User | null> {
    const query = `
      SELECT * FROM users
      WHERE password_reset_token = $1 AND password_reset_expires > NOW()
    `;
    const result = await pool.query(query, [token]);
    return result.rows[0] || null;
  }

  static async updatePasswordResetToken(
    id: number,
    token: string | null,
    expires: Date | null
  ): Promise<User | null> {
    const query = `
      UPDATE users
      SET password_reset_token = $1, password_reset_expires = $2
      WHERE id = $3
      RETURNING *
    `;
    const result = await pool.query(query, [token, expires, id]);
    return result.rows[0] || null;
  }

  static async updatePassword(id: number, password: string): Promise<User | null> {
    const query = `
      UPDATE users
      SET password = $1, password_reset_token = null, password_reset_expires = null
      WHERE id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [password, id]);
    return result.rows[0] || null;
  }

  static async updateLastConnection(id: number): Promise<void> {
    const query = `
      UPDATE users
      SET last_connection = NOW(), is_online = true
      WHERE id = $1
    `;
    await pool.query(query, [id]);
  }

  static async setOffline(id: number): Promise<void> {
    const query = `
      UPDATE users
      SET is_online = false
      WHERE id = $1
    `;
    await pool.query(query, [id]);
  }

  static async checkEmailExists(email: string, excludeUserId?: number): Promise<boolean> {
    let query = 'SELECT id FROM users WHERE email = $1';
    let params: any[] = [email];

    if (excludeUserId) {
      query += ' AND id != $2';
      params.push(excludeUserId);
    }

    const result = await pool.query(query, params);
    return result.rows.length > 0;
  }

  static async checkUsernameExists(username: string, excludeUserId?: number): Promise<boolean> {
    let query = 'SELECT id FROM users WHERE username = $1';
    let params: any[] = [username];

    if (excludeUserId) {
      query += ' AND id != $2';
      params.push(excludeUserId);
    }

    const result = await pool.query(query, params);
    return result.rows.length > 0;
  }

  static async updateLocation(
    id: number,
    locationData: {
      latitude?: number;
      longitude?: number;
      location_source?: string;
      city?: string;
      country?: string;
      location_updated_at?: Date;
    }
  ): Promise<User | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (locationData.latitude !== undefined) {
      fields.push(`latitude = $${paramCount++}`);
      values.push(locationData.latitude);
    }
    if (locationData.longitude !== undefined) {
      fields.push(`longitude = $${paramCount++}`);
      values.push(locationData.longitude);
    }
    if (locationData.location_source !== undefined) {
      fields.push(`location_source = $${paramCount++}`);
      values.push(locationData.location_source);
    }
    if (locationData.city !== undefined) {
      fields.push(`city = $${paramCount++}`);
      values.push(locationData.city);
    }
    if (locationData.country !== undefined) {
      fields.push(`country = $${paramCount++}`);
      values.push(locationData.country);
    }
    if (locationData.location_updated_at !== undefined) {
      fields.push(`location_updated_at = $${paramCount++}`);
      values.push(locationData.location_updated_at);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    const query = `
      UPDATE users
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  static async findUsersWithLocation(excludeUserId?: number): Promise<User[]> {
    let query = `
      SELECT * FROM users
      WHERE latitude IS NOT NULL
      AND longitude IS NOT NULL
      AND email_verified = true
    `;
    const params: any[] = [];

    if (excludeUserId) {
      query += ' AND id != $1';
      params.push(excludeUserId);
    }

    const result = await pool.query(query, params);
    return result.rows;
  }

  static async updateProfile(
    id: number,
    updates: {
      firstname?: string;
      lastname?: string;
      email?: string;
      username?: string;
      gender?: string;
      sexual_preferences?: string;
      biography?: string;
      birth_date?: Date;
    }
  ): Promise<User | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    // Build dynamic query based on provided fields
    if (updates.firstname !== undefined) {
      fields.push(`firstname = $${paramCount++}`);
      values.push(updates.firstname);
    }
    if (updates.lastname !== undefined) {
      fields.push(`lastname = $${paramCount++}`);
      values.push(updates.lastname);
    }
    if (updates.email !== undefined) {
      fields.push(`email = $${paramCount++}`);
      values.push(updates.email);
    }
    if (updates.username !== undefined) {
      fields.push(`username = $${paramCount++}`);
      values.push(updates.username);
    }
    if (updates.gender !== undefined) {
      fields.push(`gender = $${paramCount++}`);
      values.push(updates.gender);
    }
    if (updates.sexual_preferences !== undefined) {
      fields.push(`sexual_preferences = $${paramCount++}`);
      values.push(updates.sexual_preferences);
    }
    if (updates.biography !== undefined) {
      fields.push(`biography = $${paramCount++}`);
      values.push(updates.biography);
    }
    if (updates.birth_date !== undefined) {
      fields.push(`birth_date = $${paramCount++}`);
      values.push(updates.birth_date);
    }

    if (fields.length === 0) {
      // No fields to update, return current user
      return this.findById(id);
    }

    values.push(id); // Add user ID as last parameter

    const query = `
      UPDATE users
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  static async isBlocked(userId1: number, userId2: number): Promise<boolean> {
    const query = `
      SELECT 1 FROM blocks
      WHERE (blocker_id = $1 AND blocked_id = $2)
      OR (blocker_id = $2 AND blocked_id = $1)
    `;
    const result = await pool.query(query, [userId1, userId2]);
    return result.rows.length > 0;
  }

  static async getUserInterests(userId: number): Promise<Array<{ id: number; name: string }>> {
    const query = `
      SELECT i.id, i.name
      FROM interests i
      JOIN user_interests ui ON i.id = ui.interest_id
      WHERE ui.user_id = $1
      ORDER BY i.name
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  static async getCommonInterests(userId1: number, userId2: number): Promise<{ count: number; names: string[] }> {
    const query = `
      SELECT i.name
      FROM interests i
      JOIN user_interests ui1 ON i.id = ui1.interest_id
      JOIN user_interests ui2 ON i.id = ui2.interest_id
      WHERE ui1.user_id = $1 AND ui2.user_id = $2
      ORDER BY i.name
    `;
    const result = await pool.query(query, [userId1, userId2]);
    return {
      count: result.rows.length,
      names: result.rows.map(row => row.name)
    };
  }
}
