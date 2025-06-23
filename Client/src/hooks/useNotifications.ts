import { useState, useEffect, useCallback, useRef } from 'react';
import { Notification, NotificationSummary } from '../types/notifications';
import { NotificationService } from '../services/notificationService';
import { useAuth } from './useAuth';
import { useChatSocket } from './useChatSocket';

export const useNotifications = () => {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callbacksRef = useRef({
    onNewLike: (data: { fromUser: any; timestamp: string }) => {},
    onNewMatch: (data: { matchedUser: any; timestamp: string }) => {},
    onProfileVisit: (data: { visitor: any; timestamp: string }) => {},
    onNewMessage: (data: { sender: any; messageId: number; content: string }) => {},
  });

  // Load notifications function
  const loadNotifications = useCallback(async (page: number = 1, type?: string) => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);
      const data = await NotificationService.getNotifications(token, page, 20, type);

      if (page === 1) {
        setNotifications(data.notifications);
      } else {
        setNotifications(prev => [...prev, ...data.notifications]);
      }

      setUnreadCount(data.unread_count);
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Gestionnaires pour les événements de notifications via le socket de chat
  const handleNewLike = useCallback((data: any) => {
    console.log('New like notification received:', data);

    // Créer une notification temporaire pour l'affichage immédiat
    const newNotification: Notification = {
      id: Date.now(), // ID temporaire
      user_id: user?.id || 0,
      type: 'like',
      content: `${data.fromUser.firstname} vous a liké`,
      is_read: false,
      created_at: new Date().toISOString(),
      data: {
        from_user: data.fromUser
      }
    };

    // Ajouter immédiatement à la liste
    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);

    // Déclencher le callback pour les toasts
    callbacksRef.current.onNewLike(data);

    // Rafraîchir pour avoir la vraie notification depuis le serveur
    setTimeout(() => loadNotifications(), 2000);
  }, [user?.id, loadNotifications]);

  const handleNewMatch = useCallback((data: any) => {
    console.log('New match notification received:', data);

    // Créer une notification temporaire pour l'affichage immédiat
    const newNotification: Notification = {
      id: Date.now(), // ID temporaire
      user_id: user?.id || 0,
      type: 'match',
      content: `🎉 Nouveau match avec ${data.matchedUser.firstname}!`,
      is_read: false,
      created_at: new Date().toISOString(),
      data: {
        match_user: data.matchedUser
      }
    };

    // Ajouter immédiatement à la liste
    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);

    // Déclencher le callback pour les toasts
    callbacksRef.current.onNewMatch(data);

    // Rafraîchir pour avoir la vraie notification depuis le serveur
    setTimeout(() => loadNotifications(), 2000);
  }, [user?.id, loadNotifications]);

  const handleProfileVisit = useCallback((data: any) => {
    console.log('Profile visit notification received:', data);

    // Créer une notification temporaire pour l'affichage immédiat
    const newNotification: Notification = {
      id: Date.now(), // ID temporaire
      user_id: user?.id || 0,
      type: 'visit',
      content: `${data.visitor.firstname} a visité votre profil`,
      is_read: false,
      created_at: new Date().toISOString(),
      data: {
        visitor: data.visitor
      }
    };

    // Ajouter immédiatement à la liste
    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);

    // Déclencher le callback pour les toasts
    callbacksRef.current.onProfileVisit(data);

    // Rafraîchir pour avoir la vraie notification depuis le serveur
    setTimeout(() => loadNotifications(), 2000);
  }, [user?.id, loadNotifications]);

  const handleNewMessage = useCallback((data: any) => {
    console.log('New message notification received:', data);

    // Vérifier si la conversation est ouverte avant d'afficher le toast ET d'ajouter la notification
    const isConversationOpen = (window as any).isConversationOpen?.(data.sender.id);

    console.log('Is conversation open with user', data.sender.id, ':', isConversationOpen);

    // Si la conversation est ouverte, ne pas créer de notification du tout
    if (isConversationOpen) {
      console.log('Conversation is open, skipping notification creation');
      return;
    }

    // Créer une notification temporaire pour l'affichage immédiat
    const newNotification: Notification = {
      id: Date.now(), // ID temporaire
      user_id: user?.id || 0,
      type: 'message',
      content: `Nouveau message de ${data.sender.firstname}`,
      is_read: false,
      created_at: new Date().toISOString(),
      data: {
        from_user: data.sender,
        message_id: data.messageId,
        conversation_id: `chat-${Math.min(data.sender.id, user?.id || 0)}-${Math.max(data.sender.id, user?.id || 0)}`
      }
    };

    // Ajouter immédiatement à la liste
    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);

    // Déclencher le callback pour les toasts
    if (callbacksRef.current.onNewMessage) {
      callbacksRef.current.onNewMessage(data);
    }

    // Rafraîchir pour avoir la vraie notification depuis le serveur
    setTimeout(() => loadNotifications(), 2000);
  }, [user?.id, loadNotifications]);

  // Utiliser le socket de chat pour écouter les notifications
  const { socket } = useChatSocket(token, {
    onNewMessage: () => {}, // Géré par ChatWidget
    onMessageRead: () => {}, // Géré par ChatWidget
    onUserOnline: () => {}, // Géré par ChatWidget
    onUserOffline: () => {}, // Géré par ChatWidget
  });

  // Écouter les événements de notifications sur le socket de chat
  useEffect(() => {
    if (!socket || !user) return;

    const handleNewLikeEvent = (data: any) => handleNewLike(data);
    const handleNewMatchEvent = (data: any) => handleNewMatch(data);
    const handleProfileVisitEvent = (data: any) => handleProfileVisit(data);
    const handleNewMessageEvent = (data: any) => handleNewMessage(data);
    const handleUnreadCountUpdate = (data: { unreadCount: number }) => {
      console.log('Unread count update:', data);
      setUnreadCount(data.unreadCount);
    };

    // Ajouter les listeners
    socket.on('new-like', handleNewLikeEvent);
    socket.on('new-match', handleNewMatchEvent);
    socket.on('profile-visit', handleProfileVisitEvent);
    socket.on('new-message-notification', handleNewMessageEvent);
    socket.on('unread-count-update', handleUnreadCountUpdate);

    return () => {
      // Retirer les listeners
      socket.off('new-like', handleNewLikeEvent);
      socket.off('new-match', handleNewMatchEvent);
      socket.off('profile-visit', handleProfileVisitEvent);
      socket.off('new-message-notification', handleNewMessageEvent);
      socket.off('unread-count-update', handleUnreadCountUpdate);
    };
  }, [socket, user, handleNewLike, handleNewMatch, handleProfileVisit, handleNewMessage]);

  // Load unread count
  const loadUnreadCount = useCallback(async () => {
    if (!token) return;

    try {
      const count = await NotificationService.getUnreadCount(token);
      setUnreadCount(count);
    } catch (err) {
      console.error('Failed to load unread count:', err);
    }
  }, [token]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: number) => {
    if (!token) return;

    try {
      await NotificationService.markAsRead(token, notificationId);

      // Update local state
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId
            ? { ...notif, is_read: true }
            : notif
        )
      );

      setUnreadCount(prev => Math.max(0, prev - 1));

      // Emit socket event
      if (socket) {
        socket.emit('mark-notification-read', { notificationId });
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      setError('Failed to mark notification as read');
    }
  }, [token, socket]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!token) return;

    try {
      await NotificationService.markAllAsRead(token);

      // Update local state
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, is_read: true }))
      );

      setUnreadCount(0);

      // Emit socket event
      if (socket) {
        socket.emit('mark-all-notifications-read');
      }
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
      setError('Failed to mark all notifications as read');
    }
  }, [token, socket]);

  // Delete notification (real deletion via API)
  const deleteNotification = useCallback(async (notificationId: number) => {
    if (!token) return;

    try {
      await NotificationService.deleteNotification(token, notificationId);

      // Update local state after successful deletion
      setNotifications(prev => {
        const notificationToDelete = prev.find(notif => notif.id === notificationId);
        if (notificationToDelete && !notificationToDelete.is_read) {
          // Update unread count if the notification was unread
          setUnreadCount(prevCount => Math.max(0, prevCount - 1));
        }
        return prev.filter(notif => notif.id !== notificationId);
      });

      console.log('Notification deleted successfully:', notificationId);
    } catch (err) {
      console.error('Failed to delete notification:', err);
      setError('Failed to delete notification');
    }
  }, [token]);

  // Set event callbacks
  const setEventCallbacks = useCallback((callbacks: {
    onNewLike?: (data: { fromUser: any; timestamp: string }) => void;
    onNewMatch?: (data: { matchedUser: any; timestamp: string }) => void;
    onProfileVisit?: (data: { visitor: any; timestamp: string }) => void;
    onNewMessage?: (data: { sender: any; messageId: number; content: string }) => void;
  }) => {
    callbacksRef.current = {
      onNewLike: callbacks.onNewLike || callbacksRef.current.onNewLike,
      onNewMatch: callbacks.onNewMatch || callbacksRef.current.onNewMatch,
      onProfileVisit: callbacks.onProfileVisit || callbacksRef.current.onProfileVisit,
      onNewMessage: callbacks.onNewMessage || callbacksRef.current.onNewMessage,
    };
  }, []);

  // Load initial data
  useEffect(() => {
    if (token && user) {
      loadNotifications();
      loadUnreadCount();
    }
  }, [token, user, loadNotifications, loadUnreadCount]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    loadNotifications,
    loadUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    setEventCallbacks,
  };
};
