import React from 'react';

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
}

interface Conversation {
  user: User;
  last_message?: Message;
  unread_count: number;
}

interface ConversationsListProps {
  conversations: Conversation[];
  loading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onConversationClick: (conversation: Conversation) => void;
  onClose: () => void;
  onRefresh: () => void;
}

const ConversationsList: React.FC<ConversationsListProps> = ({
  conversations,
  loading,
  searchQuery,
  onSearchChange,
  onConversationClick,
  onClose,
  onRefresh
}) => {
  const getFullImageUrl = (url: string): string => {
    if (!url) return '/placeholder-image.svg';
    if (url.startsWith('http')) return url;
    return `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${url}`;
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));

    if (diffHours < 1) return 'now';
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const truncateMessage = (message: string, maxLength: number = 50): string => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  return (
    <div className="conversations-list">
      {/* Header */}
      <div className="conversations-header">
        <h3>Messages</h3>
        <div className="header-actions">
          <button
            className="refresh-btn"
            onClick={onRefresh}
            title="Refresh"
            disabled={loading}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            className="close-btn"
            onClick={onClose}
            title="Close"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M6 6l12 12M6 18L18 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-container">
        <div className="search-input-wrapper">
          <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
            <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button
              className="clear-search-btn"
              onClick={() => onSearchChange('')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path
                  d="M6 6l12 12M6 18L18 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Conversations List */}
      <div className="conversations-content">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading conversations...</p>
          </div>
        ) : conversations.length === 0 ? (
          <div className="empty-state">
            {searchQuery ? (
              <>
                <div className="empty-icon">🔍</div>
                <h4>No conversations found</h4>
                <p>Try adjusting your search terms</p>
              </>
            ) : (
              <>
                <div className="empty-icon">💬</div>
                <h4>No conversations yet</h4>
                <p>Start chatting with your matches!</p>
              </>
            )}
          </div>
        ) : (
          <div className="conversations-scroll">
            {conversations.map((conversation) => (
              <div
                key={conversation.user.id}
                className={`conversation-item ${conversation.unread_count > 0 ? 'unread' : ''}`}
                onClick={() => onConversationClick(conversation)}
              >
                <div className="conversation-avatar">
                  <img
                    src={getFullImageUrl(conversation.user.profile_picture_url)}
                    alt={conversation.user.firstname}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder-image.svg';
                    }}
                  />
                  <div className={`online-indicator ${conversation.user.is_online ? 'online' : 'offline'}`}></div>
                </div>

                <div className="conversation-content">
                  <div className="conversation-header">
                    <h4 className="conversation-name">
                      {conversation.user.firstname} {conversation.user.lastname}
                    </h4>
                    {conversation.last_message && (
                      <span className="conversation-time">
                        {formatTimestamp(conversation.last_message.sent_at)}
                      </span>
                    )}
                  </div>

                  <div className="conversation-preview">
                    {conversation.last_message ? (
                      <p className="last-message">
                        {truncateMessage(conversation.last_message.content)}
                      </p>
                    ) : (
                      <p className="no-messages">Start a conversation</p>
                    )}

                    {conversation.unread_count > 0 && (
                      <span className="unread-badge">
                        {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationsList;
