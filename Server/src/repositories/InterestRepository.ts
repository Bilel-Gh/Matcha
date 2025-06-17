import pool from '../config/database';

export interface Interest {
  id: number;
  name: string;
  tag: string;
}

export interface UserInterest {
  id: number;
  name: string;
  tag: string;
  added_at: Date;
}

export interface CreateInterestData {
  name: string;
  tag: string;
}

export class InterestRepository {
  // ===== INTEREST MANAGEMENT =====

  static async findAll(): Promise<Interest[]> {
    const query = `
      SELECT id, name, tag
      FROM interests
      ORDER BY name ASC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  static async findById(id: number): Promise<Interest | null> {
    const query = 'SELECT id, name, tag FROM interests WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  static async findByName(name: string): Promise<Interest | null> {
    const query = 'SELECT id, name, tag FROM interests WHERE LOWER(name) = LOWER($1)';
    const result = await pool.query(query, [name]);
    return result.rows[0] || null;
  }

  static async findByTag(tag: string): Promise<Interest | null> {
    const query = 'SELECT id, name, tag FROM interests WHERE tag = $1';
    const result = await pool.query(query, [tag]);
    return result.rows[0] || null;
  }

  static async search(query: string): Promise<Interest[]> {
    const searchQuery = `
      SELECT id, name, tag
      FROM interests
      WHERE LOWER(name) LIKE LOWER($1) OR tag LIKE LOWER($1)
      ORDER BY
        CASE
          WHEN LOWER(name) = LOWER($2) THEN 1
          WHEN tag = LOWER($2) THEN 2
          WHEN LOWER(name) LIKE LOWER($3) THEN 3
          ELSE 4
        END,
        name ASC
      LIMIT 20
    `;

    const searchTerm = `%${query}%`;
    const exactTerm = query;
    const prefixTerm = `${query}%`;

    const result = await pool.query(searchQuery, [searchTerm, exactTerm, prefixTerm]);
    return result.rows;
  }

  static async create(interestData: CreateInterestData): Promise<Interest> {
    const { name, tag } = interestData;

    const query = `
      INSERT INTO interests (name, tag)
      VALUES ($1, $2)
      RETURNING id, name, tag
    `;

    const result = await pool.query(query, [name, tag]);
    return result.rows[0];
  }

  static async findOrCreate(name: string, tag: string): Promise<Interest> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Try to find existing interest by name or tag
      let interest = await this.findByName(name);
      if (!interest) {
        interest = await this.findByTag(tag);
      }

      if (interest) {
        await client.query('COMMIT');
        return interest;
      }

      // Create new interest
      const insertQuery = `
        INSERT INTO interests (name, tag)
        VALUES ($1, $2)
        ON CONFLICT (tag) DO NOTHING
        RETURNING id, name, tag
      `;

      const result = await client.query(insertQuery, [name, tag]);

      if (result.rows.length === 0) {
        // Conflict occurred, fetch the existing interest
        const existingQuery = 'SELECT id, name, tag FROM interests WHERE tag = $1';
        const existingResult = await client.query(existingQuery, [tag]);
        interest = existingResult.rows[0];
      } else {
        interest = result.rows[0];
      }

      await client.query('COMMIT');

      if (!interest) {
        throw new Error('Failed to create or find interest');
      }

      return interest;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // ===== USER INTERESTS MANAGEMENT =====

  static async findUserInterests(userId: number): Promise<UserInterest[]> {
    const query = `
      SELECT i.id, i.name, i.tag, ui.created_at as added_at
      FROM interests i
      INNER JOIN user_interests ui ON i.id = ui.interest_id
      WHERE ui.user_id = $1
      ORDER BY ui.created_at DESC
    `;

    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  static async countUserInterests(userId: number): Promise<number> {
    const query = 'SELECT COUNT(*) FROM user_interests WHERE user_id = $1';
    const result = await pool.query(query, [userId]);
    return parseInt(result.rows[0].count);
  }

  static async hasUserInterest(userId: number, interestId: number): Promise<boolean> {
    const query = `
      SELECT EXISTS(
        SELECT 1 FROM user_interests
        WHERE user_id = $1 AND interest_id = $2
      )
    `;

    const result = await pool.query(query, [userId, interestId]);
    return result.rows[0].exists;
  }

  static async addUserInterest(userId: number, interestId: number): Promise<void> {
    const query = `
      INSERT INTO user_interests (user_id, interest_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, interest_id) DO NOTHING
    `;

    await pool.query(query, [userId, interestId]);
  }

  static async removeUserInterest(userId: number, interestId: number): Promise<boolean> {
    const query = `
      DELETE FROM user_interests
      WHERE user_id = $1 AND interest_id = $2
    `;

    const result = await pool.query(query, [userId, interestId]);
    return result.rowCount! > 0;
  }

  static async replaceUserInterests(userId: number, interestIds: number[]): Promise<void> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Remove all current user interests
      await client.query('DELETE FROM user_interests WHERE user_id = $1', [userId]);

      // Add new interests
      if (interestIds.length > 0) {
        const values = interestIds.map((_, index) =>
          `($1, $${index + 2})`
        ).join(', ');

        const insertQuery = `
          INSERT INTO user_interests (user_id, interest_id)
          VALUES ${values}
        `;

        await client.query(insertQuery, [userId, ...interestIds]);
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // ===== UTILITY METHODS =====

  static normalizeInterestName(name: string): string {
    return name.trim();
  }

  static generateTag(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/_{2,}/g, '_') // Replace multiple underscores with single
      .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
  }

  static validateInterestName(name: string): boolean {
    const trimmed = name.trim();
    return trimmed.length >= 2 &&
           trimmed.length <= 30 &&
           /^[a-zA-ZÀ-ÿ\s]+$/.test(trimmed);
  }

  static validateTag(tag: string): boolean {
    return tag.length >= 1 &&
           tag.length <= 50 &&
           /^[a-z0-9_]+$/.test(tag);
  }
}
