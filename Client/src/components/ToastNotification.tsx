import React, { useEffect, useState } from 'react';
import './ToastNotification.css';

export interface ToastData {
  id: string;
  type: 'like' | 'match' | 'visit' | 'message' | 'success' | 'error' | 'info';
  title: string;
  message: string;
  duration?: number;
  onClick?: () => void;
  userAvatar?: string;
  userName?: string;
  customStyle?: 'modern' | 'action' | 'feedback' | 'system';
}

interface ToastNotificationProps {
  toast: ToastData;
  onRemove: (id: string) => void;
}

const ToastNotification: React.FC<ToastNotificationProps> = ({ toast, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    // Show animation
    const showTimer = setTimeout(() => setIsVisible(true), 100);

    // Auto remove after duration
    const duration = toast.duration || 5000;
    const removeTimer = setTimeout(() => {
      handleRemove();
    }, duration);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(removeTimer);
    };
  }, [toast.duration]);

  const handleRemove = () => {
    setIsRemoving(true);
    setTimeout(() => {
      onRemove(toast.id);
    }, 300);
  };

  const handleClick = () => {
    if (toast.onClick) {
      toast.onClick();
    }
    handleRemove();
  };

  const getToastIcon = () => {
    switch (toast.type) {
      case 'like': return '💝';
      case 'match': return '🎉';
      case 'visit': return '👀';
      case 'message': return '💬';
      case 'success': return '✅';
      case 'error': return '❌';
      case 'info': return 'ℹ️';
      default: return '🔔';
    }
  };

  const getFullImageUrl = (url?: string) => {
    if (!url) return '/placeholder-image.svg';
    if (url.startsWith('http')) return url;
    return `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${url}`;
  };

  return (
    <div
      className={`toast-notification toast-${toast.type} ${toast.customStyle ? `toast-${toast.customStyle}` : ''} ${isVisible ? 'visible' : ''} ${isRemoving ? 'removing' : ''} ${toast.onClick ? 'clickable' : ''}`}
      onClick={toast.onClick ? handleClick : undefined}
    >
      <div className="toast-content">
        {toast.userAvatar ? (
          <div className="toast-avatar">
            <img
              src={getFullImageUrl(toast.userAvatar)}
              alt={toast.userName || 'User'}
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder-image.svg';
              }}
            />
            <div className="toast-type-icon">
              {getToastIcon()}
            </div>
          </div>
        ) : (
          <div className="toast-icon">
            {getToastIcon()}
          </div>
        )}

        <div className="toast-text">
          <div className="toast-title">
            {toast.title}
          </div>
          {toast.message && (
            <div className="toast-message">
              {toast.message}
            </div>
          )}
        </div>

        <button
          className="toast-close"
          onClick={(e) => {
            e.stopPropagation();
            handleRemove();
          }}
          aria-label="Fermer la notification"
        >
          ×
        </button>
      </div>

      <div className="toast-progress">
        <div
          className="toast-progress-bar"
          style={{
            animationDuration: `${toast.duration || 5000}ms`
          }}
        ></div>
      </div>
    </div>
  );
};

export default ToastNotification;
