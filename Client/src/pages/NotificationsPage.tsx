import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Notification } from '../types/notifications';
import { useNotifications } from '../hooks/useNotifications';
import './NotificationsPage.css';

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<string>('');
  const [page, setPage] = useState(1);

  const {
    notifications,
    unreadCount,
    loading,
    error,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  useEffect(() => {
    loadNotifications(1, selectedType);
    setPage(1);
  }, [selectedType, loadNotifications]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    loadNotifications(nextPage, selectedType);
    setPage(nextPage);
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if not already
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    // Handle different notification types
    switch (notification.type) {
      case 'match':
        if (notification.data?.match_user) {
          navigate(`/user/${notification.data.match_user.id}`);
        }
        break;

      case 'like':
        if (notification.data?.from_user) {
          navigate(`/user/${notification.data.from_user.id}`);
        }
        break;

      case 'visit':
        if (notification.data?.visitor) {
          navigate(`/user/${notification.data.visitor.id}`);
        }
        break;

      case 'unlike':
        if (notification.data?.from_user) {
          navigate(`/user/${notification.data.from_user.id}`);
        }
        break;

      case 'message':
        // This would open the chat widget
        console.log('Open chat for message notification');
        break;
    }
  };

  const handleDeleteNotification = async (notificationId: number, event: React.MouseEvent) => {
    event.stopPropagation();
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

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `${diffInMinutes} min`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} h`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)} j`;
    return new Date(timestamp).toLocaleDateString('fr-FR');
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

  const getFilterLabel = (type: string) => {
    switch (type) {
      case 'like': return 'Likes';
      case 'match': return 'Matches';
      case 'visit': return 'Visites';
      case 'message': return 'Messages';
      case 'unlike': return 'Unlikes';
      default: return 'Tous';
    }
  };

  const getNotificationAction = (notification: Notification) => {
    switch (notification.type) {
      case 'match':
        return 'Voir profil';
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

  return (
    <div className="notifications-page">
      <div className="notifications-container">
        <div className="notifications-header">
          <div className="header-title">
            <h1>Notifications</h1>
            {unreadCount > 0 && (
              <span className="unread-badge">
                {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div className="header-actions">
            {unreadCount > 0 && (
              <button
                className="mark-all-read-btn"
                onClick={markAllAsRead}
              >
                Marquer toutes comme lues
              </button>
            )}
          </div>
        </div>

        <div className="notifications-filters">
          <button
            className={`filter-btn ${selectedType === '' ? 'active' : ''}`}
            onClick={() => setSelectedType('')}
          >
            Toutes
          </button>
          {['like', 'match', 'visit', 'message', 'unlike'].map(type => (
            <button
              key={type}
              className={`filter-btn ${selectedType === type ? 'active' : ''}`}
              onClick={() => setSelectedType(type)}
            >
              {getNotificationIcon(type)} {getFilterLabel(type)}
            </button>
          ))}
        </div>

        <div className="notifications-content">
          {error && (
            <div className="error-message">
              <p>❌ {error}</p>
              <button onClick={() => loadNotifications(1, selectedType)}>
                Réessayer
              </button>
            </div>
          )}

          {loading && notifications.length === 0 ? (
            <div className="notifications-loading">
              <div className="loading-spinner"></div>
              <p>Chargement des notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="notifications-empty">
              <div className="empty-icon">🔔</div>
              <h3>Aucune notification</h3>
              <p>
                {selectedType
                  ? `Aucune notification de type "${getFilterLabel(selectedType)}" pour le moment.`
                  : 'Vous n\'avez aucune notification pour le moment.'
                }
              </p>
            </div>
          ) : (
            <div className="notifications-list">
              {notifications.map((notification) => {
                const user = getUserFromNotification(notification);
                return (
                  <div
                    key={notification.id}
                    className={`notification-card ${!notification.is_read ? 'unread' : ''}`}
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
                      <div className="notification-type-badge">
                        {getNotificationIcon(notification.type)}
                      </div>
                    </div>

                    <div className="notification-body">
                      <div className="notification-content">
                        <p className="notification-message">
                          {notification.content}
                        </p>
                        <div className="notification-meta">
                          <span className="notification-time">
                            {formatTimeAgo(notification.created_at)}
                          </span>
                          <span className="notification-action-hint">
                            {getNotificationAction(notification)}
                          </span>
                        </div>
                      </div>

                      <div className="notification-actions">
                        <button
                          className="delete-btn"
                          onClick={(e) => handleDeleteNotification(notification.id, e)}
                          title="Supprimer la notification"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    {!notification.is_read && (
                      <div className="notification-unread-indicator"></div>
                    )}
                  </div>
                );
              })}

              {notifications.length > 0 && (
                <div className="load-more-section">
                  <button
                    className="load-more-btn"
                    onClick={handleLoadMore}
                    disabled={loading}
                  >
                    {loading ? 'Chargement...' : 'Charger plus'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
