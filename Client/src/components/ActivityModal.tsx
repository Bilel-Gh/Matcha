import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { showToastSuccess, showToastError } from '../utils/toastUtils';

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

interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ActivityCard: React.FC<{
  user: ActivityUser;
  type: 'like' | 'visit';
  timestamp: string;
  visitCount?: number;
  onAction?: () => void;
  onViewProfile: () => void;
  actionLabel?: string;
}> = ({ user, type, timestamp, visitCount, onAction, onViewProfile, actionLabel }) => {
  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));

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

  const getFullImageUrl = (url: string): string => {
    if (!url) return '/placeholder-image.svg';
    if (url.startsWith('http')) return url;
    return `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${url}`;
  };

  return (
    <div className="activity-card">
      <div className="activity-image" onClick={onViewProfile}>
        <img
          src={getFullImageUrl(user.profile_picture_url)}
          alt={user.firstname}
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/placeholder-image.svg';
          }}
        />
        <div className="activity-overlay">
          <div className="activity-type">
            {type === 'like' ? '❤️' : '👁️'}
          </div>
        </div>
      </div>

      <div className="activity-info">
        <h4>{user.firstname}, {calculateAge(user.birth_date)}</h4>
        <div className="activity-details">
          <span>⭐ {user.fame_rating}</span>
          <span>{formatTimestamp(timestamp)}</span>
        </div>
        {type === 'visit' && visitCount && visitCount > 1 && (
          <div className="visit-count">
            Visited {visitCount} times
          </div>
        )}
      </div>

      <div className="activity-actions">
        <button className="view-profile-btn" onClick={onViewProfile}>
          👁️ View
        </button>
        {onAction && actionLabel && (
          <button className="action-btn" onClick={onAction}>
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
};

const LikesReceivedList: React.FC<{
  likes: ActivityUser[];
  onLikeBack: (user: ActivityUser) => void;
  onViewProfile: (user: ActivityUser) => void;
}> = ({ likes, onLikeBack, onViewProfile }) => {
  if (likes.length === 0) {
    return (
      <div className="empty-activity">
        <div className="empty-icon">❤️</div>
        <h3>No likes yet</h3>
        <p>Keep improving your profile to get more likes!</p>
      </div>
    );
  }

  return (
    <div className="activity-grid">
      {likes.map(like => (
        <ActivityCard
          key={like.id}
          user={like}
          type="like"
          timestamp={like.created_at || ''}
          onAction={() => onLikeBack(like)}
          onViewProfile={() => onViewProfile(like)}
          actionLabel="❤️ Like Back"
        />
      ))}
    </div>
  );
};

const VisitsReceivedList: React.FC<{
  visits: ActivityUser[];
  onViewProfile: (user: ActivityUser) => void;
}> = ({ visits, onViewProfile }) => {
  if (visits.length === 0) {
    return (
      <div className="empty-activity">
        <div className="empty-icon">👁️</div>
        <h3>No profile visits yet</h3>
        <p>Be more active to get more profile views!</p>
      </div>
    );
  }

  return (
    <div className="activity-grid">
      {visits.map(visit => (
        <ActivityCard
          key={`${visit.id}-${visit.visited_at}`}
          user={visit}
          type="visit"
          timestamp={visit.visited_at || visit.created_at || ''}
          visitCount={visit.visit_count}
          onViewProfile={() => onViewProfile(visit)}
          actionLabel="👁️ View Profile"
        />
      ))}
    </div>
  );
};

const ActivityModal: React.FC<ActivityModalProps> = ({ isOpen, onClose }) => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('likes');
  const [likesReceived, setLikesReceived] = useState<ActivityUser[]>([]);
  const [visitsReceived, setVisitsReceived] = useState<ActivityUser[]>([]);
  const [loading, setLoading] = useState(false);

  const tabs = [
    { id: 'likes', label: 'Likes Received', icon: '❤️' },
    { id: 'visits', label: 'Profile Visits', icon: '👁️' }
  ];

  useEffect(() => {
    if (isOpen) {
      loadActivityData();
    }
  }, [isOpen, activeTab]);

  const loadActivityData = async () => {
    if (!token) return;

    setLoading(true);
    try {
      if (activeTab === 'likes') {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/interactions/likes-received`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        setLikesReceived(data.data?.likes || data.likes || []);
      } else {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/interactions/visits-received`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        setVisitsReceived(data.data?.visits || data.visits || []);
      }
    } catch (error) {
      showToastError('Failed to load activity data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLikeBack = async (user: ActivityUser) => {
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
          showToastSuccess(`🎉 It's a match with ${user.firstname}!`);
        } else {
          showToastSuccess('❤️ Like sent!');
        }

        loadActivityData(); // Reload to update status
      } else {
        showToastError(data.message || 'Failed to like user');
      }
    } catch (error) {
      showToastError('Failed to like user', error);
    }
  };

  const handleViewProfile = (user: ActivityUser) => {
    // Navigate to user profile page - visit will be recorded there
    window.location.href = `/user/${user.id}`;
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="activity-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>👁️ Your Activity</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="activity-content">
          <div className="activity-tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          <div className="activity-list">
            {loading ? (
              <div className="loading-state">
                <p>Loading activity...</p>
              </div>
            ) : activeTab === 'likes' ? (
              <LikesReceivedList
                likes={likesReceived}
                onLikeBack={handleLikeBack}
                onViewProfile={handleViewProfile}
              />
            ) : (
              <VisitsReceivedList
                visits={visitsReceived}
                onViewProfile={handleViewProfile}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityModal;
