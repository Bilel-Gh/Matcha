import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useChatSocket } from '../../hooks/useChatSocket';
import ChatTab from './ChatTab';
import ConversationsList from './ConversationsList';
import './ChatWidget.css';
import { showToastError } from '../../utils/toastUtils';

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

  // Référence pour stocker les callbacks des nouveaux messages par onglet
  const messageCallbacksRef = useRef<Map<number, (message: any) => void>>(new Map());

  // Charger les conversations (optimisé)
  const loadConversations = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    try {
      // Timeout plus court pour éviter l'attente
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/chat/conversations`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        setConversations(data.data.conversations || []);
        setTotalUnreadCount(data.data.total_unread || 0);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        showToastError('Failed to load conversations', error);
      }
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
      showToastError('Failed to load unread count', error);
    }
  }, [token]);

  // Gestionnaires Socket.IO ULTRA RAPIDES
  const handleNewMessage = useCallback((message: any) => {
    // APPEL IMMÉDIAT des callbacks - pas de logs pour plus de vitesse
    messageCallbacksRef.current.forEach((callback) => {
      callback(message);
    });

    // Mettre à jour les conversations de manière optimisée
    setConversations(prev => {
      const updatedConversations = prev.map(conv => {
        if (conv.user.id === message.sender_id || conv.user.id === message.receiver_id) {
          return {
            ...conv,
            last_message: {
              id: message.id,
              content: message.content,
              sent_at: message.sent_at,
              sender_id: message.sender_id
            },
            unread_count: conv.user.id === message.sender_id ? conv.unread_count + 1 : conv.unread_count
          };
        }
        return conv;
      });

      // Si la conversation n'existe pas encore, la charger immédiatement
      const conversationExists = prev.some(conv =>
        conv.user.id === message.sender_id || conv.user.id === message.receiver_id
      );

      if (!conversationExists) {
        // Charger les conversations immédiatement
        loadConversations();
      }

      return updatedConversations;
    });

    // Ouvrir l'onglet si la conversation était ouverte mais minimisée
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
  }, [loadConversations]);

  const handleMessageRead = useCallback((data: any) => {
    // Mettre à jour de manière optimisée sans recharger toutes les conversations
    setConversations(prev => prev.map(conv => {
      if (conv.last_message?.id === data.messageId) {
        return {
          ...conv,
          unread_count: Math.max(0, conv.unread_count - 1)
        };
      }
      return conv;
    }));
  }, []);

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
    onUserOffline: handleUserOffline,
    onError: (error) => {
      showToastError('Chat error', error);
    }
  });

  // Ouvrir une conversation par ID utilisateur (pour les notifications)
  const openConversationByUserId = useCallback(async (userId: number) => {
    if (!token) return;

    try {
      // Chercher d'abord dans les conversations existantes
      const existingConversation = conversations.find(conv => conv.user.id === userId);

      if (existingConversation) {
        openConversation(existingConversation);
        return;
      }

      // Si pas trouvé, charger les informations de l'utilisateur
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/chat/partner/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const userInfo = data.data.user;

        // Créer une conversation temporaire
        const tempConversation: Conversation = {
          user: userInfo,
          unread_count: 0
        };

        openConversation(tempConversation);

        // Recharger les conversations pour mettre à jour
        loadConversations();
      }
    } catch (error) {
      showToastError('Failed to open conversation', error);
    }
  }, [token, conversations, loadConversations]);

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
    // Retirer le callback pour cet onglet
    messageCallbacksRef.current.delete(userId);
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
      showToastError('Failed to load tabs from storage', error);
    }
  };

  // Fonction pour enregistrer un callback de message pour un onglet spécifique
  const registerMessageCallback = useCallback((userId: number, callback: (message: any) => void) => {
    messageCallbacksRef.current.set(userId, callback);
  }, []);

  // Fonction pour vérifier si une conversation est ouverte
  const isConversationOpen = useCallback((userId: number) => {
    const hasOpenTab = openTabs.some(tab => tab.userId === userId && !tab.isMinimized);
    return hasOpenTab;
  }, [openTabs]);

  // Exposer la fonction globalement pour useNotifications
  useEffect(() => {
    (window as any).isConversationOpen = isConversationOpen;
    (window as any).openChatWithUser = openConversationByUserId;

    return () => {
      delete (window as any).isConversationOpen;
      delete (window as any).openChatWithUser;
    };
  }, [isConversationOpen, openConversationByUserId]);

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

  // Fermer le widget quand on clique à l'extérieur
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

  // PAS DE POLLING - 100% temps réel via Socket.IO

  // Filtrer les conversations selon la recherche
  const filteredConversations = conversations.filter(conv =>
    conv.user.firstname.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.user.lastname.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!token || !user) {
    return null;
  }

  return (
    <div className="chat-tabs-container" ref={widgetRef}>
      {/* Onglets de chat - position ajustée selon l'état du panel */}
      {openTabs.map((tab, index) => (
        <ChatTab
          key={tab.userId}
          user={tab.user}
          isMinimized={tab.isMinimized}
          position={index}
          onClose={() => closeTab(tab.userId)}
          onToggleMinimize={() => toggleMinimizeTab(tab.userId)}
          token={token!}
          sendMessage={sendMessage}
          markAsRead={markAsRead}
          onNewMessage={(callback) => {
            // Enregistrement IMMÉDIAT du callback avec la bonne interface
            registerMessageCallback(tab.userId, callback);
          }}
          chatPanelOpen={isOpen}
        />
      ))}

      {/* Widget de chat */}
      <div className="chat-widget" ref={widgetRef}>
        <button
          className={`chat-widget-button ${isOpen ? 'open' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
        >
          💬
          {totalUnreadCount > 0 && (
            <span className="chat-widget-badge">
              {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
            </span>
          )}
        </button>

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
      </div>
    </div>
  );
};

export default ChatWidget;
