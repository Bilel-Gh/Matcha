import { Request, Response } from 'express';
import { NotificationService } from '../services/NotificationService';
import { AppError } from '../utils/AppError';

export class NotificationController {
  /**
   * Get notifications for authenticated user
   */
  static async getNotifications(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const type = req.query.type as string;
      const offset = (page - 1) * limit;

      const result = await NotificationService.getNotifications(userId, limit, offset, type);

      res.json({
        success: true,
        data: {
          notifications: result.notifications,
          pagination: {
            current_page: page,
            total_pages: Math.ceil(result.total / limit),
            total_items: result.total,
            items_per_page: limit
          },
          unread_count: result.unread_count
        }
      });
    } catch (error) {
      console.error('Error getting notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get notifications'
      });
    }
  }

  /**
   * Get recent notifications (last 10) for dropdown
   */
  static async getRecentNotifications(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const notifications = await NotificationService.getRecentNotifications(userId);
      const unreadCount = await NotificationService.getUnreadCount(userId);

      res.json({
        success: true,
        data: {
          notifications,
          unread_count: unreadCount
        }
      });
    } catch (error) {
      console.error('Error getting recent notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get recent notifications'
      });
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const notificationId = parseInt(req.params.id);

      if (!notificationId) {
        throw new AppError('Notification ID is required', 400);
      }

      const notification = await NotificationService.markAsRead(notificationId, userId);

      if (!notification) {
        throw new AppError('Notification not found', 404);
      }

      res.json({
        success: true,
        data: { notification }
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      } else {
        console.error('Error marking notification as read:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to mark notification as read'
        });
      }
    }
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const count = await NotificationService.markAllAsRead(userId);

      res.json({
        success: true,
        data: { marked_count: count }
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark all notifications as read'
      });
    }
  }

  /**
   * Get unread count
   */
  static async getUnreadCount(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const count = await NotificationService.getUnreadCount(userId);

      res.json({
        success: true,
        data: { unread_count: count }
      });
    } catch (error) {
      console.error('Error getting unread count:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get unread count'
      });
    }
  }

  /**
   * Delete old notifications (admin only)
   */
  static async cleanOldNotifications(req: Request, res: Response) {
    try {
      const daysOld = parseInt(req.query.days as string) || 30;
      const count = await NotificationService.cleanOldNotifications(daysOld);

      res.json({
        success: true,
        data: { deleted_count: count }
      });
    } catch (error) {
      console.error('Error cleaning old notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to clean old notifications'
      });
    }
  }

  /**
   * Delete a specific notification
   */
  static async deleteNotification(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const notificationId = parseInt(req.params.id);

      if (!notificationId) {
        throw new AppError('Notification ID is required', 400);
      }

      await NotificationService.deleteNotification(notificationId, userId);

      res.json({
        success: true,
        message: 'Notification deleted successfully'
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      } else {
        console.error('Error deleting notification:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to delete notification'
        });
      }
    }
  }
}
