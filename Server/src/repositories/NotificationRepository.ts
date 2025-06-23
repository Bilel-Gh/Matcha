import pool from '../config/database';
import { Notification, NotificationSummary, CreateNotificationRequest } from '../types/notifications';

export class NotificationRepository {
  /**
   * Create a new notification
   */
  static async createNotification(request: CreateNotificationRequest): Promise<Notification> {
    const query = `
      INSERT INTO notifications (user_id, type, content, data, is_read, created_at)
      VALUES ($1, $2, $3, $4, false, NOW())
      RETURNING *
    `;

    const result = await pool.query(query, [
      request.user_id,
      request.type,
      request.content,
      JSON.stringify(request.data || {})
    ]);

    const notification = result.rows[0];

    // Parse JSON data if it exists
    if (notification.data) {
      try {
        notification.data = typeof notification.data === 'string'
          ? JSON.parse(notification.data)
          : notification.data;
      } catch (error) {
        console.error('Failed to parse notification data:', error);
        notification.data = {};
      }
    }

    return notification;
  }

  /**
   * Get notifications for a user with pagination
   */
  static async getNotifications(
    userId: number,
    limit: number = 20,
    offset: number = 0,
    type?: string
  ): Promise<NotificationSummary> {
    let typeFilter = '';
    const params: any[] = [userId];

    if (type) {
      typeFilter = 'AND type = $2';
      params.push(type);
      params.push(limit);
      params.push(offset);
    } else {
      params.push(limit);
      params.push(offset);
    }

    const notificationsQuery = `
      SELECT * FROM notifications
      WHERE user_id = $1 ${typeFilter}
      ORDER BY created_at DESC
      LIMIT $${type ? '3' : '2'} OFFSET $${type ? '4' : '3'}
    `;

    const countQuery = `
      SELECT COUNT(*) as total,
             COUNT(CASE WHEN is_read = false THEN 1 END) as unread_count
      FROM notifications
      WHERE user_id = $1 ${typeFilter}
    `;

    const [notificationsResult, countResult] = await Promise.all([
      pool.query(notificationsQuery, params),
      pool.query(countQuery, type ? [userId, type] : [userId])
    ]);

    // Parse JSON data for each notification
    const notifications = notificationsResult.rows.map(notification => {
      if (notification.data) {
        try {
          notification.data = typeof notification.data === 'string'
            ? JSON.parse(notification.data)
            : notification.data;
        } catch (error) {
          console.error('Failed to parse notification data:', error);
          notification.data = {};
        }
      }
      return notification;
    });

    return {
      notifications,
      total: parseInt(countResult.rows[0].total),
      unread_count: parseInt(countResult.rows[0].unread_count)
    };
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: number, userId: number): Promise<Notification | null> {
    const query = `
      UPDATE notifications
      SET is_read = true
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;

    const result = await pool.query(query, [notificationId, userId]);
    const notification = result.rows[0] || null;

    if (notification && notification.data) {
      try {
        notification.data = typeof notification.data === 'string'
          ? JSON.parse(notification.data)
          : notification.data;
      } catch (error) {
        console.error('Failed to parse notification data:', error);
        notification.data = {};
      }
    }

    return notification;
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: number): Promise<number> {
    const query = `
      UPDATE notifications
      SET is_read = true
      WHERE user_id = $1 AND is_read = false
    `;

    const result = await pool.query(query, [userId]);
    return result.rowCount || 0;
  }

  /**
   * Get unread count for a user
   */
  static async getUnreadCount(userId: number): Promise<number> {
    const query = `
      SELECT COUNT(*) as count
      FROM notifications
      WHERE user_id = $1 AND is_read = false
    `;

    const result = await pool.query(query, [userId]);
    return parseInt(result.rows[0].count);
  }

  /**
   * Delete old notifications (older than specified days)
   */
  static async deleteOldNotifications(daysOld: number = 30): Promise<number> {
    const query = `
      DELETE FROM notifications
      WHERE created_at < NOW() - INTERVAL '${daysOld} days'
    `;

    const result = await pool.query(query);
    return result.rowCount || 0;
  }

  /**
   * Get recent notifications (last 10) for quick access
   */
  static async getRecentNotifications(userId: number): Promise<Notification[]> {
    const query = `
      SELECT * FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 10
    `;

    const result = await pool.query(query, [userId]);

    // Parse JSON data for each notification
    return result.rows.map(notification => {
      if (notification.data) {
        try {
          notification.data = typeof notification.data === 'string'
            ? JSON.parse(notification.data)
            : notification.data;
        } catch (error) {
          console.error('Failed to parse notification data:', error);
          notification.data = {};
        }
      }
      return notification;
    });
  }

  /**
   * Check if notification exists to prevent duplicates
   */
  static async notificationExists(
    userId: number,
    type: string,
    fromUserId?: number,
    timeWindow: number = 3600 // 1 hour in seconds
  ): Promise<boolean> {
    let query = `
      SELECT COUNT(*) as count
      FROM notifications
      WHERE user_id = $1 AND type = $2
      AND created_at > NOW() - INTERVAL '${timeWindow} seconds'
    `;

    const params: any[] = [userId, type];

    // ✅ CORRECTION - Pour les notifications de visite, vérifier via les données JSON
    if (type === 'visit' && fromUserId) {
      query += ` AND data->'visitor'->>'id' = $3`;
      params.push(fromUserId.toString());
    }
    // Pour les autres types (like, unlike), vérifier via les données JSON
    else if ((type === 'like' || type === 'unlike') && fromUserId) {
      query += ` AND data->'from_user'->>'id' = $3`;
      params.push(fromUserId.toString());
    }
    // Pour les notifications de match, vérifier via les données JSON
    else if (type === 'match' && fromUserId) {
      query += ` AND data->'match_user'->>'id' = $3`;
      params.push(fromUserId.toString());
    }

    const result = await pool.query(query, params);
    return parseInt(result.rows[0].count) > 0;
  }

  /**
   * Get a specific notification by ID for a user
   */
  static async getNotificationById(notificationId: number, userId: number): Promise<Notification | null> {
    const query = `
      SELECT n.*
      FROM notifications n
      WHERE n.id = $1 AND n.user_id = $2
    `;

    const result = await pool.query(query, [notificationId, userId]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];

    // Parse JSON data if it exists
    let parsedData = {};
    if (row.data) {
      try {
        parsedData = typeof row.data === 'string'
          ? JSON.parse(row.data)
          : row.data;
      } catch (error) {
        console.error('Failed to parse notification data:', error);
        parsedData = {};
      }
    }

    return {
      id: row.id,
      user_id: row.user_id,
      type: row.type,
      content: row.content,
      is_read: row.is_read,
      created_at: row.created_at.toISOString(),
      data: parsedData
    };
  }

  /**
   * Delete a specific notification
   */
    static async deleteNotification(notificationId: number): Promise<void> {
    const query = `
      DELETE FROM notifications
      WHERE id = $1
    `;

    await pool.query(query, [notificationId]);
  }
}
