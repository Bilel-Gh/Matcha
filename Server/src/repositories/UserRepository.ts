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
}

export class UserRepository {
  static async create(userData: CreateUserData): Promise<User> {
    const { email, username, firstname, lastname, password, verification_token, birth_date } = userData;

    const query = `
      INSERT INTO users (email, username, firstname, lastname, password, verification_token, birth_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const result = await pool.query(query, [
      email, username, firstname, lastname, password, verification_token, birth_date
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
}
