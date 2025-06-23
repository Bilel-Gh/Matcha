import { Notification, NotificationSummary } from '../types/notifications';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export class NotificationService {
  /**
   * Get notifications for the current user
   */
  static async getNotifications(
    token: string,
    page: number = 1,
    limit: number = 20,
    type?: string
  ): Promise<NotificationSummary> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (type) {
      params.append('type', type);
    }

    const response = await fetch(`${API_BASE_URL}/api/notifications?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch notifications');
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Get unread notifications count
   */
  static async getUnreadCount(token: string): Promise<number> {
    const response = await fetch(`${API_BASE_URL}/api/notifications/unread-count`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch unread count');
    }

    const data = await response.json();
    return data.data.unread_count;
  }

  /**
   * Mark a notification as read
   */
  static async markAsRead(token: string, notificationId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/notifications/read/${notificationId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to mark notification as read');
    }
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(token: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to mark all notifications as read');
    }
  }

  /**
   * Delete a notification
   */
  static async deleteNotification(token: string, notificationId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/notifications/${notificationId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete notification');
    }
  }
}
