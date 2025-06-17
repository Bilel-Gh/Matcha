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
    console.log('Searching for user with verification token:', token);
    const query = 'SELECT * FROM users WHERE verification_token = $1';
    const result = await pool.query(query, [token]);
    console.log('Query result:', result.rows[0] ? 'User found' : 'No user found');
    return result.rows[0] || null;
  }

  static async markAsVerified(id: number): Promise<User | null> {
    console.log('Marking user as verified:', id);
    const query = `
      UPDATE users
      SET email_verified = true, verification_token = null
      WHERE id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [id]);
    console.log('Update result:', result.rows[0] ? 'Success' : 'Failed');
    return result.rows[0] || null;
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
}
