import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import useTheme from '../hooks/useTheme';
import { FaArrowLeft, FaHeart, FaBan, FaFlag, FaMapMarkerAlt, FaStar, FaUser, FaGlobe } from 'react-icons/fa';
import BlockUserModal from '../components/BlockUserModal';
import ReportUserModal from '../components/ReportUserModal';
import { showToastError, showToastSuccess } from '../utils/toastUtils';
import './BrowsePage.css';

interface UserProfile {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  age: number;
  birth_date: string;
  email: string;
  gender: string;
  sexual_preferences: string;
  biography: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  profile_picture_url: string;
  fame_rating: number;
  distance_km: number;
  common_interests: number;
  common_interests_names: string[];
  is_online: boolean;
  last_connection: string;
  photos: Array<{
    id: number;
    url: string;
    is_profile_picture: boolean;
  }>;
  interests: Array<{
    id: number;
    name: string;
  }>;
}

interface LikeStatus {
  i_liked_them: boolean;
  they_liked_me: boolean;
  is_match: boolean;
}

const UserProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { token } = useAuth();
  const navigate = useNavigate();
  useTheme(); // Initialize theme hook to ensure theme persistence

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [likeStatus, setLikeStatus] = useState<LikeStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiking, setIsLiking] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    if (userId) {
      loadUserProfile();
      loadLikeStatus();
    }
  }, [userId]);

  const loadUserProfile = async () => {
    if (!token || !userId) return;

    try {
      setIsLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/profile/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load user profile');
      }

      const data = await response.json();
      setProfile(data.data);

      // Record the visit (async, don't block loading)
      recordVisit();

      // Load like status
      await loadLikeStatus();
    } catch (error) {
      showToastError('Failed to load user profile', error);
    } finally {
      setIsLoading(false);
    }
  };

  const recordVisit = async () => {
    if (!token || !userId) return;

    try {
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/interactions/visit/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      // Don't show user message for visit errors as it's background operation
    }
  };

  const loadLikeStatus = async () => {
    if (!token || !userId) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/interactions/like-status/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setLikeStatus(data.data);
      }
    } catch (error) {
    }
  };

  const handleLike = async () => {
    if (!token || !userId || isLiking) return;

    try {
      setIsLiking(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/interactions/like/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        if (data.data?.match) {
          showToastSuccess(`🎉 It's a match with ${profile?.firstname}!`);
        } else {
          showToastSuccess(`❤️ You liked ${profile?.firstname}!`);
        }
        await loadLikeStatus();
      } else {
        showToastError(data.message || 'Failed to like user');
      }
    } catch (error) {
      showToastError('Failed to like user', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleUnlike = async () => {
    if (!token || !userId || isLiking) return;

    try {
      setIsLiking(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/interactions/like/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        showToastSuccess(`You unliked ${profile?.firstname}`);
        await loadLikeStatus();
      } else {
        const data = await response.json();
        showToastError(data.message || 'Failed to unlike user');
      }
    } catch (error) {
      showToastError('Failed to unlike user', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleBlock = async (reason?: string) => {
    if (!token || !userId) return;

    try {
      setIsBlocking(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/interactions/block/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });

      if (response.ok) {
        showToastSuccess(`${profile?.firstname} has been blocked`);
        setTimeout(() => navigate('/browse'), 2000);
      } else {
        const data = await response.json();
        showToastError(data.message || 'Failed to block user');
      }
    } catch (error) {
      showToastError('Failed to block user', error);
    } finally {
      setIsBlocking(false);
      setShowBlockModal(false);
    }
  };

  const handleReport = async (reason: string) => {
    if (!token || !userId) return;

    try {
      setIsReporting(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/interactions/report/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });

      if (response.ok) {
        showToastSuccess(`${profile?.firstname} has been reported`);
      } else {
        const data = await response.json();
        showToastError(data.message || 'Failed to report user');
      }
    } catch (error) {
      showToastError('Failed to report user', error);
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

  const formatLastConnection = (lastConnection: string): string => {
    if (!lastConnection) return 'Never';
    const date = new Date(lastConnection);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleOpenChat = () => {
    if (!profile?.id) return;

    // Check if openChatWithUser function is available from ChatWidget
    const openChatFunction = (window as { openChatWithUser?: (userId: number) => void }).openChatWithUser;
    if (openChatFunction) {
      openChatFunction(profile.id);
      showToastSuccess('Chat opened!');
    } else {
      showToastError('Chat is not available right now');
    }
  };

  if (isLoading) {
    return (
      <div className="user-profile-page">
        <div className="profile-container">
          <div className="loading-message">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="user-profile-page">
        <div className="profile-container">
          <div className="error-message">User not found</div>
          <button onClick={() => navigate('/browse')} className="btn btn-primary">
            Back to Browse
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="user-profile-page">
      <div className="profile-container">
        {/* Header */}
        <div className="user-profile-header">
          <button onClick={() => navigate(-1)} className="back-btn">
            <FaArrowLeft /> Back
          </button>
          <div className="profile-title">
            <h2>{profile.firstname}'s Profile</h2>
            <div className="online-status">
              {profile.is_online ? (
                <span className="online">🟢 Online now</span>
              ) : (
                <span className="offline">Last seen {formatLastConnection(profile.last_connection)}</span>
              )}
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="user-profile-content">
          {/* Main Info Section */}
          <div className="profile-main-section">
            <div className="profile-image-section">
              <div className="main-photo">
                <img
                  src={getFullImageUrl(profile.profile_picture_url)}
                  alt={profile.firstname}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder-image.svg';
                  }}
                />
                <div className="photo-overlay">
                  <div className="fame-rating">
                    <FaStar /> {profile.fame_rating}
                  </div>
                </div>
              </div>

              {/* Photo Gallery */}
              {profile.photos && profile.photos.length > 1 && (
                <div className="photo-gallery">
                  {profile.photos.slice(0, 4).map((photo) => (
                    <div key={photo.id} className="gallery-photo">
                      <img
                        src={getFullImageUrl(photo.url)}
                        alt={`${profile.firstname}'s photo`}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder-image.svg';
                        }}
                      />
                    </div>
                  ))}
                  {profile.photos.length > 4 && (
                    <div className="photo-count">+{profile.photos.length - 4} more</div>
                  )}
                </div>
              )}
            </div>

            <div className="profile-info-section">
              <div className="basic-info">
                <h3>{profile.firstname} {profile.lastname}, {profile.age}</h3>
                <div className="location-info">
                  <FaMapMarkerAlt /> {profile.city}, {profile.country} • {profile.distance_km}km away
                </div>
              </div>

              <div className="profile-stats">
                <div className="stat-item">
                  <FaUser />
                  <span>{profile.gender}</span>
                </div>
                <div className="stat-item">
                  <FaHeart />
                  <span>Looking for {profile.sexual_preferences}</span>
                </div>
                <div className="stat-item">
                  <FaStar />
                  <span>Fame: {profile.fame_rating}</span>
                </div>
                {profile.common_interests > 0 && (
                  <div className="stat-item">
                    <FaGlobe />
                    <span>{profile.common_interests} common interests</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="profile-actions">
                {likeStatus?.i_liked_them ? (
                  <button
                    onClick={handleUnlike}
                    disabled={isLiking}
                    className="action-btn unlike-btn"
                  >
                    💔 Unlike
                  </button>
                ) : (
                  <button
                    onClick={handleLike}
                    disabled={isLiking}
                    className="action-btn like-btn"
                  >
                    ❤️ Like
                  </button>
                )}

                <button
                  onClick={() => setShowBlockModal(true)}
                  disabled={isBlocking}
                  className="action-btn block-btn"
                >
                  <FaBan /> Block
                </button>

                <button
                  onClick={() => setShowReportModal(true)}
                  disabled={isReporting}
                  className="action-btn report-btn"
                >
                  <FaFlag /> Report
                </button>
              </div>

              {/* Match Status */}
              {likeStatus?.is_match && (
                <div
                  className="match-status"
                  onClick={handleOpenChat}
                  style={{ cursor: 'pointer' }}
                  title="Click to start a conversation"
                >
                  💝 You're a match! Click to start a conversation
                </div>
              )}
            </div>
          </div>

          {/* Biography Section */}
          {profile.biography && (
            <div className="profile-section">
              <h3>About {profile.firstname}</h3>
              <p className="biography">{profile.biography}</p>
            </div>
          )}

          {/* Interests Section */}
          {profile.interests && profile.interests.length > 0 && (
            <div className="profile-section">
              <h3>Interests</h3>
              <div className="interests-grid">
                {profile.interests.map((interest) => (
                  <span key={interest.id} className="interest-tag">
                    {interest.name}
                  </span>
                ))}
              </div>
              {profile.common_interests_names && profile.common_interests_names.length > 0 && (
                <div className="common-interests">
                  <h4>Common Interests</h4>
                  <div className="interests-grid">
                    {profile.common_interests_names.map((name, index) => (
                      <span key={index} className="interest-tag common">
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <BlockUserModal
        isOpen={showBlockModal}
        onClose={() => setShowBlockModal(false)}
        onConfirm={handleBlock}
        userName={profile.firstname}
        isBlocking={isBlocking}
      />

      <ReportUserModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onConfirm={handleReport}
        userName={profile.firstname}
        isReporting={isReporting}
      />
    </div>
  );
};

export default UserProfilePage;
