import pool from '../config/database';

export interface Photo {
  id: number;
  user_id: number;
  filename: string;
  url: string;
  is_profile: boolean;
  created_at: Date;
}

export interface CreatePhotoData {
  user_id: number;
  filename: string;
  url: string;
  is_profile?: boolean;
}

export class PhotoRepository {
  static async create(photoData: CreatePhotoData): Promise<Photo> {
    const { user_id, filename, url, is_profile = false } = photoData;

    const query = `
      INSERT INTO photos (user_id, filename, url, is_profile)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const result = await pool.query(query, [user_id, filename, url, is_profile]);
    return result.rows[0];
  }

  static async findByUserId(userId: number): Promise<Photo[]> {
    const query = `
      SELECT * FROM photos
      WHERE user_id = $1
      ORDER BY is_profile DESC, created_at ASC
    `;

    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  static async findById(photoId: number): Promise<Photo | null> {
    const query = 'SELECT * FROM photos WHERE id = $1';
    const result = await pool.query(query, [photoId]);
    return result.rows[0] || null;
  }

  static async countByUserId(userId: number): Promise<number> {
    const query = 'SELECT COUNT(*) FROM photos WHERE user_id = $1';
    const result = await pool.query(query, [userId]);
    return parseInt(result.rows[0].count);
  }

  static async findProfilePhotoByUserId(userId: number): Promise<Photo | null> {
    const query = `
      SELECT * FROM photos
      WHERE user_id = $1 AND is_profile = true
      LIMIT 1
    `;

    const result = await pool.query(query, [userId]);
    return result.rows[0] || null;
  }

  static async updateProfilePhoto(userId: number, photoId: number): Promise<Photo | null> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Remove current profile photo status
      await client.query(
        'UPDATE photos SET is_profile = false WHERE user_id = $1 AND is_profile = true',
        [userId]
      );

      // Set new profile photo
      const result = await client.query(
        'UPDATE photos SET is_profile = true WHERE id = $1 AND user_id = $2 RETURNING *',
        [photoId, userId]
      );

      if (result.rows.length === 0) {
        throw new Error('Photo not found or unauthorized');
      }

      const photo = result.rows[0];

      // Update user's profile_picture_url
      await client.query(
        'UPDATE users SET profile_picture_url = $1 WHERE id = $2',
        [photo.url, userId]
      );

      await client.query('COMMIT');
      return photo;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async delete(photoId: number, userId: number): Promise<Photo | null> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get the photo before deleting to check ownership and get file info
      const photoResult = await client.query(
        'SELECT * FROM photos WHERE id = $1 AND user_id = $2',
        [photoId, userId]
      );

      if (photoResult.rows.length === 0) {
        return null;
      }

      const photo = photoResult.rows[0];

      // Delete the photo
      await client.query(
        'DELETE FROM photos WHERE id = $1 AND user_id = $2',
        [photoId, userId]
      );

      // If it was a profile photo, update user's profile_picture_url
      if (photo.is_profile) {
        await client.query(
          'UPDATE users SET profile_picture_url = NULL WHERE id = $1',
          [userId]
        );
      }

      await client.query('COMMIT');
      return photo;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async hasProfilePhoto(userId: number): Promise<boolean> {
    const query = `
      SELECT EXISTS(
        SELECT 1 FROM photos
        WHERE user_id = $1 AND is_profile = true
      )
    `;

    const result = await pool.query(query, [userId]);
    return result.rows[0].exists;
  }
}
