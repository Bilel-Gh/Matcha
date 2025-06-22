import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useChatSocket } from '../../hooks/useChatSocket';
import ConversationsList from './ConversationsList';
import ChatTab from './ChatTab';
import './ChatWidget.css';

interface Conversation {
  user: {
    id: number;
    username: string;
    firstname: string;
    lastname: string;
    profile_picture_url: string;
    is_online: boolean;
    last_connection?: string;
  };
  last_message?: {
    id: number;
    content: string;
    sent_at: string;
    sender_id: number;
  };
  unread_count: number;
}

interface OpenTab {
  userId: number;
  user: Conversation['user'];
  isMinimized: boolean;
}

const ChatWidget: React.FC = () => {
  const { token, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [openTabs, setOpenTabs] = useState<OpenTab[]>([]);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const widgetRef = useRef<HTMLDivElement>(null);

  // Charger les conversations
  const loadConversations = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/chat/conversations`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setConversations(data.data.conversations || []);
        setTotalUnreadCount(data.data.total_unread || 0);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Charger le nombre total de messages non lus
  const loadUnreadCount = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/chat/unread-count`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTotalUnreadCount(data.data.unread_count || 0);
      }
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  }, [token]);

  // Gestionnaires Socket.IO stables
  const handleNewMessage = useCallback((message: any) => {
    // Mettre à jour les conversations
    loadConversations();

    // Ouvrir l'onglet si la conversation était ouverte
    setOpenTabs(prev => {
      const existingTab = prev.find(tab => tab.userId === message.sender_id);
      if (existingTab && existingTab.isMinimized) {
        return prev.map(tab =>
          tab.userId === message.sender_id
            ? { ...tab, isMinimized: false }
            : tab
        );
      }
      return prev;
    });

    // Son de notification désactivé
  }, [loadConversations]);

  const handleMessageRead = useCallback((data: any) => {
    loadConversations();
  }, [loadConversations]);

  const handleUserOnline = useCallback((userId: number) => {
    setConversations(prev => prev.map(conv =>
      conv.user.id === userId
        ? { ...conv, user: { ...conv.user, is_online: true } }
        : conv
    ));

    setOpenTabs(prev => prev.map(tab =>
      tab.userId === userId
        ? { ...tab, user: { ...tab.user, is_online: true } }
        : tab
    ));
  }, []);

  const handleUserOffline = useCallback((userId: number) => {
    setConversations(prev => prev.map(conv =>
      conv.user.id === userId
        ? { ...conv, user: { ...conv.user, is_online: false } }
        : conv
    ));

    setOpenTabs(prev => prev.map(tab =>
      tab.userId === userId
        ? { ...tab, user: { ...tab.user, is_online: false } }
        : tab
    ));
  }, []);

  // Socket.IO hook avec callbacks stables
  const {
    isConnected,
    sendMessage,
    markAsRead,
    markAllAsRead
  } = useChatSocket(token, {
    onNewMessage: handleNewMessage,
    onMessageRead: handleMessageRead,
    onUserOnline: handleUserOnline,
    onUserOffline: handleUserOffline
  });

  // Ouvrir une conversation
  const openConversation = (conversation: Conversation) => {
    const existingTab = openTabs.find(tab => tab.userId === conversation.user.id);

    if (existingTab) {
      // Si l'onglet existe, le dé-minimiser
      setOpenTabs(prev => prev.map(tab =>
        tab.userId === conversation.user.id
          ? { ...tab, isMinimized: false }
          : tab
      ));
    } else {
      // Créer un nouvel onglet
      const newTab: OpenTab = {
        userId: conversation.user.id,
        user: conversation.user,
        isMinimized: false
      };

      setOpenTabs(prev => {
        // Limiter à 3 onglets max
        const newTabs = [...prev, newTab];
        if (newTabs.length > 3) {
          return newTabs.slice(-3);
        }
        return newTabs;
      });
    }

    // Marquer comme lu si il y a des messages non lus
    if (conversation.unread_count > 0) {
      markAllAsRead(conversation.user.id);
    }
  };

  // Fermer un onglet
  const closeTab = (userId: number) => {
    setOpenTabs(prev => prev.filter(tab => tab.userId !== userId));
    saveTabsToStorage(openTabs.filter(tab => tab.userId !== userId));
  };

  // Minimiser/maximiser un onglet
  const toggleMinimizeTab = (userId: number) => {
    setOpenTabs(prev => prev.map(tab =>
      tab.userId === userId
        ? { ...tab, isMinimized: !tab.isMinimized }
        : tab
    ));
  };

  // Sauvegarder l'état des onglets
  const saveTabsToStorage = (tabs: OpenTab[]) => {
    localStorage.setItem('chatTabs', JSON.stringify(tabs));
  };

  // Charger l'état des onglets
  const loadTabsFromStorage = () => {
    try {
      const saved = localStorage.getItem('chatTabs');
      if (saved) {
        const tabs = JSON.parse(saved);
        setOpenTabs(tabs);
      }
    } catch (error) {
      console.error('Failed to load tabs from storage:', error);
    }
  };

  // Son de notification désactivé
  // const playNotificationSound = () => {
  //   try {
  //     const audio = new Audio('/notification.mp3');
  //     audio.volume = 0.3;
  //     audio.play().catch(() => {
  //       // Ignore si le son ne peut pas être joué
  //     });
  //   } catch (error) {
  //     // Ignore les erreurs de son
  //   }
  // };

  // Filtrer les conversations
  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      conv.user.firstname.toLowerCase().includes(query) ||
      conv.user.lastname.toLowerCase().includes(query) ||
      conv.user.username.toLowerCase().includes(query)
    );
  });

  // Gérer les clics à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Charger les données initiales
  useEffect(() => {
    if (token && user) {
      loadConversations();
      loadUnreadCount();
      loadTabsFromStorage();
    }
  }, [token, user, loadConversations, loadUnreadCount]);

  // Sauvegarder les onglets quand ils changent
  useEffect(() => {
    saveTabsToStorage(openTabs);
  }, [openTabs]);

  // Ne pas afficher sur les pages d'auth
  const currentPath = window.location.pathname;
  if (currentPath.includes('/login') ||
      currentPath.includes('/register') ||
      currentPath.includes('/forgot-password') ||
      currentPath.includes('/reset-password') ||
      currentPath.includes('/verify')) {
    return null;
  }

  if (!token || !user) {
    return null;
  }

  return (
    <>
      {/* Onglets de conversation */}
      <div className="chat-tabs-container">
        {openTabs.map((tab, index) => (
          <ChatTab
            key={tab.userId}
            user={tab.user}
            isMinimized={tab.isMinimized}
            position={index}
            onClose={() => closeTab(tab.userId)}
            onToggleMinimize={() => toggleMinimizeTab(tab.userId)}
            token={token}
            sendMessage={sendMessage}
            markAsRead={markAsRead}
          />
        ))}
      </div>

      {/* Widget principal */}
      <div className="chat-widget" ref={widgetRef}>
        {isOpen && (
          <div className="chat-widget-panel">
            <ConversationsList
              conversations={filteredConversations}
              loading={loading}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onConversationClick={openConversation}
              onClose={() => setIsOpen(false)}
              onRefresh={loadConversations}
            />
          </div>
        )}

        {/* Bouton principal */}
        <button
          className={`chat-widget-button ${isOpen ? 'open' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
          title="Messages"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"
              fill="currentColor"
            />
          </svg>

          {totalUnreadCount > 0 && (
            <span className="chat-widget-badge">
              {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
            </span>
          )}
        </button>
      </div>
    </>
  );
};

export default ChatWidget;
