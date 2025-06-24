import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ReportUserModal from './ReportUserModal';
import BlockUserModal from './BlockUserModal';
import { User } from '../types/user';

interface LikeStatus {
  i_liked_them: boolean;
  they_liked_me: boolean;
  is_match: boolean;
}

interface GridModeProps {
  users: User[];
  onUsersUpdate: () => void;
  onShowMessage?: (message: string, type: 'success' | 'error') => void;
  onUserRemoved?: (userId: number) => void;
  onUserLiked?: (userId: number, isMatch: boolean) => void;
}

interface GridUserCardProps {
  user: User;
  onUserUpdate: () => void;
  onShowMessage: (message: string, type: 'success' | 'error') => void;
  onUserRemoved?: (userId: number) => void;
  onUserLiked?: (userId: number, isMatch: boolean) => void;
}

const GridUserCard: React.FC<GridUserCardProps> = ({ user, onUserUpdate, onShowMessage, onUserRemoved, onUserLiked }) => {
  const { token } = useAuth();
  const [likeStatus, setLikeStatus] = useState<LikeStatus | null>(null);
  const [isLiking, setIsLiking] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [localMessage, setLocalMessage] = useState<string | null>(null);
  const [localMessageType, setLocalMessageType] = useState<'success' | 'error' | null>(null);

  // Load like status on mount
  useEffect(() => {
    loadLikeStatus();
  }, [user.id]);

  const loadLikeStatus = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/interactions/like-status/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setLikeStatus(data.data || data);
      }
    } catch (error) {
      // Error is not critical for the UI, so we just fail silently.
    }
  };

  const handleLike = async () => {
    if (isLiking || !token) return;
    setIsLiking(true);

    try {
      if (likeStatus?.i_liked_them) {
        // Unlike
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/interactions/like/${user.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          setLikeStatus(prev => prev ? {
            ...prev,
            i_liked_them: false,
            is_match: false
          } : null);
          onShowMessage(`💔 You unliked ${user.firstname}`, 'success');
        }
      } else {
        // Like
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/interactions/like/${user.id}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();

        if (response.ok) {
          setLikeStatus(prev => prev ? {
            ...prev,
            i_liked_them: true,
            is_match: data.data?.match || false
          } : { i_liked_them: true, they_liked_me: false, is_match: data.data?.match || false });

          // Remove user from local list immediately
          if (onUserRemoved) {
            onUserRemoved(user.id);
          }

          // Notify parent about the like action
          if (onUserLiked) {
            onUserLiked(user.id, data.data?.match || false);
          }

          if (data.data?.match) {
            onShowMessage(`🎉 It's a match with ${user.firstname}!`, 'success');
          } else {
            onShowMessage(`❤️ You liked ${user.firstname}`, 'success');
          }
        }
      }
    } catch (error) {
      onShowMessage('❌ Failed to update like status', 'error');
    } finally {
      setIsLiking(false);
    }
  };

  const handleViewProfile = () => {
    // Navigate to user profile page - visit will be recorded there
    window.location.href = `/user/${user.id}`;
  };

  const handleBlock = async (reason?: string) => {
    if (isBlocking || !token) return;

    setIsBlocking(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/interactions/block/${user.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason: reason || 'Not interested'
        })
      });

      if (response.ok) {
        // Show global message instead of local for blocks
        onShowMessage(`🚫 ${user.firstname} has been blocked successfully`, 'success');

        // Remove user from local list immediately
        if (onUserRemoved) {
          onUserRemoved(user.id);
        }

        // No need to reload users since we removed locally
      } else {
        const data = await response.json();
        onShowMessage(`❌ ${data.message || 'Failed to block user'}`, 'error');
      }
    } catch (error) {
      onShowMessage('❌ Network error. Failed to block user', 'error');
    } finally {
      setIsBlocking(false);
      setShowBlockModal(false);
    }
  };

  const handleReport = async (reason: string) => {
    if (isReporting || !token) return;

    setIsReporting(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/interactions/report/${user.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });

      const data = await response.json();

      if (response.ok) {
        // Show global message instead of local for reports
        onShowMessage(`✅ ${user.firstname} has been reported successfully`, 'success');

        // Don't remove user from local list for reports - they should remain visible
        // Reports don't remove users from browsing, only blocks do

        // No need to reload users
      } else {
        onShowMessage(`❌ ${data.message || 'Failed to report user. Please try again.'}`, 'error');
      }
    } catch (error) {
      onShowMessage('❌ Network error. Please check your connection and try again.', 'error');
    } finally {
      setIsReporting(false);
      setShowReportModal(false);
    }
  };

  const getFullImageUrl = (url: string): string => {
    if (!url) return '/placeholder-image.svg';
    if (url.startsWith('http')) return url;
    return `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${url}`;
  };

  const age = calculateAge(user.birth_date || user.age);

  return (
    <>
      <div className="grid-user-card">
        {/* Local Message Notification */}
        {localMessage && (
          <div className={`card-local-message ${localMessageType === 'success' ? 'success' : 'error'}`}>
            {localMessage}
          </div>
        )}

        <div className="card-image" onClick={handleViewProfile}>
          <img
            src={getFullImageUrl(user.profile_picture_url)}
            alt={user.firstname}
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder-image.svg';
            }}
          />
          <div className="image-overlay">
            <div className="match-indicators">
              {likeStatus?.is_match && (
                <span className="match-badge">💝 MATCH</span>
              )}
              {likeStatus?.they_liked_me && !likeStatus?.is_match && (
                <span className="liked-badge">❤️ LIKES YOU</span>
              )}
            </div>
            <div className="online-status">
              {user.is_online ? '🟢' : '⚫'}
            </div>
          </div>
        </div>

        <div className="card-content">
          <div className="user-header">
            <h3>{user.firstname}{age && `, ${age}`}</h3>
            <div className="fame-badge">⭐ {user.fame_rating}</div>
          </div>

          <div className="user-details">
            <div className="detail-row">
              <span className="distance">📍 {user.city} • {user.distance_km}km away</span>
            </div>
            {(user.common_interests_count || user.common_interests) > 0 && (
              <div className="detail-row">
                <span className="interests">
                  ❤️ {user.common_interests_names && user.common_interests_names.length > 0
                    ? user.common_interests_names.slice(0, 2).join(', ') + (user.common_interests_names.length > 2 ? '...' : '')
                    : `${user.common_interests_count || user.common_interests} common interests`
                  }
                </span>
              </div>
            )}
            <div className="detail-row">
              <span className={user.is_online ? "online" : "offline"}>
                {user.is_online ? '🟢 Online now' : '⚫ Offline'}
              </span>
            </div>
          </div>

          <div className="user-bio">
            <p>{user.biography ? (user.biography.length > 120 ? user.biography.substring(0, 120) + '...' : user.biography) : 'No bio available'}</p>
          </div>
        </div>

        <div className="card-actions">
          <button
            className="action-btn view-btn"
            onClick={handleViewProfile}
          >
            👁️ View
          </button>
          <button
            className={`action-btn like-btn ${likeStatus?.i_liked_them ? 'liked' : ''}`}
            onClick={handleLike}
            disabled={isLiking}
          >
            {isLiking ? '...' : likeStatus?.i_liked_them ? '💖 Liked' : '❤️ Like'}
          </button>
          <div className="more-actions">
            <button
              className="action-btn block-btn"
              onClick={() => setShowBlockModal(true)}
              disabled={isBlocking}
              title="Block user"
            >
              {isBlocking ? '...' : '🚫'}
            </button>
            <button
              className="action-btn report-btn"
              onClick={() => setShowReportModal(true)}
              disabled={isReporting}
              title="Report user"
            >
              {isReporting ? '...' : '⚠️'}
            </button>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      <ReportUserModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onConfirm={handleReport}
        userName={user.firstname}
        isReporting={isReporting}
      />

      {/* Block Modal */}
      <BlockUserModal
        isOpen={showBlockModal}
        onClose={() => setShowBlockModal(false)}
        onConfirm={handleBlock}
        userName={user.firstname}
        isBlocking={isBlocking}
      />
    </>
  );
};

const GridMode: React.FC<GridModeProps> = ({ users, onUsersUpdate, onShowMessage, onUserRemoved, onUserLiked }) => {
  const [sortBy, setSortBy] = useState('distance');
  const [loading, setLoading] = useState(false);

  const handleShowMessage = (message: string, type: 'success' | 'error') => {
    if (onShowMessage) {
      onShowMessage(message, type);
    }
  };

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort);
    // TODO: Re-fetch users with new sort in future iteration
  };

  if (users.length === 0) {
    return (
      <div className="grid-empty-state">
        <h3>No users found</h3>
        <p>Try adjusting your filters to see more people</p>
        <button onClick={onUsersUpdate} className="reload-btn">
          Reload Users
        </button>
      </div>
    );
  }

  return (
    <div className="grid-mode">
      <div className="grid-controls">
        <div className="results-info">
          <span className="results-count">{users.length} people found</span>
        </div>

        <div className="sort-controls">
          <label>Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
            className="sort-select"
          >
            <option value="distance">📍 Distance</option>
            <option value="age">🎂 Age</option>
            <option value="fame_rating">⭐ Fame Rating</option>
            <option value="common_interests">❤️ Common Interests</option>
          </select>
        </div>
      </div>

      <div className="users-grid">
        {users.map(user => (
          <GridUserCard
            key={user.id}
            user={user}
            onUserUpdate={onUsersUpdate}
            onShowMessage={handleShowMessage}
            onUserRemoved={onUserRemoved}
            onUserLiked={onUserLiked}
          />
        ))}
      </div>

      {loading && (
        <div className="grid-loading">
          <p>Loading more users...</p>
        </div>
      )}
    </div>
  );
};

// Helper functions (same as SwipeMode)
const calculateAge = (birthDateOrAge?: string | number): string => {
  if (typeof birthDateOrAge === 'number') {
    return String(birthDateOrAge);
  }

  if (!birthDateOrAge) return '';

  const today = new Date();
  const birth = new Date(birthDateOrAge);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return String(age);
};



export default GridMode;
