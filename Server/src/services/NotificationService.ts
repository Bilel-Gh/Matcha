import { NotificationRepository } from '../repositories/NotificationRepository';
import { UserRepository } from '../repositories/UserRepository';
import { Notification, NotificationSummary, CreateNotificationRequest } from '../types/notifications';
import { SocketManager } from '../config/socket';
import { pool } from '../config/database';

export class NotificationService {
  private static socketManager: any;

  static setSocketManager(socketManager: SocketManager) {
    this.socketManager = socketManager;
  }

  /**
   * Create and send a like notification
   */
  static async createLikeNotification(
    likedUserId: number,
    likerUserId: number
  ): Promise<Notification | null> {
    try {
      // Get liker user info
      const likerUser = await UserRepository.findById(likerUserId);
      if (!likerUser) return null;

      // Check if notification already exists recently (prevent spam)
      const exists = await NotificationRepository.notificationExists(
        likedUserId,
        'like',
        likerUserId,
        3600 // 1 hour
      );

      if (exists) return null;

      const notification = await NotificationRepository.createNotification({
        user_id: likedUserId,
        type: 'like',
        content: `${likerUser.firstname} vous a liké`,
        data: {
          from_user: {
            id: likerUser.id,
            username: likerUser.username,
            firstname: likerUser.firstname,
            lastname: likerUser.lastname,
            profile_picture_url: likerUser.profile_picture_url
          }
        }
      });

      // Send real-time notification
      if (this.socketManager) {
        // ✅ ÉVÉNEMENT SPÉCIALISÉ - Pour les toasts
        this.socketManager.emitToUser(likedUserId, 'new-like', {
          fromUser: {
            id: likerUser.id,
            username: likerUser.username,
            firstname: likerUser.firstname,
            lastname: likerUser.lastname,
            profile_picture_url: likerUser.profile_picture_url
          },
          timestamp: new Date().toISOString()
        });

        this.socketManager.emitToUser(likedUserId, 'new-notification', {
          ...notification,
          data: {
            from_user: {
              id: likerUser.id,
              username: likerUser.username,
              firstname: likerUser.firstname,
              lastname: likerUser.lastname,
              profile_picture_url: likerUser.profile_picture_url
            }
          }
        });

        // Update unread count
        const unreadCount = await NotificationRepository.getUnreadCount(likedUserId);
        this.socketManager.emitToUser(likedUserId, 'unread-count-update', { count: unreadCount });
      }

      return notification;
    } catch (error) {
      console.error('Error creating like notification:', error);
      return null;
    }
  }

  /**
   * Create and send a match notification
   */
  static async createMatchNotification(
    userId1: number,
    userId2: number
  ): Promise<{ notification1: Notification | null; notification2: Notification | null }> {
    try {
      // Get user info for both users
      const [user1, user2] = await Promise.all([
        UserRepository.findById(userId1),
        UserRepository.findById(userId2)
      ]);

      if (!user1 || !user2) return { notification1: null, notification2: null };

      // Create notifications for both users
      const [notification1, notification2] = await Promise.all([
        NotificationRepository.createNotification({
          user_id: userId1,
          type: 'match',
          content: `🎉 Vous avez matché avec ${user2.firstname}!`,
          data: {
            match_user: {
              id: user2.id,
              username: user2.username,
              firstname: user2.firstname,
              lastname: user2.lastname,
              profile_picture_url: user2.profile_picture_url
            }
          }
        }),
        NotificationRepository.createNotification({
          user_id: userId2,
          type: 'match',
          content: `🎉 Vous avez matché avec ${user1.firstname}!`,
          data: {
            match_user: {
              id: user1.id,
              username: user1.username,
              firstname: user1.firstname,
              lastname: user1.lastname,
              profile_picture_url: user1.profile_picture_url
            }
          }
        })
      ]);

      // Send real-time notifications
      if (this.socketManager) {
        // ✅ ÉVÉNEMENTS SPÉCIALISÉS - Pour les toasts de match
        this.socketManager.emitToUser(userId1, 'new-match', {
          matchedUser: {
            id: user2.id,
            username: user2.username,
            firstname: user2.firstname,
            lastname: user2.lastname,
            profile_picture_url: user2.profile_picture_url
          },
          timestamp: new Date().toISOString()
        });

        this.socketManager.emitToUser(userId2, 'new-match', {
          matchedUser: {
            id: user1.id,
            username: user1.username,
            firstname: user1.firstname,
            lastname: user1.lastname,
            profile_picture_url: user1.profile_picture_url
          },
          timestamp: new Date().toISOString()
        });

        // Notify user1
        this.socketManager.emitToUser(userId1, 'new-notification', {
          ...notification1,
          data: {
            match_user: {
              id: user2.id,
              username: user2.username,
              firstname: user2.firstname,
              lastname: user2.lastname,
              profile_picture_url: user2.profile_picture_url
            }
          }
        });

        // Notify user2
        this.socketManager.emitToUser(userId2, 'new-notification', {
          ...notification2,
          data: {
            match_user: {
              id: user1.id,
              username: user1.username,
              firstname: user1.firstname,
              lastname: user1.lastname,
              profile_picture_url: user1.profile_picture_url
            }
          }
        });

        // Update unread counts
        const [unreadCount1, unreadCount2] = await Promise.all([
          NotificationRepository.getUnreadCount(userId1),
          NotificationRepository.getUnreadCount(userId2)
        ]);

        this.socketManager.emitToUser(userId1, 'unread-count-update', { count: unreadCount1 });
        this.socketManager.emitToUser(userId2, 'unread-count-update', { count: unreadCount2 });
      }

      return { notification1, notification2 };
    } catch (error) {
      console.error('Error creating match notification:', error);
      return { notification1: null, notification2: null };
    }
  }

  /**
   * Create and send a profile visit notification
   */
  static async createVisitNotification(
    visitedUserId: number,
    visitorUserId: number
  ): Promise<Notification | null> {
    try {
      // Don't notify if user visits their own profile
      if (visitedUserId === visitorUserId) return null;

      // Check if notification already exists recently (prevent spam)
      const exists = await NotificationRepository.notificationExists(
        visitedUserId,
        'visit',
        visitorUserId,
        600 // ✅ 10 minutes au lieu d'1 heure pour faciliter les tests
      );

      if (exists) return null;

      // Get visitor user info
      const visitorUser = await UserRepository.findById(visitorUserId);
      if (!visitorUser) return null;

      const notification = await NotificationRepository.createNotification({
        user_id: visitedUserId,
        type: 'visit',
        content: `${visitorUser.firstname} a visité votre profil`,
        data: {
          visitor: {
            id: visitorUser.id,
            username: visitorUser.username,
            firstname: visitorUser.firstname,
            lastname: visitorUser.lastname,
            profile_picture_url: visitorUser.profile_picture_url
          }
        }
      });

      // Send real-time notification
      if (this.socketManager) {
        // ✅ NOTIFICATION EN TEMPS RÉEL - Émettre l'événement profile-visit
        this.socketManager.emitToUser(visitedUserId, 'profile-visit', {
          visitor: {
            id: visitorUser.id,
            username: visitorUser.username,
            firstname: visitorUser.firstname,
            lastname: visitorUser.lastname,
            profile_picture_url: visitorUser.profile_picture_url
          },
          timestamp: new Date().toISOString()
        });

        this.socketManager.emitToUser(visitedUserId, 'new-notification', {
          ...notification,
          data: {
            visitor: {
              id: visitorUser.id,
              username: visitorUser.username,
              firstname: visitorUser.firstname,
              lastname: visitorUser.lastname,
              profile_picture_url: visitorUser.profile_picture_url
            }
          }
        });

        // Update unread count
        const unreadCount = await NotificationRepository.getUnreadCount(visitedUserId);
        this.socketManager.emitToUser(visitedUserId, 'unread-count-update', { count: unreadCount });
      }

      return notification;
    } catch (error) {
      console.error('Error creating visit notification:', error);
      return null;
    }
  }

  /**
   * Create and send a message notification
   */
  static async createMessageNotification(
    receiverId: number,
    senderId: number,
    messageId: number,
    messageContent: string
  ): Promise<Notification | null> {
    try {
      // Get sender user info
      const senderUser = await UserRepository.findById(senderId);
      if (!senderUser) return null;

      const notification = await NotificationRepository.createNotification({
        user_id: receiverId,
        type: 'message',
        content: `Nouveau message de ${senderUser.firstname}`,
        data: {
          from_user: {
            id: senderUser.id,
            username: senderUser.username,
            firstname: senderUser.firstname,
            lastname: senderUser.lastname,
            profile_picture_url: senderUser.profile_picture_url
          },
          message_id: messageId
        }
      });

      // Send real-time notification
      if (this.socketManager) {
        this.socketManager.emitToUser(receiverId, 'new-notification', {
          ...notification,
          data: {
            from_user: {
              id: senderUser.id,
              username: senderUser.username,
              firstname: senderUser.firstname,
              lastname: senderUser.lastname,
              profile_picture_url: senderUser.profile_picture_url
            },
            message_id: messageId
          }
        });

        // Update unread count
        const unreadCount = await NotificationRepository.getUnreadCount(receiverId);
        this.socketManager.emitToUser(receiverId, 'unread-count-update', { count: unreadCount });
      }

      return notification;
    } catch (error) {
      console.error('Error creating message notification:', error);
      return null;
    }
  }

  /**
   * Get notifications for a user
   */
  static async getNotifications(
    userId: number,
    limit: number = 20,
    offset: number = 0,
    type?: string
  ): Promise<NotificationSummary> {
    return await NotificationRepository.getNotifications(userId, limit, offset, type);
  }

  /**
   * Get recent notifications (last 10)
   */
  static async getRecentNotifications(userId: number): Promise<Notification[]> {
    return await NotificationRepository.getRecentNotifications(userId);
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(
    notificationId: number,
    userId: number
  ): Promise<Notification | null> {
    const notification = await NotificationRepository.markAsRead(notificationId, userId);

    if (notification && this.socketManager) {
      // Send real-time update
      this.socketManager.emitToUser(userId, 'notification-read', { notificationId });

      // Update unread count
      const unreadCount = await NotificationRepository.getUnreadCount(userId);
      this.socketManager.emitToUser(userId, 'unread-count-update', { count: unreadCount });
    }

    return notification;
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(userId: number): Promise<number> {
    const count = await NotificationRepository.markAllAsRead(userId);

    if (count > 0 && this.socketManager) {
      // Send real-time update
      this.socketManager.emitToUser(userId, 'unread-count-update', { count: 0 });
    }

    return count;
  }

  /**
   * Get unread count
   */
  static async getUnreadCount(userId: number): Promise<number> {
    return await NotificationRepository.getUnreadCount(userId);
  }

  /**
   * Clean old notifications (run as scheduled task)
   */
  static async cleanOldNotifications(daysOld: number = 30): Promise<number> {
    return await NotificationRepository.deleteOldNotifications(daysOld);
  }

  /**
   * Delete a specific notification
   */
  static async deleteNotification(notificationId: number, userId: number): Promise<void> {
    const notification = await NotificationRepository.getNotificationById(notificationId, userId);

    if (!notification) {
      throw new Error('Notification not found or not owned by user');
    }

    await NotificationRepository.deleteNotification(notificationId);
  }

  /**
   * Create and send an unlike notification
   */
  static async createUnlikeNotification(
    unlikedUserId: number,
    unlikerId: number,
    wasMatch: boolean = false
  ): Promise<Notification | null> {
    try {
      // Don't notify if user unlikes themselves
      if (unlikedUserId === unlikerId) return null;

      // Get unliker user info
      const unlikerUser = await UserRepository.findById(unlikerId);
      if (!unlikerUser) return null;

      const content = wasMatch
        ? `${unlikerUser.firstname} a rompu votre match 💔`
        : `${unlikerUser.firstname} a retiré son like`;

      const notification = await NotificationRepository.createNotification({
        user_id: unlikedUserId,
        type: 'unlike',
        content: content,
        data: {
          from_user: {
            id: unlikerUser.id,
            username: unlikerUser.username,
            firstname: unlikerUser.firstname,
            lastname: unlikerUser.lastname,
            profile_picture_url: unlikerUser.profile_picture_url
          },
          was_match: wasMatch
        }
      });

      // Send real-time notification
      if (this.socketManager) {
        // ✅ NOTIFICATION EN TEMPS RÉEL - Émettre l'événement unlike
        this.socketManager.emitToUser(unlikedUserId, 'unlike', {
          fromUser: {
            id: unlikerUser.id,
            username: unlikerUser.username,
            firstname: unlikerUser.firstname,
            lastname: unlikerUser.lastname,
            profile_picture_url: unlikerUser.profile_picture_url
          },
          wasMatch: wasMatch,
          timestamp: new Date().toISOString()
        });

        this.socketManager.emitToUser(unlikedUserId, 'new-notification', {
          ...notification,
          data: {
            from_user: {
              id: unlikerUser.id,
              username: unlikerUser.username,
              firstname: unlikerUser.firstname,
              lastname: unlikerUser.lastname,
              profile_picture_url: unlikerUser.profile_picture_url
            },
            was_match: wasMatch
          }
        });

        // Update unread count
        const unreadCount = await NotificationRepository.getUnreadCount(unlikedUserId);
        this.socketManager.emitToUser(unlikedUserId, 'unread-count-update', { count: unreadCount });
      }

      return notification;
    } catch (error) {
      console.error('Error creating unlike notification:', error);
      return null;
    }
  }
}
