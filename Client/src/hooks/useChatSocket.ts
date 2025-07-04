import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface ChatSocketCallbacks {
  onNewMessage?: (message: any) => void;
  onMessageRead?: (data: any) => void;
  onUserOnline?: (userId: number) => void;
  onUserOffline?: (userId: number) => void;
  onTypingStart?: (data: { userId: number; conversationId: string }) => void;
  onTypingStop?: (data: { userId: number; conversationId: string }) => void;
  onError?: (error: string) => void;
}

interface UseChatSocketReturn {
  isConnected: boolean;
  socket: Socket | null;
  sendMessage: (receiverId: number, content: string, tempId?: string) => void;
  markAsRead: (messageId: number) => void;
  markAllAsRead: (senderId: number) => void;
  joinConversation: (userId: number) => void;
  leaveConversation: (userId: number) => void;
  startTyping: (receiverId: number) => void;
  stopTyping: (receiverId: number) => void;
}

export const useChatSocket = (
  token: string | null,
  callbacks: ChatSocketCallbacks = {}
): UseChatSocketReturn => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbacksRef = useRef(callbacks);

  // Mettre à jour les callbacks sans recréer la connexion
  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  // Initialiser la connexion Socket.IO
  useEffect(() => {
    if (!token) {
      if (socketRef.current) {
        // Force offline status before disconnecting
        if (socketRef.current.connected) {
          socketRef.current.emit('user-offline-force');
        }
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    // Éviter de recréer la connexion si elle existe déjà
    if (socketRef.current?.connected) {
      return;
    }

    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3001', {
      auth: {
        token: token
      },
      transports: ['websocket'], // WebSocket seulement pour vitesse maximale
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 100, // Reconnexion ultra rapide
      reconnectionDelayMax: 1000,
      timeout: 5000, // Timeout plus court
      forceNew: false,
      upgrade: false, // Pas d'upgrade nécessaire si on force WebSocket
      rememberUpgrade: false
    });

    socketRef.current = socket;

    // Store socket reference in window for logout access
    (window as any).socket = socket;

    // Handle browser close/tab close
    const handleBeforeUnload = () => {
      if (socket.connected) {
        // Force disconnect and mark as offline
        socket.emit('user-disconnect');
        socket.emit('user-offline-force');
        socket.disconnect();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Gestionnaires de connexion
    socket.on('connect', () => {
      setIsConnected(true);
      // Force update current user's online status
      socket.emit('user-online-update');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      // Force offline status when socket disconnects
      if (token) {
        socket.emit('user-offline-force');
      }
    });

    socket.on('disconnecting', () => {
      setIsConnected(false);
      // Force offline status when socket is disconnecting
      if (token) {
        socket.emit('user-offline-force');
      }
    });

    socket.on('connect_error', (error) => {
      // Ignorer les erreurs de fermeture de WebSocket pour éviter les warnings
      if (error?.message?.includes('WebSocket is closed') ||
          error?.message?.includes('closed before the connection is established')) {
        return; // Ne pas propager ces erreurs
      }
      setIsConnected(false);
      callbacksRef.current.onError?.('Connection failed');
    });

    // Gestionnaires de messages - ULTRA RAPIDES
    socket.on('new-message', (message) => {
      callbacksRef.current.onNewMessage?.(message);
    });

    socket.on('message-sent', (data) => {
      // Confirmation d'envoi - traitement minimal
    });

    socket.on('message-read-update', (data) => {
      callbacksRef.current.onMessageRead?.(data);
    });

    // Gestionnaires de statut utilisateur
    socket.on('user-online', (data) => {
      callbacksRef.current.onUserOnline?.(data.userId);
    });

    socket.on('user-offline', (data) => {
      callbacksRef.current.onUserOffline?.(data.userId);
    });

    // Heartbeat handler to maintain connection
    socket.on('heartbeat', () => {
      // Respond to heartbeat to maintain connection
      socket.emit('heartbeat-ack');
    });

    // Gestionnaires de frappe
    socket.on('typing-indicator', (data) => {
      if (data.typing) {
        callbacksRef.current.onTypingStart?.(data);
      } else {
        callbacksRef.current.onTypingStop?.(data);
      }
    });

    // Gestionnaire d'erreurs
    socket.on('error', (error) => {
      callbacksRef.current.onError?.(error.message || 'An error occurred');
    });

    return () => {
      // Cleanup propre pour éviter les warnings WebSocket
      window.removeEventListener('beforeunload', handleBeforeUnload);

      // Force offline status before disconnecting
      if (socket && socket.connected) {
        socket.emit('user-offline-force');
        socket.removeAllListeners();
        socket.disconnect();
      }

      // Clean up window reference
      delete (window as any).socket;

      socketRef.current = null;
      setIsConnected(false);
    };
  }, [token]); // Seulement dépendant du token, pas des callbacks

  // Envoyer un message - ULTRA RAPIDE
  const sendMessage = useCallback((receiverId: number, content: string, tempId?: string) => {
    if (!socketRef.current || !isConnected || !socketRef.current.connected) return;

    try {
      socketRef.current.emit('send-message', {
        receiverId,
        content,
        tempId
      });
    } catch (error) {
      // Ignorer silencieusement les erreurs de socket fermé
      if (!(error as Error)?.message?.includes('closed')) {
        // This is a developer warning, not a user-facing error.
        // The onError callback should be used for user-facing errors.
      }
    }
  }, [isConnected]);

  // Marquer un message comme lu - ULTRA RAPIDE
  const markAsRead = useCallback((messageId: number) => {
    if (!socketRef.current || !isConnected || !socketRef.current.connected) return;

    try {
      socketRef.current.emit('message-read', { messageId });
    } catch (error) {
      // Ignorer silencieusement les erreurs de socket fermé
    }
  }, [isConnected]);

  // Marquer tous les messages d'un expéditeur comme lus - ULTRA RAPIDE
  const markAllAsRead = useCallback((senderId: number) => {
    if (!socketRef.current || !isConnected || !socketRef.current.connected) return;

    try {
      socketRef.current.emit('mark-all-read', { senderId });
    } catch (error) {
      // Ignorer silencieusement les erreurs de socket fermé
    }
  }, [isConnected]);

  // Rejoindre une conversation
  const joinConversation = useCallback((userId: number) => {
    if (!socketRef.current || !isConnected) return;

    const conversationId = `chat-${Math.min(parseInt(token!), userId)}-${Math.max(parseInt(token!), userId)}`;
    socketRef.current.emit('join-conversation', { conversationId });
  }, [isConnected, token]);

  // Quitter une conversation
  const leaveConversation = useCallback((userId: number) => {
    if (!socketRef.current || !isConnected) return;

    const conversationId = `chat-${Math.min(parseInt(token!), userId)}-${Math.max(parseInt(token!), userId)}`;
    socketRef.current.emit('leave-conversation', { conversationId });
  }, [isConnected, token]);

  // Commencer à taper
  const startTyping = useCallback((receiverId: number) => {
    if (!socketRef.current || !isConnected) {
      return;
    }

    socketRef.current.emit('typing-start', { receiverId });

    // Auto-stop après 3 secondes
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(receiverId);
    }, 3000);
  }, [isConnected]);

  // Arrêter de taper
  const stopTyping = useCallback((receiverId: number) => {
    if (!socketRef.current || !isConnected) {
      return;
    }

    socketRef.current.emit('typing-stop', { receiverId });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [isConnected]);

  // Nettoyer les timeouts
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return {
    isConnected,
    socket: socketRef.current,
    sendMessage,
    markAsRead,
    markAllAsRead,
    joinConversation,
    leaveConversation,
    startTyping,
    stopTyping
  };
};
