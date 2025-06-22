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
}

const ChatTab: React.FC<ChatTabProps> = ({
  user,
  isMinimized,
  position,
  onClose,
  onToggleMinimize,
  token,
  sendMessage,
  markAsRead
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [canChat, setCanChat] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Charger les messages
  const loadMessages = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/chat/messages/${user.id}?limit=50`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMessages(data.data.messages || []);

        // Marquer les messages non lus comme lus
        const unreadMessages = data.data.messages?.filter((msg: Message) =>
          !msg.is_read && msg.sender_id === user.id
        ) || [];

        unreadMessages.forEach((msg: Message) => {
          markAsRead(msg.id);
        });
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  }, [token, user.id, markAsRead]);

  // Vérifier si on peut chatter
  const checkCanChat = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/chat/can-chat/${user.id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setCanChat(data.data.can_chat);
      }
    } catch (error) {
      console.error('Failed to check chat permission:', error);
    }
  }, [token, user.id]);

  // Envoyer un message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending || !canChat) return;

    const tempId = `temp_${Date.now()}`;
    const messageContent = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      // Ajouter le message temporairement à l'UI
      const tempMessage: Message = {
        id: Date.now(),
        content: messageContent,
        sent_at: new Date().toISOString(),
        sender_id: parseInt(token), // Assuming token contains user ID
        receiver_id: user.id,
        is_read: false
      };

      setMessages(prev => [...prev, tempMessage]);

      // Envoyer via Socket.IO
      sendMessage(user.id, messageContent, tempId);

      // Recharger les messages pour avoir la version définitive
      setTimeout(() => {
        loadMessages();
      }, 500);

    } catch (error) {
      console.error('Failed to send message:', error);
      // Retirer le message temporaire en cas d'erreur
      setMessages(prev => prev.filter(msg => msg.id !== Date.now()));
      setNewMessage(messageContent); // Remettre le message dans l'input
    } finally {
      setSending(false);
    }
  };

  // Gérer l'envoi avec Enter
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Scroll vers le bas quand de nouveaux messages arrivent
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Focus sur l'input quand l'onglet est ouvert
  useEffect(() => {
    if (!isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isMinimized]);

  // Charger les données initiales
  useEffect(() => {
    loadMessages();
    checkCanChat();
  }, [loadMessages, checkCanChat]);

  // Scroll vers le bas quand les messages changent
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  const isMyMessage = (message: Message): boolean => {
    // Assuming we can determine current user ID from token or context
    return message.sender_id !== user.id;
  };

  return (
    <div
      className={`chat-tab ${isMinimized ? 'minimized' : ''}`}
      style={{
        right: `${340 + (position * 320)}px`,
        bottom: '20px'
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
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <div className="chat-tab-content">
          {!canChat ? (
            <div className="chat-disabled">
              <div className="disabled-icon">🚫</div>
              <p>You can only chat with your matches</p>
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className="messages-container">
                {loading ? (
                  <div className="loading-messages">
                    <div className="loading-spinner"></div>
                    <p>Loading messages...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="empty-messages">
                    <div className="empty-icon">💬</div>
                    <p>No messages yet</p>
                    <p>Start the conversation!</p>
                  </div>
                ) : (
                  <div className="messages-list">
                    {messages.map((message, index) => {
                      const isMe = isMyMessage(message);
                      const showTime = index === 0 ||
                        new Date(message.sent_at).getTime() - new Date(messages[index - 1].sent_at).getTime() > 300000; // 5 minutes

                      return (
                        <div key={message.id} className={`message ${isMe ? 'my-message' : 'their-message'}`}>
                          {showTime && (
                            <div className="message-time">
                              {formatMessageTime(message.sent_at)}
                            </div>
                          )}
                          <div className="message-bubble">
                            {message.content}
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Input */}
              {canChat && (
                <div className="message-input-container">
                  <div className="message-input-wrapper">
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={sending}
                      maxLength={1000}
                    />
                    <button
                      className="send-btn"
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sending}
                      title="Send"
                    >
                      {sending ? (
                        <div className="sending-spinner"></div>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M2 21l21-9L2 3v7l15 2-15 2v7z"
                            fill="currentColor"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatTab;
