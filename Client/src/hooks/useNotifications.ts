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

  const callbacksRef = useRef<{
    onNewLike?: (data: { fromUser: any; timestamp: string }) => void;
    onNewMatch?: (data: { matchedUser: any; timestamp: string }) => void;
    onProfileVisit?: (data: { visitor: any; timestamp: string }) => void;
    onNewMessage?: (data: { sender: any; messageId: number; content: string }) => void;
    onUnlike?: (data: { fromUser: any; timestamp: string; wasMatch: boolean }) => void;
  }>({});

  // ✅ DÉDUPLICATION - Éviter les toasts en double
  const recentEventsRef = useRef<Map<string, number>>(new Map());

  // Load notifications from API
  const loadNotifications = useCallback(async (page: number = 1, type?: string) => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const data = await NotificationService.getNotifications(token, page, 20, type);

      if (page === 1) {
        setNotifications(data.notifications);
      } else {
        setNotifications(prev => [...prev, ...data.notifications]);
      }

      setUnreadCount(data.unread_count);
    } catch (err: any) {
      console.error('Failed to load notifications:', err);
      setError(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [token]);

  // ✅ NOTIFICATION EN TEMPS RÉEL - Handler ultra-rapide pour tous les types
  const handleNewNotification = useCallback((notification: Notification) => {
    // AJOUT IMMÉDIAT - performance optimisée
    setNotifications(prev => {
      // Éviter les doublons de manière optimisée
      const exists = prev.some(n => n.id === notification.id);
      if (exists) return prev;

      return [notification, ...prev];
    });

    // MISE À JOUR IMMÉDIATE du compteur si non lu
    if (!notification.is_read) {
      setUnreadCount(prev => prev + 1);
    }

    // Déclencher les callbacks pour les toasts - performance optimisée
    const callbackData = {
      timestamp: notification.created_at
    };

    switch (notification.type) {
      case 'like':
        if (callbacksRef.current.onNewLike && notification.data?.from_user) {
          callbacksRef.current.onNewLike({
            fromUser: notification.data.from_user,
            ...callbackData
          });
        }
        break;

      case 'match':
        if (callbacksRef.current.onNewMatch && notification.data?.match_user) {
          callbacksRef.current.onNewMatch({
            matchedUser: notification.data.match_user,
            ...callbackData
          });
        }
        break;

      case 'visit':
        if (callbacksRef.current.onProfileVisit && notification.data?.visitor) {
          callbacksRef.current.onProfileVisit({
            visitor: notification.data.visitor,
            ...callbackData
          });
        }
        break;

      case 'unlike':
        if (callbacksRef.current.onUnlike && notification.data?.from_user) {
          callbacksRef.current.onUnlike({
            fromUser: notification.data.from_user,
            wasMatch: notification.data.was_match || false,
            ...callbackData
          });
        }
        break;
    }
  }, []);

  // ✅ NOTIFICATION EN TEMPS RÉEL - Handler pour les messages avec déduplication
  const handleNewMessage = useCallback((data: any) => {
    // Vérifier si une conversation est ouverte avec cet utilisateur
    const isConversationOpen = (window as any).isConversationOpen?.(data.sender.id) || false;

    // Si la conversation est ouverte, ne pas créer de notification du tout
    if (isConversationOpen) {
      return;
    }

    // ✅ DÉDUPLICATION pour les messages
    const eventKey = `message-${data.sender.id}-${user?.id}-${data.messageId}`;
    const now = Date.now();
    const lastEventTime = recentEventsRef.current.get(eventKey);

    // Si un événement similaire s'est produit dans les dernières 2 secondes, l'ignorer
    if (lastEventTime && (now - lastEventTime) < 2000) {
      console.log('🔗 Ignoring duplicate message event');
      return;
    }

    // Enregistrer cet événement
    recentEventsRef.current.set(eventKey, now);

    // Nettoyer les anciens événements (plus de 5 secondes)
    for (const [key, timestamp] of recentEventsRef.current.entries()) {
      if (now - timestamp > 5000) {
        recentEventsRef.current.delete(key);
      }
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

  // ✅ NOTIFICATION EN TEMPS RÉEL - Configuration des événements socket
  const { socket } = useChatSocket(token, {
    onNewMessage: handleNewMessage
  });

  useEffect(() => {
    if (!socket || !user) return;

    // ✅ ÉVÉNEMENTS EN TEMPS RÉEL - Configuration des listeners
    const handleNewNotificationEvent = (notification: Notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    };

    const handleUnreadCountUpdate = (data: { count: number }) => {
      setUnreadCount(data.count);
    };

    // ✅ NOUVEAU - Gestionnaire pour les événements de visite de profil avec déduplication
    const handleProfileVisitEvent = (data: any) => {
      console.log('🔗 Socket: Received profile-visit event:', data);

      // Créer une clé unique pour cet événement
      const eventKey = `visit-${data.visitor.id}-${user?.id}`;
      const now = Date.now();
      const lastEventTime = recentEventsRef.current.get(eventKey);

      // Si un événement similaire s'est produit dans les dernières 2 secondes, l'ignorer
      if (lastEventTime && (now - lastEventTime) < 2000) {
        console.log('🔗 Ignoring duplicate profile-visit event');
        return;
      }

      // Enregistrer cet événement
      recentEventsRef.current.set(eventKey, now);

      // Nettoyer les anciens événements (plus de 5 secondes)
      for (const [key, timestamp] of recentEventsRef.current.entries()) {
        if (now - timestamp > 5000) {
          recentEventsRef.current.delete(key);
        }
      }

      // Appeler le callback si défini
      if (callbacksRef.current.onProfileVisit) {
        callbacksRef.current.onProfileVisit({
          visitor: data.visitor,
          timestamp: data.timestamp
        });
      }
    };

    // ✅ NOUVEAU - Gestionnaire pour les événements d'unlike avec déduplication
    const handleUnlikeEvent = (data: any) => {
      console.log('🔗 Socket: Received unlike event:', data);

      // Déduplication pour les unlikes
      const eventKey = `unlike-${data.fromUser.id}-${user?.id}`;
      const now = Date.now();
      const lastEventTime = recentEventsRef.current.get(eventKey);

      if (lastEventTime && (now - lastEventTime) < 2000) {
        console.log('🔗 Ignoring duplicate unlike event');
        return;
      }

      recentEventsRef.current.set(eventKey, now);

      // Appeler le callback si défini
      if (callbacksRef.current.onUnlike) {
        callbacksRef.current.onUnlike({
          fromUser: data.fromUser,
          wasMatch: data.wasMatch,
          timestamp: data.timestamp
        });
      }
    };

    const handleNewLikeEvent = (data: any) => {
      console.log('🔗 Socket: Received new-like event:', data);

      // Déduplication pour les likes
      const eventKey = `like-${data.fromUser.id}-${user?.id}`;
      const now = Date.now();
      const lastEventTime = recentEventsRef.current.get(eventKey);

      if (lastEventTime && (now - lastEventTime) < 2000) {
        console.log('🔗 Ignoring duplicate like event');
        return;
      }

      recentEventsRef.current.set(eventKey, now);

      if (callbacksRef.current.onNewLike) {
        callbacksRef.current.onNewLike({
          fromUser: data.fromUser,
          timestamp: data.timestamp
        });
      }
    };

    const handleNewMatchEvent = (data: any) => {
      console.log('🔗 Socket: Received new-match event:', data);

      // Déduplication pour les matches
      const eventKey = `match-${data.matchedUser.id}-${user?.id}`;
      const now = Date.now();
      const lastEventTime = recentEventsRef.current.get(eventKey);

      if (lastEventTime && (now - lastEventTime) < 2000) {
        console.log('🔗 Ignoring duplicate match event');
        return;
      }

      recentEventsRef.current.set(eventKey, now);

      if (callbacksRef.current.onNewMatch) {
        callbacksRef.current.onNewMatch({
          matchedUser: data.matchedUser,
          timestamp: data.timestamp
        });
      }
    };

    // Écouter les événements (sans new-message-notification car géré par useChatSocket)
    socket.on('new-notification', handleNewNotificationEvent);
    socket.on('unread-count-update', handleUnreadCountUpdate);
    socket.on('new-like', handleNewLikeEvent);
    socket.on('new-match', handleNewMatchEvent);
    socket.on('profile-visit', handleProfileVisitEvent);
    socket.on('unlike', handleUnlikeEvent);

    // Cleanup
    return () => {
      socket.off('new-notification', handleNewNotificationEvent);
      socket.off('unread-count-update', handleUnreadCountUpdate);
      socket.off('new-like', handleNewLikeEvent);
      socket.off('new-match', handleNewMatchEvent);
      socket.off('profile-visit', handleProfileVisitEvent);
      socket.off('unlike', handleUnlikeEvent);
    };
  }, [socket, user, handleNewMessage]);

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

      // Update local state IMMÉDIATEMENT
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

      // Update local state IMMÉDIATEMENT
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

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: number) => {
    if (!token) return;

    try {
      await NotificationService.deleteNotification(token, notificationId);

      // Update local state IMMÉDIATEMENT
      setNotifications(prev => {
        const notificationToDelete = prev.find(notif => notif.id === notificationId);
        if (notificationToDelete && !notificationToDelete.is_read) {
          setUnreadCount(prevCount => Math.max(0, prevCount - 1));
        }
        return prev.filter(notif => notif.id !== notificationId);
      });
    } catch (err) {
      console.error('Failed to delete notification:', err);
      setError('Failed to delete notification');
    }
  }, [token]);

  // Set event callbacks pour les toasts
  const setEventCallbacks = useCallback((callbacks: {
    onNewLike?: (data: { fromUser: any; timestamp: string }) => void;
    onNewMatch?: (data: { matchedUser: any; timestamp: string }) => void;
    onProfileVisit?: (data: { visitor: any; timestamp: string }) => void;
    onNewMessage?: (data: { sender: any; messageId: number; content: string }) => void;
    onUnlike?: (data: { fromUser: any; timestamp: string; wasMatch: boolean }) => void;
  }) => {
    callbacksRef.current = {
      onNewLike: callbacks.onNewLike || callbacksRef.current.onNewLike,
      onNewMatch: callbacks.onNewMatch || callbacksRef.current.onNewMatch,
      onProfileVisit: callbacks.onProfileVisit || callbacksRef.current.onProfileVisit,
      onNewMessage: callbacks.onNewMessage || callbacksRef.current.onNewMessage,
      onUnlike: callbacks.onUnlike || callbacksRef.current.onUnlike,
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
