import axios from 'axios';
import { Notification } from '../types/notifications';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface StandardResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

interface NotificationResponse {
  notifications: Notification[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    items_per_page: number;
  };
  unread_count: number;
}

interface RecentNotificationsResponse {
  notifications: Notification[];
  unread_count: number;
}

const notificationService = {
  /**
   * Get notifications for the current user
   */
  async getNotifications(token: string, page: number = 1, type?: string): Promise<NotificationResponse> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    if (type) {
      params.append('type', type);
    }

    const response = await axios.get<StandardResponse<NotificationResponse>>(`${API_URL}/api/notifications?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to get notifications');
    }

    return response.data.data!;
  },

  /**
   * Get unread notifications count
   */
  async getUnreadCount(token: string): Promise<number> {
    const response = await axios.get<StandardResponse<{ unread_count: number }>>(`${API_URL}/api/notifications/unread-count`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to get unread count');
    }

    return response.data.data!.unread_count;
  },

  /**
   * Mark a notification as read
   */
  async markAsRead(token: string, notificationId: number): Promise<void> {
    const response = await axios.put<StandardResponse<Record<string, unknown>>>(`${API_URL}/api/notifications/${notificationId}/read`, {}, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to mark notification as read');
    }
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(token: string): Promise<void> {
    const response = await axios.put<StandardResponse<Record<string, unknown>>>(`${API_URL}/api/notifications/read-all`, {}, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to mark all notifications as read');
    }
  },

  /**
   * Delete a notification
   */
  async deleteNotification(token: string, notificationId: number): Promise<void> {
    const response = await axios.delete<StandardResponse<Record<string, unknown>>>(`${API_URL}/api/notifications/${notificationId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete notification');
    }
  },

  async getRecentNotifications(token: string): Promise<RecentNotificationsResponse> {
    const response = await axios.get<StandardResponse<RecentNotificationsResponse>>(`${API_URL}/api/notifications/recent`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to get recent notifications');
    }

    return response.data.data!;
  },
};

export default notificationService;
