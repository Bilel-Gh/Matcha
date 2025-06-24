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
    console.log('🎊 ToastContainer setting up listeners');

    // Méthode principale - window.showToast
    (window as any).showToast = addToast;
    (window as any).clearToasts = clearAllToasts;

    // Aussi écouter les événements personnalisés pour compatibilité
    const handleShowToast = (event: CustomEvent) => {
      console.log('🎊 ToastContainer received custom event:', event.detail);
      addToast(event.detail);
    };

    window.addEventListener('show-toast', handleShowToast as EventListener);

    console.log('🎊 ToastContainer ready - window.showToast available');

    return () => {
      window.removeEventListener('show-toast', handleShowToast as EventListener);
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
  console.log('🎊 showToast called with:', toast.type, toast.title);
  if ((window as any).showToast) {
    console.log('🎊 Using window.showToast');
    (window as any).showToast(toast);
  } else {
    console.log('🎊 window.showToast not available, using custom event');
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('show-toast', {
        detail: {
          ...toast,
          id: `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        }
      });
      window.dispatchEvent(event);
    }
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

export const showUnlikeToast = (userName: string, wasMatch: boolean, userAvatar?: string, onClick?: () => void) => {
  const title = wasMatch ? 'Match rompu 💔' : 'Like retiré';
  const message = wasMatch
    ? `${userName} a rompu votre match`
    : `${userName} a retiré son like`;

  showToast({
    type: 'error',
    title,
    message,
    userAvatar,
    userName,
    onClick,
    duration: 6000,
  });
};

// ✅ SYSTÈME DE TOASTS CUSTOM POUR ERREURS ET AUTRES MESSAGES

/**
 * Affiche un toast d'erreur personnalisé
 * @param title - Titre de l'erreur
 * @param error - Objet d'erreur ou message (optionnel)
 * @param duration - Durée d'affichage en ms (défaut: 6000)
 *
 * Exemple: showToastError("Failed to like user", error)
 */
export const showToastError = (title: string, error?: any, duration: number = 6000) => {
  let errorMessage = '';

  if (error) {
    if (typeof error === 'string') {
      errorMessage = error;
    } else if (error?.message) {
      errorMessage = error.message;
    } else if (error?.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error?.data?.message) {
      errorMessage = error.data.message;
    } else if (error?.error) {
      errorMessage = error.error;
    } else {
      errorMessage = 'Une erreur inattendue s\'est produite';
    }
  }

  showToast({
    type: 'error',
    title: `❌ ${title}`,
    message: errorMessage,
    duration
  });
};

/**
 * Affiche un toast de succès personnalisé
 * @param title - Titre du succès
 * @param message - Message (optionnel)
 * @param duration - Durée d'affichage en ms (défaut: 4000)
 *
 * Exemple: showToastSuccess("User liked successfully", "John Doe liked!")
 */
export const showToastSuccess = (title: string, message: string = '', duration: number = 4000) => {
  showToast({
    type: 'success',
    title: `✅ ${title}`,
    message,
    duration
  });
};

/**
 * Affiche un toast d'avertissement personnalisé
 * @param title - Titre de l'avertissement
 * @param message - Message (optionnel)
 * @param duration - Durée d'affichage en ms (défaut: 5000)
 *
 * Exemple: showToastWarning("Profile incomplete", "Please add more photos")
 */
export const showToastWarning = (title: string, message: string = '', duration: number = 5000) => {
  showToast({
    type: 'info', // Utilise le type info avec un style warning
    title: `⚠️ ${title}`,
    message,
    duration
  });
};

/**
 * Affiche un toast d'information personnalisé
 * @param title - Titre de l'information
 * @param message - Message (optionnel)
 * @param duration - Durée d'affichage en ms (défaut: 4000)
 *
 * Exemple: showToastInfo("Profile updated", "Changes saved successfully")
 */
export const showToastCustomInfo = (title: string, message: string = '', duration: number = 4000) => {
  showToast({
    type: 'info',
    title: `ℹ️ ${title}`,
    message,
    duration
  });
};

/**
 * Affiche un toast de chargement personnalisé
 * @param title - Titre du chargement
 * @param message - Message (optionnel, défaut: "Chargement...")
 * @param duration - Durée d'affichage en ms (défaut: 3000)
 *
 * Exemple: showToastLoading("Uploading photo", "Please wait...")
 */
export const showToastLoading = (title: string, message: string = 'Chargement...', duration: number = 3000) => {
  showToast({
    type: 'info',
    title: `⏳ ${title}`,
    message,
    duration
  });
};
