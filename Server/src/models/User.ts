import pool from '../config/database';
import { User } from '../types/user';

export const createUser = async (user: Omit<User, 'id' | 'created_at' | 'fame_rating' | 'last_connection' | 'is_online' | 'email_verified'>): Promise<User> => {
    const { email, username, firstname, lastname, password, verification_token, birth_date } = user;
    const result = await pool.query(
        'INSERT INTO users (email, username, firstname, lastname, password, verification_token, birth_date) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [email, username, firstname, lastname, password, verification_token, birth_date]
    );
    return result.rows[0];
};

export const findUserByEmail = async (email: string): Promise<User | null> => {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] || null;
};

export const findUserByUsername = async (username: string): Promise<User | null> => {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    return result.rows[0] || null;
};

export const findUserById = async (id: number): Promise<User | null> => {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
}

export const findUserByVerificationToken = async (token: string): Promise<User | null> => {
    const result = await pool.query('SELECT * FROM users WHERE verification_token = $1', [token]);
    return result.rows[0] || null;
};

export const setUserVerified = async (id: number): Promise<User | null> => {
    const result = await pool.query(
        'UPDATE users SET email_verified = true, verification_token = null WHERE id = $1 RETURNING *',
        [id]
    );
    return result.rows[0] || null;
};

export const findUserByPasswordResetToken = async (token: string): Promise<User | null> => {
    const result = await pool.query('SELECT * FROM users WHERE password_reset_token = $1 AND password_reset_expires > NOW()', [token]);
    return result.rows[0] || null;
};

export const updatePasswordResetToken = async (id: number, token: string | null, expires: Date | null): Promise<User | null> => {
    const result = await pool.query(
        'UPDATE users SET password_reset_token = $1, password_reset_expires = $2 WHERE id = $3 RETURNING *',
        [token, expires, id]
    );
    return result.rows[0] || null;
};

export const resetPassword = async (id: number, password: string):Promise<User | null> => {
    const result = await pool.query(
        'UPDATE users SET password = $1, password_reset_token = null, password_reset_expires = null WHERE id = $2 RETURNING *',
        [password, id]
    );
    return result.rows[0] || null;
};
