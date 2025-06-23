import React, { useState, useCallback } from 'react';
import ToastNotification, { ToastData } from './ToastNotification';
import './ToastContainer.css';

interface ToastContainerProps {
  maxToasts?: number;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ maxToasts = 5 }) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback((toast: Omit<ToastData, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: ToastData = { ...toast, id };

    setToasts(prevToasts => {
      const updatedToasts = [newToast, ...prevToasts];
      // Keep only the max number of toasts
      return updatedToasts.slice(0, maxToasts);
    });
  }, [maxToasts]);

  const removeToast = useCallback((id: string) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Expose methods globally for easy access
  React.useEffect(() => {
    (window as any).showToast = addToast;
    (window as any).clearToasts = clearAllToasts;

    return () => {
      delete (window as any).showToast;
      delete (window as any).clearToasts;
    };
  }, [addToast, clearAllToasts]);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <ToastNotification
          key={toast.id}
          toast={toast}
          onRemove={removeToast}
        />
      ))}
    </div>
  );
};

export default ToastContainer;

// Helper functions for easier usage
export const showToast = (toast: Omit<ToastData, 'id'>) => {
  if ((window as any).showToast) {
    (window as any).showToast(toast);
  }
};

export const showLikeToast = (userName: string, userAvatar?: string, onClick?: () => void) => {
  showToast({
    type: 'like',
    title: 'Nouveau like !',
    message: `${userName} vous a liké`,
    userAvatar,
    userName,
    onClick,
    duration: 6000,
  });
};

export const showMatchToast = (userName: string, userAvatar?: string, onClick?: () => void) => {
  showToast({
    type: 'match',
    title: "C'est un match ! 🎉",
    message: `Vous avez matché avec ${userName}`,
    userAvatar,
    userName,
    onClick,
    duration: 8000,
  });
};

export const showVisitToast = (userName: string, userAvatar?: string, onClick?: () => void) => {
  showToast({
    type: 'visit',
    title: 'Visite de profil',
    message: `${userName} a visité votre profil`,
    userAvatar,
    userName,
    onClick,
    duration: 5000,
  });
};

export const showMessageToast = (userName: string, message: string, userAvatar?: string, onClick?: () => void) => {
  showToast({
    type: 'message',
    title: 'Nouveau message',
    message: `${userName}: ${message.length > 50 ? message.substring(0, 50) + '...' : message}`,
    userAvatar,
    userName,
    onClick,
    duration: 7000,
  });
};

export const showSuccessToast = (title: string, message: string) => {
  showToast({
    type: 'success',
    title,
    message,
    duration: 4000,
  });
};

export const showErrorToast = (title: string, message: string) => {
  showToast({
    type: 'error',
    title,
    message,
    duration: 6000,
  });
};

export const showInfoToast = (title: string, message: string) => {
  showToast({
    type: 'info',
    title,
    message,
    duration: 5000,
  });
};
