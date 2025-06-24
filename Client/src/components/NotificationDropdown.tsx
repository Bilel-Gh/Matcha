import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBell } from 'react-icons/fa';
import { Notification } from '../types/notifications';
import { useNotifications } from '../hooks/useNotifications';
import { showLikeToast, showMatchToast, showVisitToast, showUnlikeToast } from './ToastContainer';
import './NotificationDropdown.css';

interface NotificationDropdownProps {
  onOpenChat?: (conversationId: string) => void;
  onViewProfile?: (userId: number) => void;
  onShowMessage?: (message: string, type: 'success' | 'error') => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  onOpenChat,
  onViewProfile,
  onShowMessage,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    setEventCallbacks,
  } = useNotifications();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Set up notification event callbacks
  useEffect(() => {
    setEventCallbacks({
      onNewLike: (data) => {
        showLikeToast(
          data.fromUser.firstname,
          data.fromUser.profile_picture_url,
          () => navigate(`/user/${data.fromUser.id}`)
        );
      },
      onNewMatch: (data) => {
        showMatchToast(
          data.matchedUser.firstname,
          data.matchedUser.profile_picture_url,
          () => navigate(`/user/${data.matchedUser.id}`)
        );
      },
      onProfileVisit: (data) => {
        showVisitToast(
          data.visitor.firstname,
          data.visitor.profile_picture_url,
          () => navigate(`/user/${data.visitor.id}`)
        );
      },
      onUnlike: (data) => {
        showUnlikeToast(
          data.fromUser.firstname,
          data.wasMatch,
          data.fromUser.profile_picture_url,
          () => navigate(`/user/${data.fromUser.id}`)
        );
      },
      onNewMessage: (data) => {
        import('./ToastContainer').then(({ showMessageToast }) => {
          showMessageToast(
            data.sender.firstname,
            data.content,
            data.sender.profile_picture_url,
            () => {
              // Ouvrir le chat avec l'utilisateur
              if ((window as any).openChatWithUser) {
                (window as any).openChatWithUser(data.sender.id);
              }
            }
          );
        });
      },
    });
  }, [setEventCallbacks, navigate]);

  const handleToggleDropdown = () => {
    const wasOpen = isOpen;
    setIsOpen(!isOpen);

    // Si on ouvre le dropdown et qu'il y a des notifications non lues,
    // réinitialiser immédiatement le compteur de notifications non lues
    if (!wasOpen && unreadCount > 0) {
      // Marquer toutes les notifications comme lues côté serveur
      markAllAsRead();
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if not already
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    // Handle different notification types
    switch (notification.type) {
      case 'match':
        if (onOpenChat && notification.data?.conversation_id) {
          onOpenChat(notification.data.conversation_id);
        } else if (onViewProfile && notification.data?.match_user) {
          onViewProfile(notification.data.match_user.id);
        }
        break;

      case 'like':
        if (onViewProfile && notification.data?.from_user) {
          onViewProfile(notification.data.from_user.id);
        }
        break;

      case 'visit':
        if (onViewProfile && notification.data?.visitor) {
          onViewProfile(notification.data.visitor.id);
        }
        break;

      case 'unlike':
        if (onViewProfile && notification.data?.from_user) {
          onViewProfile(notification.data.from_user.id);
        }
        break;

      case 'message':
        if (onOpenChat && notification.data?.conversation_id) {
          onOpenChat(notification.data.conversation_id);
        }
        break;
    }

    setIsOpen(false);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleDeleteNotification = async (notificationId: number, event: React.MouseEvent) => {
    event.stopPropagation(); // Empêcher le clic sur la notification
    await deleteNotification(notificationId);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like': return '💝';
      case 'match': return '🎉';
      case 'visit': return '👀';
      case 'message': return '💬';
      case 'unlike': return '💔';
      default: return '🔔';
    }
  };

  const getNotificationAction = (notification: Notification) => {
    switch (notification.type) {
      case 'match':
        return 'Envoyer message';
      case 'like':
        return 'Voir profil';
      case 'visit':
        return 'Voir profil';
      case 'message':
        return 'Répondre';
      case 'unlike':
        return 'Voir profil';
      default:
        return 'Voir';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `${diffInMinutes}min`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}j`;
  };

  const getFullImageUrl = (url?: string) => {
    if (!url) return '/placeholder-image.svg';
    if (url.startsWith('http')) return url;
    return `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${url}`;
  };

  const getUserFromNotification = (notification: Notification) => {
    return notification.data?.from_user ||
           notification.data?.match_user ||
           notification.data?.visitor;
  };

  return (
    <div className="notification-dropdown" ref={dropdownRef}>
      <button
        className="notification-bell"
        onClick={handleToggleDropdown}
        aria-label="Notifications"
      >
        <FaBell size={20} />
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown-menu">
          <div className="notification-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button
                className="mark-all-read-btn"
                onClick={handleMarkAllAsRead}
              >
                Tout marquer comme lu
              </button>
            )}
          </div>

          <div className="notification-list">
            {loading ? (
              <div className="notification-loading">
                <div className="loading-spinner"></div>
                <span>Chargement...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty">
                <div className="empty-icon">🔔</div>
                <p>Aucune notification</p>
              </div>
            ) : (
              notifications.slice(0, 10).map((notification) => {
                const user = getUserFromNotification(notification);
                return (
                  <div
                    key={notification.id}
                    className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="notification-avatar">
                      <img
                        src={getFullImageUrl(user?.profile_picture_url)}
                        alt={user?.firstname || 'User'}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder-image.svg';
                        }}
                      />
                      <div className="notification-type-icon">
                        {getNotificationIcon(notification.type)}
                      </div>
                    </div>

                    <div className="notification-content">
                      <div className="notification-text">
                        {notification.content}
                      </div>
                      <div className="notification-meta">
                        <span className="notification-time">
                          {formatTimeAgo(notification.created_at)}
                        </span>
                        <span className="notification-action">
                          {getNotificationAction(notification)}
                        </span>
                      </div>
                    </div>

                    {!notification.is_read && (
                      <div className="notification-unread-dot"></div>
                    )}

                    {/* Bouton de suppression */}
                    <button
                      className="notification-delete-btn"
                      onClick={(e) => handleDeleteNotification(notification.id, e)}
                      aria-label="Supprimer la notification"
                      title="Supprimer cette notification"
                    >
                      ×
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {notifications.length > 0 && (
            <div className="notification-footer">
              <a href="/notifications" className="view-all-link">
                Voir toutes les notifications
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
