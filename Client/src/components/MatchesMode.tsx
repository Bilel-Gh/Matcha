import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface MatchUser {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  age: number;
  profile_picture_url: string;
  fame_rating: number;
  is_online: boolean;
  last_connection?: string;
  match_date?: string;
  created_at?: string;
}

interface ActivityUser {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  age?: number;
  birth_date?: string;
  profile_picture_url: string;
  fame_rating: number;
  is_online?: boolean;
  created_at?: string;
  visited_at?: string;
  visit_count?: number;
}

interface MatchesModeProps {
  onShowMessage?: (message: string, type: 'success' | 'error') => void;
  onMatchCountChange?: (count: number) => void;
  onUserUnliked?: (userId: number, wasMatch: boolean) => void;
}

const MatchesMode: React.FC<MatchesModeProps> = ({ onShowMessage, onMatchCountChange, onUserUnliked }) => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<'matches' | 'likes-given' | 'likes-received' | 'activity'>('matches');
  const [matches, setMatches] = useState<MatchUser[]>([]);
  const [likesGiven, setLikesGiven] = useState<MatchUser[]>([]);
  const [likesReceived, setLikesReceived] = useState<MatchUser[]>([]);
  const [visitsReceived, setVisitsReceived] = useState<ActivityUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [token]);

  const loadData = async () => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const [matchesRes, likesGivenRes, likesReceivedRes, visitsRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/interactions/matches`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/interactions/likes-given`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/interactions/likes-received`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/interactions/visits-received`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (matchesRes.ok) {
        const matchesData = await matchesRes.json();
        const matchesArray = matchesData.data?.matches || [];
        setMatches(matchesArray);

        // Update parent match count
        if (onMatchCountChange) {
          onMatchCountChange(matchesArray.length);
        }
      }

      if (likesGivenRes.ok) {
        const likesGivenData = await likesGivenRes.json();
        setLikesGiven(likesGivenData.data?.likes || []);
      }

      if (likesReceivedRes.ok) {
        const likesReceivedData = await likesReceivedRes.json();
        setLikesReceived(likesReceivedData.data?.likes || []);
      }

      if (visitsRes.ok) {
        const visitsData = await visitsRes.json();
        setVisitsReceived(visitsData.data?.visits || []);
      }
    } catch (error) {
      setError('Failed to load data');
      if (onShowMessage) {
        onShowMessage('Failed to load matches and likes', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = (user: MatchUser | ActivityUser) => {
    // Navigate to user profile page - visit will be recorded there
    window.location.href = `/user/${user.id}`;
  };

  const handleLikeBack = async (user: ActivityUser | MatchUser) => {
    if (!token) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/interactions/like/${user.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        if (data.data?.match) {
          if (onShowMessage) {
            onShowMessage(`🎉 It's a match with ${user.firstname}!`, 'success');
          }
          // Reload data to update matches count
          loadData();
        } else {
          if (onShowMessage) {
            onShowMessage(`❤️ You liked ${user.firstname}!`, 'success');
          }
        }
      } else {
        // Handle specific error cases
        if (response.status === 409) {
          // Like already exists - this means it's already a match or you already liked them
          if (onShowMessage) {
            onShowMessage(`💝 You and ${user.firstname} are already connected!`, 'success');
          }
          // Reload data to update the UI state
          loadData();
        } else {
          if (onShowMessage) {
            onShowMessage(data.message || 'Failed to like user', 'error');
          }
        }
      }
    } catch (error) {
      if (onShowMessage) {
        onShowMessage('Network error. Failed to like user', 'error');
      }
    }
  };

  const handleUnlike = async (user: MatchUser) => {
    if (!token) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/interactions/like/${user.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Check if this user was also in matches before removing
        const wasMatch = matches.some(match => match.id === user.id);

        // Remove user from likes-given list immediately
        setLikesGiven(prev => prev.filter(u => u.id !== user.id));

        // If they were a match, also remove from matches
        if (wasMatch) {
          setMatches(prev => {
            const newMatches = prev.filter(match => match.id !== user.id);
            // Update parent match count
            if (onMatchCountChange) {
              onMatchCountChange(newMatches.length);
            }
            return newMatches;
          });
        }

        // Notify parent about the unlike action
        if (onUserUnliked) {
          onUserUnliked(user.id, wasMatch);
        }

        if (onShowMessage) {
          onShowMessage(`You unliked ${user.firstname}`, 'success');
        }
      } else {
        const data = await response.json();
        if (onShowMessage) {
          onShowMessage(data.message || 'Failed to unlike user', 'error');
        }
      }
    } catch (error) {
      if (onShowMessage) {
        onShowMessage('Network error. Failed to unlike user', 'error');
      }
    }
  };

  const getFullImageUrl = (url: string): string => {
    if (!url) return '/placeholder-image.svg';
    if (url.startsWith('http')) return url;
    return `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${url}`;
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
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

  const getCurrentData = () => {
    switch (activeTab) {
      case 'matches':
        return matches;
      case 'likes-given':
        return likesGiven;
      case 'likes-received':
        return likesReceived;
      case 'activity':
        return visitsReceived;
      default:
        return [];
    }
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'matches':
        return 'Mutual Matches';
      case 'likes-given':
        return 'People You Liked';
      case 'likes-received':
        return 'People Who Liked You';
      case 'activity':
        return 'Profile Visits';
      default:
        return '';
    }
  };

  const getTabDescription = () => {
    switch (activeTab) {
      case 'matches':
        return 'You both liked each other - start a conversation!';
      case 'likes-given':
        return 'Users you have liked - waiting for them to like you back';
      case 'likes-received':
        return 'Users who liked you - like them back to create a match!';
      case 'activity':
        return 'People who have visited your profile recently';
      default:
        return '';
    }
  };

  const currentData = getCurrentData();

  return (
    <div className="matches-mode">
      <div className="matches-header">
        <h2>Your Connections</h2>
        <p>Manage your likes and matches</p>
      </div>

      {/* Tabs */}
      <div className="matches-tabs">
        <button
          className={`tab-btn ${activeTab === 'matches' ? 'active' : ''}`}
          onClick={() => setActiveTab('matches')}
        >
          💝 Matches ({matches.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'likes-given' ? 'active' : ''}`}
          onClick={() => setActiveTab('likes-given')}
        >
          ❤️ Sent ({likesGiven.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'likes-received' ? 'active' : ''}`}
          onClick={() => setActiveTab('likes-received')}
        >
          💖 Received ({likesReceived.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'activity' ? 'active' : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          👁️ Activity ({visitsReceived.length})
        </button>
      </div>

      {/* Content */}
      <div className="matches-content">
        <div className="tab-info">
          <h3>{getTabTitle()}</h3>
          <p>{getTabDescription()}</p>
        </div>

        {loading && (
          <div className="matches-loading">
            <p>Loading...</p>
          </div>
        )}

        {error && (
          <div className="matches-error">
            <p>{error}</p>
            <button onClick={loadData} className="retry-btn">
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && currentData.length === 0 && (
          <div className="matches-empty">
            <div className="empty-icon">
              {activeTab === 'matches' && '💔'}
              {activeTab === 'likes-given' && '💌'}
              {activeTab === 'likes-received' && '👀'}
              {activeTab === 'activity' && '👁️'}
            </div>
            <h4>
              {activeTab === 'matches' && 'No matches yet'}
              {activeTab === 'likes-given' && 'No likes sent yet'}
              {activeTab === 'likes-received' && 'No likes received yet'}
              {activeTab === 'activity' && 'No profile visits yet'}
            </h4>
            <p>
              {activeTab === 'matches' && 'Keep swiping to find your perfect match!'}
              {activeTab === 'likes-given' && 'Start browsing and like people you find interesting'}
              {activeTab === 'likes-received' && 'Complete your profile to attract more likes'}
              {activeTab === 'activity' && 'Be more active to get more profile views!'}
            </p>
          </div>
        )}

        {!loading && !error && currentData.length > 0 && (
          <div className="matches-grid">
            {currentData.map((user) => {
              const isActivityUser = activeTab === 'activity';
              const activityUser = user as ActivityUser;
              const matchUser = user as MatchUser;

              return (
                <div key={user.id} className="match-card">
                  <div className="match-image" onClick={() => handleViewProfile(isActivityUser ? activityUser : matchUser)}>
                    <img
                      src={getFullImageUrl(user.profile_picture_url)}
                      alt={user.firstname}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-image.svg';
                      }}
                    />
                    <div className="match-overlay">
                      <div className="online-status">
                        {user.is_online ? '🟢' : '⚫'}
                      </div>
                      {activeTab === 'matches' && (
                        <div className="match-badge">💝 MATCH</div>
                      )}
                      {activeTab === 'activity' && (
                        <div className="activity-type">👁️</div>
                      )}
                    </div>
                  </div>

                  <div className="match-info">
                    <div className="match-header">
                      <h4>
                        {user.firstname}, {isActivityUser ? calculateAge(activityUser.birth_date) : matchUser.age}
                      </h4>
                      <div className="fame-badge">⭐ {user.fame_rating}</div>
                    </div>

                    <div className="match-status">
                      {user.is_online ? (
                        <span className="online">🟢 Online now</span>
                      ) : (
                        <span className="offline">Last seen {formatDate(matchUser.last_connection)}</span>
                      )}
                    </div>

                    <div className="match-date">
                      {activeTab === 'matches' && matchUser.match_date && (
                        <span>Matched {formatDate(matchUser.match_date)}</span>
                      )}
                      {activeTab === 'likes-given' && matchUser.created_at && (
                        <span>Liked {formatDate(matchUser.created_at)}</span>
                      )}
                      {activeTab === 'likes-received' && matchUser.created_at && (
                        <span>Liked you {formatDate(matchUser.created_at)}</span>
                      )}
                      {activeTab === 'activity' && activityUser.visited_at && (
                        <span>Visited {formatDate(activityUser.visited_at)}</span>
                      )}
                    </div>

                    {activeTab === 'activity' && activityUser.visit_count && activityUser.visit_count > 1 && (
                      <div className="visit-count">
                        Visited {activityUser.visit_count} times
                      </div>
                    )}
                  </div>

                  <div className="match-actions">
                    <button
                      className="action-btn view-btn"
                      onClick={() => handleViewProfile(isActivityUser ? activityUser : matchUser)}
                    >
                      👁️ View Profile
                    </button>
                    {activeTab === 'matches' && (
                      <button className="action-btn message-btn">
                        💬 Message
                      </button>
                    )}
                    {activeTab === 'likes-given' && (
                      <button
                        className="action-btn unlike-btn"
                        onClick={() => handleUnlike(matchUser)}
                      >
                        💔 Unlike
                      </button>
                    )}
                    {activeTab === 'likes-received' && (
                      <button
                        className="action-btn like-btn"
                        onClick={() => handleLikeBack(matchUser)}
                      >
                        {matches.some(match => match.id === matchUser.id) ? '💝 Already Matched' : '❤️ Like Back'}
                      </button>
                    )}
                    {activeTab === 'activity' && (
                      <button
                        className="action-btn like-btn"
                        onClick={() => handleLikeBack(activityUser)}
                      >
                        ❤️ Like Back
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="matches-footer">
        <button onClick={loadData} className="refresh-btn" disabled={loading}>
          {loading ? 'Refreshing...' : '🔄 Refresh'}
        </button>
      </div>
    </div>
  );
};

export default MatchesMode;
