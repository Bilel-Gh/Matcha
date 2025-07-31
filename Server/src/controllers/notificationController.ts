import { Request, Response } from 'express';
import { NotificationService } from '../services/NotificationService';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../middlewares/errorHandler';

/**
 * Get notifications for authenticated user
 */
export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError('User not authenticated', 401);
  }

  const userId = req.user.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const type = req.query.type as string;

  // Validate pagination parameters
  if (page < 1) {
    throw new AppError('Page must be greater than 0', 400);
  }
  if (limit < 1 || limit > 100) {
    throw new AppError('Limit must be between 1 and 100', 400);
  }

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
});

/**
 * Get recent notifications (last 10) for dropdown
 */
export const getRecentNotifications = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError('User not authenticated', 401);
  }

  const userId = req.user.id;
  const notifications = await NotificationService.getRecentNotifications(userId);
  const unreadCount = await NotificationService.getUnreadCount(userId);

  res.json({
    success: true,
    data: {
      notifications,
      unread_count: unreadCount
    }
  });
});

/**
 * Mark notification as read
 */
export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError('User not authenticated', 401);
  }

  const userId = req.user.id;
  const notificationId = parseInt(req.params.id);

  if (!notificationId || isNaN(notificationId)) {
    throw new AppError('Valid notification ID is required', 400);
  }

  const notification = await NotificationService.markAsRead(notificationId, userId);

  if (!notification) {
    throw new AppError('Notification not found', 404);
  }

  res.json({
    success: true,
    data: { notification }
  });
});

/**
 * Mark all notifications as read
 */
export const markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError('User not authenticated', 401);
  }

  const userId = req.user.id;
  const count = await NotificationService.markAllAsRead(userId);

  res.json({
    success: true,
    data: { marked_count: count }
  });
});

/**
 * Get unread count
 */
export const getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError('User not authenticated', 401);
  }

  const userId = req.user.id;
  const count = await NotificationService.getUnreadCount(userId);

  res.json({
    success: true,
    data: { unread_count: count }
  });
});

/**
 * Delete old notifications (admin only)
 */
export const cleanOldNotifications = asyncHandler(async (req: Request, res: Response) => {
  const daysOld = parseInt(req.query.days as string) || 30;

  if (daysOld < 1) {
    throw new AppError('Days must be greater than 0', 400);
  }

  const count = await NotificationService.cleanOldNotifications(daysOld);

  res.json({
    success: true,
    data: { deleted_count: count }
  });
});

/**
 * Delete a specific notification
 */
export const deleteNotification = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError('User not authenticated', 401);
  }

  const userId = req.user.id;
  const notificationId = parseInt(req.params.id);

  if (!notificationId || isNaN(notificationId)) {
    throw new AppError('Valid notification ID is required', 400);
  }

  await NotificationService.deleteNotification(notificationId, userId);

  res.json({
    success: true,
    message: 'Notification deleted successfully'
  });
});
