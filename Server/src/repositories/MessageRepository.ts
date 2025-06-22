import pool from '../config/database';
import { Message, PublicUser, Conversation, ChatMessage } from '../types/chat';

export class MessageRepository {
  /**
   * Create a new message
   */
  static async createMessage(senderId: number, receiverId: number, content: string): Promise<Message> {
    const query = `
      INSERT INTO messages (sender_id, receiver_id, content, is_read, sent_at)
      VALUES ($1, $2, $3, false, NOW())
      RETURNING *
    `;

    const result = await pool.query(query, [senderId, receiverId, content]);
    return result.rows[0];
  }

  /**
   * Get messages between two users with pagination
   */
  static async getMessages(
    userId1: number,
    userId2: number,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ messages: ChatMessage[]; total: number; has_more: boolean }> {
    // Get total count first
    const countQuery = `
      SELECT COUNT(*) as total
      FROM messages m
      WHERE (m.sender_id = $1 AND m.receiver_id = $2)
         OR (m.sender_id = $2 AND m.receiver_id = $1)
    `;
    const countResult = await pool.query(countQuery, [userId1, userId2]);
    const total = parseInt(countResult.rows[0].total);

    // Get messages with user details
    const query = `
      SELECT
        m.*,
        sender.id as sender_id,
        sender.username as sender_username,
        sender.firstname as sender_firstname,
        sender.lastname as sender_lastname,
        sender.profile_picture_url as sender_profile_picture_url,
        sender.is_online as sender_is_online,
        sender.last_connection as sender_last_connection,
        receiver.id as receiver_id,
        receiver.username as receiver_username,
        receiver.firstname as receiver_firstname,
        receiver.lastname as receiver_lastname,
        receiver.profile_picture_url as receiver_profile_picture_url,
        receiver.is_online as receiver_is_online,
        receiver.last_connection as receiver_last_connection
      FROM messages m
      INNER JOIN users sender ON m.sender_id = sender.id
      INNER JOIN users receiver ON m.receiver_id = receiver.id
      WHERE (m.sender_id = $1 AND m.receiver_id = $2)
         OR (m.sender_id = $2 AND m.receiver_id = $1)
      ORDER BY m.sent_at DESC
      LIMIT $3 OFFSET $4
    `;

    const result = await pool.query(query, [userId1, userId2, limit, offset]);

    const messages: ChatMessage[] = result.rows.map(row => ({
      id: row.id,
      sender_id: row.sender_id,
      receiver_id: row.receiver_id,
      content: row.content,
      is_read: row.is_read,
      sent_at: row.sent_at,
      sender: {
        id: row.sender_id,
        username: row.sender_username,
        firstname: row.sender_firstname,
        lastname: row.sender_lastname,
        profile_picture_url: row.sender_profile_picture_url,
        is_online: row.sender_is_online,
        last_connection: row.sender_last_connection
      },
      receiver: {
        id: row.receiver_id,
        username: row.receiver_username,
        firstname: row.receiver_firstname,
        lastname: row.receiver_lastname,
        profile_picture_url: row.receiver_profile_picture_url,
        is_online: row.receiver_is_online,
        last_connection: row.receiver_last_connection
      }
    }));

    // Reverse to get chronological order (oldest first)
    messages.reverse();

    return {
      messages,
      total,
      has_more: offset + limit < total
    };
  }

  /**
   * Get all conversations for a user
   */
  static async getConversations(userId: number): Promise<Conversation[]> {
    const query = `
      WITH user_conversations AS (
        SELECT DISTINCT
          CASE
            WHEN m.sender_id = $1 THEN m.receiver_id
            ELSE m.sender_id
          END as other_user_id
        FROM messages m
        WHERE m.sender_id = $1 OR m.receiver_id = $1
      ),
      last_messages AS (
        SELECT DISTINCT ON (
          CASE
            WHEN m.sender_id = $1 THEN m.receiver_id
            ELSE m.sender_id
          END
        )
          m.*,
          CASE
            WHEN m.sender_id = $1 THEN m.receiver_id
            ELSE m.sender_id
          END as other_user_id
        FROM messages m
        WHERE m.sender_id = $1 OR m.receiver_id = $1
        ORDER BY
          CASE
            WHEN m.sender_id = $1 THEN m.receiver_id
            ELSE m.sender_id
          END,
          m.sent_at DESC
      ),
      unread_counts AS (
        SELECT
          m.sender_id as other_user_id,
          COUNT(*) as unread_count
        FROM messages m
        WHERE m.receiver_id = $1 AND m.is_read = false
        GROUP BY m.sender_id
      )
      SELECT
        u.id,
        u.username,
        u.firstname,
        u.lastname,
        u.profile_picture_url,
        u.is_online,
        u.last_connection,
        lm.id as last_message_id,
        lm.sender_id as last_message_sender_id,
        lm.receiver_id as last_message_receiver_id,
        lm.content as last_message_content,
        lm.is_read as last_message_is_read,
        lm.sent_at as last_message_sent_at,
        COALESCE(uc.unread_count, 0) as unread_count
      FROM user_conversations uc_main
      INNER JOIN users u ON u.id = uc_main.other_user_id
      LEFT JOIN last_messages lm ON lm.other_user_id = u.id
      LEFT JOIN unread_counts uc ON uc.other_user_id = u.id
      ORDER BY lm.sent_at DESC NULLS LAST
    `;

    const result = await pool.query(query, [userId]);

    return result.rows.map(row => ({
      user: {
        id: row.id,
        username: row.username,
        firstname: row.firstname,
        lastname: row.lastname,
        profile_picture_url: row.profile_picture_url,
        is_online: row.is_online,
        last_connection: row.last_connection
      },
      last_message: row.last_message_id ? {
        id: row.last_message_id,
        sender_id: row.last_message_sender_id,
        receiver_id: row.last_message_receiver_id,
        content: row.last_message_content,
        is_read: row.last_message_is_read,
        sent_at: row.last_message_sent_at
      } : null,
      unread_count: parseInt(row.unread_count) || 0
    }));
  }

  /**
   * Mark a message as read
   */
  static async markAsRead(messageId: number, userId: number): Promise<Message | null> {
    const query = `
      UPDATE messages
      SET is_read = true
      WHERE id = $1 AND receiver_id = $2 AND is_read = false
      RETURNING *
    `;

    const result = await pool.query(query, [messageId, userId]);
    return result.rows[0] || null;
  }

  /**
   * Mark all messages from a specific user as read
   */
  static async markAllAsRead(receiverId: number, senderId: number): Promise<number> {
    const query = `
      UPDATE messages
      SET is_read = true
      WHERE receiver_id = $1 AND sender_id = $2 AND is_read = false
    `;

    const result = await pool.query(query, [receiverId, senderId]);
    return result.rowCount || 0;
  }

  /**
   * Get total unread message count for a user
   */
  static async getUnreadCount(userId: number): Promise<number> {
    const query = `
      SELECT COUNT(*) as count
      FROM messages
      WHERE receiver_id = $1 AND is_read = false
    `;

    const result = await pool.query(query, [userId]);
    return parseInt(result.rows[0].count) || 0;
  }

  /**
   * Get unread count grouped by sender
   */
  static async getUnreadCountBySender(userId: number): Promise<Array<{ sender_id: number; count: number }>> {
    const query = `
      SELECT sender_id, COUNT(*) as count
      FROM messages
      WHERE receiver_id = $1 AND is_read = false
      GROUP BY sender_id
    `;

    const result = await pool.query(query, [userId]);
    return result.rows.map(row => ({
      sender_id: row.sender_id,
      count: parseInt(row.count)
    }));
  }

  /**
   * Check if a message exists and belongs to the user
   */
  static async findMessageById(messageId: number, userId: number): Promise<Message | null> {
    const query = `
      SELECT * FROM messages
      WHERE id = $1 AND (sender_id = $2 OR receiver_id = $2)
    `;

    const result = await pool.query(query, [messageId, userId]);
    return result.rows[0] || null;
  }

  /**
   * Get message with full user details
   */
  static async getMessageWithUsers(messageId: number): Promise<ChatMessage | null> {
    const query = `
      SELECT
        m.*,
        sender.id as sender_id,
        sender.username as sender_username,
        sender.firstname as sender_firstname,
        sender.lastname as sender_lastname,
        sender.profile_picture_url as sender_profile_picture_url,
        sender.is_online as sender_is_online,
        sender.last_connection as sender_last_connection,
        receiver.id as receiver_id,
        receiver.username as receiver_username,
        receiver.firstname as receiver_firstname,
        receiver.lastname as receiver_lastname,
        receiver.profile_picture_url as receiver_profile_picture_url,
        receiver.is_online as receiver_is_online,
        receiver.last_connection as receiver_last_connection
      FROM messages m
      INNER JOIN users sender ON m.sender_id = sender.id
      INNER JOIN users receiver ON m.receiver_id = receiver.id
      WHERE m.id = $1
    `;

    const result = await pool.query(query, [messageId]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      sender_id: row.sender_id,
      receiver_id: row.receiver_id,
      content: row.content,
      is_read: row.is_read,
      sent_at: row.sent_at,
      sender: {
        id: row.sender_id,
        username: row.sender_username,
        firstname: row.sender_firstname,
        lastname: row.sender_lastname,
        profile_picture_url: row.sender_profile_picture_url,
        is_online: row.sender_is_online,
        last_connection: row.sender_last_connection
      },
      receiver: {
        id: row.receiver_id,
        username: row.receiver_username,
        firstname: row.receiver_firstname,
        lastname: row.receiver_lastname,
        profile_picture_url: row.receiver_profile_picture_url,
        is_online: row.receiver_is_online,
        last_connection: row.receiver_last_connection
      }
    };
  }

  /**
   * Delete old messages (cleanup function)
   */
  static async deleteOldMessages(daysOld: number = 365): Promise<number> {
    const query = `
      DELETE FROM messages
      WHERE sent_at < NOW() - INTERVAL '${daysOld} days'
    `;

    const result = await pool.query(query);
    return result.rowCount || 0;
  }
}
