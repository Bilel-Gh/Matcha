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
      // Nettoyer la connexion existante si pas de token
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    // Éviter de recréer la connexion si elle existe déjà
    if (socketRef.current?.connected) {
      return;
    }

    console.log('Initializing socket connection...');

    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3001', {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000
    });

    socketRef.current = socket;

    // Gestionnaires de connexion
    socket.on('connect', () => {
      console.log('Connected to chat server');
      setIsConnected(true);
    });

    socket.on('disconnect', (reason) => {
      console.log('Disconnected from chat server:', reason);
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setIsConnected(false);
      callbacksRef.current.onError?.('Connection failed');
    });

    // Gestionnaires de messages
    socket.on('new-message', (message) => {
      console.log('New message received:', message);
      callbacksRef.current.onNewMessage?.(message);
    });

    socket.on('message-sent', (data) => {
      console.log('Message sent confirmation:', data);
      // Optionnel: gérer la confirmation d'envoi
    });

    socket.on('message-read-update', (data) => {
      console.log('Message read update:', data);
      callbacksRef.current.onMessageRead?.(data);
    });

    // Gestionnaires de statut utilisateur
    socket.on('user-online', (data) => {
      console.log('User online:', data);
      callbacksRef.current.onUserOnline?.(data.userId);
    });

    socket.on('user-offline', (data) => {
      console.log('User offline:', data);
      callbacksRef.current.onUserOffline?.(data.userId);
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
      console.error('Socket error:', error);
      callbacksRef.current.onError?.(error.message || 'An error occurred');
    });

    return () => {
      console.log('Cleaning up socket connection...');
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [token]); // Seulement dépendant du token, pas des callbacks

  // Envoyer un message
  const sendMessage = useCallback((receiverId: number, content: string, tempId?: string) => {
    if (!socketRef.current || !isConnected) {
      console.error('Socket not connected');
      return;
    }

    socketRef.current.emit('send-message', {
      receiverId,
      content,
      tempId
    });
  }, [isConnected]);

  // Marquer un message comme lu
  const markAsRead = useCallback((messageId: number) => {
    if (!socketRef.current || !isConnected) {
      console.error('Socket not connected');
      return;
    }

    socketRef.current.emit('message-read', { messageId });
  }, [isConnected]);

  // Marquer tous les messages d'un expéditeur comme lus
  const markAllAsRead = useCallback((senderId: number) => {
    if (!socketRef.current || !isConnected) {
      console.error('Socket not connected');
      return;
    }

    socketRef.current.emit('mark-all-read', { senderId });
  }, [isConnected]);

  // Rejoindre une conversation
  const joinConversation = useCallback((userId: number) => {
    if (!socketRef.current || !isConnected) {
      console.error('Socket not connected');
      return;
    }

    const conversationId = `chat-${Math.min(parseInt(token!), userId)}-${Math.max(parseInt(token!), userId)}`;
    socketRef.current.emit('join-conversation', { conversationId });
  }, [isConnected, token]);

  // Quitter une conversation
  const leaveConversation = useCallback((userId: number) => {
    if (!socketRef.current || !isConnected) {
      console.error('Socket not connected');
      return;
    }

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
