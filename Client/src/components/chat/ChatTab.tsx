import React, { useState, useEffect, useRef, useCallback } from 'react';

interface User {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  profile_picture_url: string;
  is_online: boolean;
  last_connection?: string;
}

interface Message {
  id: number;
  content: string;
  sent_at: string;
  sender_id: number;
  receiver_id: number;
  is_read: boolean;
}

interface ChatTabProps {
  user: User;
  isMinimized: boolean;
  position: number;
  onClose: () => void;
  onToggleMinimize: () => void;
  token: string;
  sendMessage: (receiverId: number, content: string, tempId?: string) => void;
  markAsRead: (messageId: number) => void;
  onNewMessage?: (callback: (message: Message) => void) => void;
  chatPanelOpen?: boolean;
}

const ChatTab: React.FC<ChatTabProps> = ({
  user,
  isMinimized,
  position,
  onClose,
  onToggleMinimize,
  token,
  sendMessage,
  markAsRead,
  onNewMessage,
  chatPanelOpen = false
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [canChat, setCanChat] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastMessageIdRef = useRef<number>(0);
  const isFirstLoadRef = useRef(true);
  const shouldScrollRef = useRef(true);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const currentUserIdRef = useRef<number | null>(null);

  // Récupérer l'ID de l'utilisateur actuel depuis le token
  useEffect(() => {
    if (token) {
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          currentUserIdRef.current = payload.id;
        }
      } catch (error) {
        console.error('Failed to parse token:', error);
      }
    }
  }, [token]);

  // Fonction de scroll intelligent - ne scroll que si nécessaire
  const scrollToBottomIfNeeded = useCallback(() => {
    if (!messagesContainerRef.current || !shouldScrollRef.current) return;

    const container = messagesContainerRef.current;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;

    // Scroll seulement si l'utilisateur est près du bas ou si c'est le premier chargement
    if (isNearBottom || isFirstLoadRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: isFirstLoadRef.current ? 'auto' : 'smooth' });
      isFirstLoadRef.current = false;
    }
  }, []);

  // Détecter si l'utilisateur a scrollé manuellement vers le haut
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;

    const container = messagesContainerRef.current;
    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 50;
    shouldScrollRef.current = isAtBottom;
  }, []);

  // Charger les messages (optimisé)
  const loadMessages = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    try {
      // Timeout plus court pour éviter l'attente
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 secondes max

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/chat/messages/${user.id}?limit=50`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const newMessages = data.data.messages || [];

        setMessages(newMessages);

        // Mettre à jour la référence du dernier message
        if (newMessages.length > 0) {
          lastMessageIdRef.current = Math.max(...newMessages.map((m: Message) => m.id));
        }

        // Marquer les messages non lus comme lus (sans attendre)
        const unreadMessages = newMessages.filter((msg: Message) =>
          !msg.is_read && msg.sender_id === user.id
        );

        unreadMessages.forEach((msg: Message) => {
          markAsRead(msg.id);
        });
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Failed to load messages:', error);
      }
    } finally {
      setLoading(false);
    }
  }, [token, user.id, markAsRead]);

  // Gestionnaire de nouveaux messages DIRECT et SIMPLE
  const handleNewMessage = useCallback((message: Message) => {
    // Vérifier si le message concerne cette conversation
    const currentUserId = currentUserIdRef.current;
    if (!currentUserId) return;

    if ((message.sender_id === user.id && message.receiver_id === currentUserId) ||
        (message.sender_id === currentUserId && message.receiver_id === user.id)) {

      // AJOUT IMMÉDIAT du message - avec gestion des messages temporaires
      setMessages(prev => {
        // Si c'est un message de l'utilisateur actuel, remplacer le message temporaire
        if (message.sender_id === currentUserId) {
          // Chercher et remplacer le message temporaire le plus récent avec le même contenu
          const tempMessageIndex = prev.findIndex(m =>
            m.sender_id === currentUserId &&
            m.content === message.content &&
            m.id > 1000000000000 // ID temporaire (timestamp)
          );

          if (tempMessageIndex !== -1) {
            // Remplacer le message temporaire par le vrai message
            const newMessages = [...prev];
            newMessages[tempMessageIndex] = message;
            return newMessages.sort((a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime());
          }
        }

        // Éviter les doublons en vérifiant l'ID
        const exists = prev.some(m => m.id === message.id);
        if (exists) return prev;

        const newMessages = [...prev, message];
        lastMessageIdRef.current = Math.max(lastMessageIdRef.current, message.id);
        return newMessages.sort((a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime());
      });

      // Scroll immédiat
      setTimeout(() => scrollToBottomIfNeeded(), 0);

      // Marquer comme lu si nécessaire
      if (!isMinimized && message.sender_id === user.id && !message.is_read) {
        setTimeout(() => markAsRead(message.id), 0);
      }
    }
  }, [user.id, markAsRead, scrollToBottomIfNeeded, isMinimized]);

  // Enregistrer le callback IMMÉDIATEMENT
  useEffect(() => {
    if (onNewMessage) {
      onNewMessage(handleNewMessage);
    }
  }, [onNewMessage, handleNewMessage]);

  // Vérifier si on peut chatter (optimisé avec cache)
  const checkCanChat = useCallback(async () => {
    if (!token) return;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/chat/can-chat/${user.id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        setCanChat(data.data.can_chat);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Failed to check chat permission:', error);
      }
    }
  }, [token, user.id]);

  // Envoyer un message avec message temporaire
  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || sending || !canChat || !currentUserIdRef.current) return;

    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const messageContent = newMessage.trim();
    const currentUserId = currentUserIdRef.current;

    // Créer un message temporaire pour l'affichage immédiat
    const tempMessage: Message = {
      id: Date.now(), // ID temporaire
      content: messageContent,
      sent_at: new Date().toISOString(),
      sender_id: currentUserId,
      receiver_id: user.id,
      is_read: false
    };

    setNewMessage('');
    setSending(true);

    // Ajouter le message temporaire immédiatement
    setMessages(prev => {
      const newMessages = [...prev, tempMessage];
      return newMessages.sort((a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime());
    });

    // Scroll immédiat
    setTimeout(() => scrollToBottomIfNeeded(), 0);

    try {
      // Envoyer via Socket.IO
      sendMessage(user.id, messageContent, tempId);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Retirer le message temporaire en cas d'erreur
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
      setNewMessage(messageContent); // Remettre le message dans l'input
    } finally {
      setSending(false);
    }
  }, [newMessage, sending, canChat, user.id, sendMessage, scrollToBottomIfNeeded]);

  // Gérer l'envoi avec Enter
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Focus sur l'input quand l'onglet est ouvert
  useEffect(() => {
    if (!isMinimized && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isMinimized]);

  // Charger les données initiales
  useEffect(() => {
    if (!isMinimized) {
      loadMessages();
      checkCanChat();
    }
  }, [loadMessages, checkCanChat, isMinimized]);

  // Scroll initial et pour les nouveaux messages
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottomIfNeeded();
    }
  }, [messages.length, scrollToBottomIfNeeded]);

  // PAS DE POLLING - 100% temps réel via Socket.IO uniquement

  const getFullImageUrl = (url: string): string => {
    if (!url) return '/placeholder-image.svg';
    if (url.startsWith('http')) return url;
    return `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${url}`;
  };

  const formatMessageTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // CORRECTION CRITIQUE : cette fonction était inversée !
  const isMyMessage = (message: Message): boolean => {
    return message.sender_id === currentUserIdRef.current;
  };

  // Calculer la position en fonction de l'état du panel de chat
  const getTabPosition = () => {
    const baseOffset = chatPanelOpen ? 420 : 80; // Décalage selon l'état du panel
    return baseOffset + (position * 300); // 300px par onglet
  };

  return (
    <div
      className={`chat-tab ${isMinimized ? 'minimized' : ''}`}
      style={{
        right: `${getTabPosition()}px`,
        zIndex: 1000 + position
      }}
    >
      {/* Header */}
      <div className="chat-tab-header" onClick={onToggleMinimize}>
        <div className="tab-user-info">
          <img
            src={getFullImageUrl(user.profile_picture_url)}
            alt={user.firstname}
            className="tab-avatar"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder-image.svg';
            }}
          />
          <div className="tab-user-details">
            <h4>{user.firstname} {user.lastname}</h4>
            <span className={`status ${user.is_online ? 'online' : 'offline'}`}>
              {user.is_online ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>

        <div className="tab-controls">
          <button
            className="minimize-btn"
            onClick={(e) => {
              e.stopPropagation();
              onToggleMinimize();
            }}
            title={isMinimized ? 'Maximize' : 'Minimize'}
          >
            {isMinimized ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M18 15l-6-6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
          <button
            className="close-btn"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            title="Close"
          >
            ×
          </button>
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <div className="chat-tab-content">
          {!canChat ? (
            <div className="chat-disabled">
              <div className="disabled-icon">🚫</div>
              <p>You can only chat with users you've matched with.</p>
            </div>
          ) : (
            <>
              {/* Messages */}
              <div
                className="messages-container"
                ref={messagesContainerRef}
                onScroll={handleScroll}
              >
                {loading && messages.length === 0 ? (
                  <div className="loading-messages">
                    <div className="loading-spinner"></div>
                    <p>Loading...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="empty-messages">
                    <div className="empty-icon">💬</div>
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  <div className="messages-list">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`message ${isMyMessage(message) ? 'my-message' : 'their-message'}`}
                      >
                        <div className="message-bubble">
                          {message.content}
                        </div>
                        <div className="message-time">
                          {formatMessageTime(message.sent_at)}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="message-input-container">
                <div className="message-input-wrapper">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    disabled={sending || !canChat}
                  />
                  <button
                    className="send-btn"
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sending || !canChat}
                  >
                    {sending ? (
                      <div className="sending-spinner"></div>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatTab;
