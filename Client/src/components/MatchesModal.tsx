import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { showToastSuccess, showToastError } from '../utils/toastUtils';
import { User } from '../types/user';

interface MatchesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MatchCard: React.FC<{
  match: User;
  onStartChat: () => void;
  onViewProfile: () => void;
  onUnmatch: () => void;
}> = ({ match, onStartChat, onViewProfile, onUnmatch }) => {
  const formatMatchDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const calculateAge = (birthDate?: string): string => {
    if (!birthDate) return '';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return String(age);
  };

  const getFullImageUrl = (url: string): string => {
    if (!url) return '/placeholder-image.svg';
    if (url.startsWith('http')) return url;
    return `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${url}`;
  };

  return (
    <div className="match-card">
      <div className="match-image" onClick={onViewProfile}>
        <img
          src={getFullImageUrl(match.profile_picture_url)}
          alt={match.firstname}
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/placeholder-image.svg';
          }}
        />
        <div className="match-overlay">
          <div className="match-badge">💝 MATCH</div>
          <div className="online-status">
            {match.is_online ? '🟢' : '⚫'}
          </div>
        </div>
      </div>

      <div className="match-info">
        <h4>{match.firstname}, {calculateAge(match.birth_date)}</h4>
        <div className="match-stats">
          <span>⭐ {match.fame_rating}</span>
          <span>Matched {formatMatchDate(match.match_date || match.created_at || '')}</span>
        </div>
      </div>

      <div className="match-actions">
        <button className="chat-btn" onClick={onStartChat}>
          💬 Chat
        </button>
        <button className="view-btn" onClick={onViewProfile}>
          👁️ View
        </button>
        <button className="unmatch-btn" onClick={onUnmatch}>
          💔 Unmatch
        </button>
      </div>
    </div>
  );
};

const MatchesModal: React.FC<MatchesModalProps> = ({ isOpen, onClose }) => {
  const { token } = useAuth();
  const [matches, setMatches] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadMatches();
    }
  }, [isOpen]);

  const loadMatches = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/interactions/matches`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setMatches(data.data?.matches || data.matches || []);
    } catch (error) {
      showToastError('Failed to load matches', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = (matchId: number) => {
    // TODO: Implement chat functionality in future
    alert(`Starting chat with user ${matchId} (Chat feature coming soon)`);
  };

  const handleViewProfile = (match: User) => {
    // Navigate to user profile page - visit will be recorded there
    window.location.href = `/user/${match.id}`;
  };

  const handleUnmatch = async (match: User) => {
    const confirmed = window.confirm(`Are you sure you want to unmatch with ${match.firstname}? This action cannot be undone.`);
    if (!confirmed || !token) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/interactions/like/${match.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        showToastSuccess('Unmatched successfully');
        loadMatches(); // Reload matches
      } else {
        const data = await response.json();
        showToastError('Failed to unmatch user', data.message);
      }
    } catch (error) {
      showToastError('Failed to unmatch user', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="matches-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>💕 Your Matches</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="matches-content">
          {loading ? (
            <div className="loading-state">
              <p>Loading your matches...</p>
            </div>
          ) : matches.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">💔</div>
              <h3>No matches yet</h3>
              <p>Keep swiping to find your perfect match!</p>
              <button className="close-modal-btn" onClick={onClose}>
                Continue Browsing
              </button>
            </div>
          ) : (
            <>
              <div className="matches-header">
                <h4>{matches.length} matches found</h4>
                <p>These people liked you back!</p>
              </div>

              <div className="matches-grid">
                {matches.map(match => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    onStartChat={() => handleStartChat(match.id)}
                    onViewProfile={() => handleViewProfile(match)}
                    onUnmatch={() => handleUnmatch(match)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchesModal;
