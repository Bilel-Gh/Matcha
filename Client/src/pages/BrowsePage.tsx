import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FaHeart, FaSearch, FaEye, FaFilter, FaTh, FaLayerGroup, FaSync, FaMapMarkerAlt, FaStar, FaTimes } from 'react-icons/fa';
import SwipeMode from '../components/SwipeMode';
import GridMode from '../components/GridMode';
import MatchesMode from '../components/MatchesMode';
import AdvancedSearchModal from '../components/AdvancedSearchModal';
import './BrowsePage.css';

interface User {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  age: number;
  city: string;
  country: string;
  profile_picture_url: string;
  biography: string;
  distance_km: number;
  fame_rating: number;
  common_interests: number;
  common_interests_names?: string[];
}

const BrowsePage: React.FC = () => {
  const { token } = useAuth();

  // View mode state
  const [viewMode, setViewMode] = useState<'swipe' | 'grid' | 'matches'>('swipe');

  // Modal states
  const [showFilters, setShowFilters] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [showMatches, setShowMatches] = useState(false);
  const [showActivity, setShowActivity] = useState(false);

  // Data states
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [matchCount, setMatchCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Global message state
  const [globalMessage, setGlobalMessage] = useState<string | null>(null);
  const [globalMessageType, setGlobalMessageType] = useState<'success' | 'error' | null>(null);

  // Load initial data
  useEffect(() => {
    if (token) {
      loadUsers();
      loadMatchCount();
    }
  }, [token]);

  const loadUsers = async () => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/browse`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === 'success') {
        setUsers(data.data.users || []);
      } else {
        throw new Error(data.message || 'Failed to load users');
      }
    } catch (error) {
      console.error('Failed to load users:', error);
      setError(error instanceof Error ? error.message : 'Failed to load users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMatchCount = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/interactions/matches`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === 'success') {
        setMatchCount(data.data.matches?.length || 0);
      }
    } catch (error) {
      console.error('Failed to load match count:', error);
      setMatchCount(0);
    }
  };

  const handleRefresh = () => {
    loadUsers();
    loadMatchCount();
  };

  // Global message handler
  const showGlobalMessage = (message: string, type: 'success' | 'error') => {
    setGlobalMessage(message);
    setGlobalMessageType(type);
    // Auto-hide message after 4 seconds
    setTimeout(() => {
      setGlobalMessage(null);
      setGlobalMessageType(null);
    }, 4000);
  };

  // Clear messages when switching modes
  const handleViewModeChange = (mode: 'swipe' | 'grid' | 'matches') => {
    setViewMode(mode);
    setGlobalMessage(null);
    setGlobalMessageType(null);
  };

  // Remove user from local list (for immediate UI update)
  const handleUserRemoved = (userId: number) => {
    setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
  };

  // Handle like action - update match count automatically
  const handleUserLiked = (userId: number, isMatch: boolean) => {
    // Remove user from local list
    handleUserRemoved(userId);

    // If it's a match, increment match count
    if (isMatch) {
      setMatchCount(prev => prev + 1);
    }
  };

  // Handle unlike action - update match count automatically
  const handleUserUnliked = (userId: number, wasMatch: boolean) => {
    // If it was a match, decrement match count
    if (wasMatch) {
      setMatchCount(prev => Math.max(0, prev - 1));
    }
  };

  return (
    <div className="browse-page">
      {/* Main Container - Structure identique à ProfilePage */}
      <div className="browse-container">
        {/* Header */}
        <div className="browse-header">
          <div className="browse-header-content">
            <h1>Discover People</h1>
            <p>Find your perfect match in your area</p>

            <div className="header-controls">
              {/* View Mode Toggle */}
              <div className="view-toggle">
                <button
                  className={`toggle-btn ${viewMode === 'swipe' ? 'active' : ''}`}
                  onClick={() => handleViewModeChange('swipe')}
                >
                  <FaLayerGroup style={{ marginRight: '8px' }} />
                  Swipe
                </button>
                <button
                  className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => handleViewModeChange('grid')}
                >
                  <FaTh style={{ marginRight: '8px' }} />
                  Grid
                </button>
                <button
                  className={`toggle-btn ${viewMode === 'matches' ? 'active' : ''}`}
                  onClick={() => handleViewModeChange('matches')}
                >
                  <FaHeart style={{ marginRight: '8px' }} />
                  Matches ({matchCount})
                </button>
              </div>

              {/* Action Buttons */}
              <div className="action-buttons">
                <button
                  className="action-btn filter-btn"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <FaFilter style={{ marginRight: '8px' }} />
                  Filters
                </button>
                <button
                  className="action-btn search-btn"
                  onClick={() => setShowAdvancedSearch(true)}
                >
                  <FaSearch style={{ marginRight: '8px' }} />
                  Search
                </button>
                <button
                  className="action-btn matches-btn"
                  onClick={() => setShowMatches(true)}
                >
                  <FaHeart style={{ marginRight: '8px' }} />
                  Matches ({matchCount})
                </button>
                <button
                  className="action-btn activity-btn"
                  onClick={() => setShowActivity(true)}
                >
                  <FaEye style={{ marginRight: '8px' }} />
                  Activity
                </button>
                <button
                  className="action-btn refresh-btn"
                  onClick={handleRefresh}
                  disabled={loading}
                >
                  <FaSync style={{ marginRight: '8px' }} />
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Bar (collapsible) */}
        {showFilters && (
          <div className="filter-bar">
            <div className="filter-content">
              <h3>Filter Options</h3>
              <p>Basic filters will be implemented in next prompt</p>
              <div className="filter-actions">
                <button className="btn btn-secondary" onClick={() => setShowFilters(false)}>
                  Close Filters
                </button>
                <button className="btn btn-primary" onClick={handleRefresh}>
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="browse-content">
          {error ? (
            <div className="error-state">
              <h3>Error Loading Users</h3>
              <p>{error}</p>
              <button className="btn btn-primary" onClick={handleRefresh}>
                Try Again
              </button>
            </div>
          ) : loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading users...</p>
            </div>
          ) : (
            <>
              {viewMode === 'swipe' ? (
                <SwipeMode
                  users={users}
                  onUsersUpdate={handleRefresh}
                  onUserRemoved={handleUserRemoved}
                  onUserLiked={handleUserLiked}
                  onShowMessage={showGlobalMessage}
                />
              ) : viewMode === 'grid' ? (
                <GridMode
                  users={users}
                  onUsersUpdate={handleRefresh}
                  onShowMessage={showGlobalMessage}
                  onUserRemoved={handleUserRemoved}
                  onUserLiked={handleUserLiked}
                />
              ) : (
                <MatchesMode
                  onShowMessage={showGlobalMessage}
                  onMatchCountChange={setMatchCount}
                  onUserUnliked={handleUserUnliked}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Global Message Notification */}
      {globalMessage && (
        <div className={`message-notification ${globalMessageType === 'success' ? 'success' : 'error'}`}>
          {globalMessage}
        </div>
      )}

      {/* Advanced Search Modal */}
      <AdvancedSearchModal
        isOpen={showAdvancedSearch}
        onClose={() => setShowAdvancedSearch(false)}
        onSearchResults={(results) => {
          setUsers(results);
          // Force grid mode when showing search results
          setViewMode('grid');
        }}
      />

      {showMatches && (
        <div className="modal-overlay" onClick={() => setShowMatches(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <FaHeart style={{ marginRight: '8px' }} />
                Your Matches ({matchCount})
              </h3>
              <button className="modal-close" onClick={() => setShowMatches(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <p>View and manage your mutual matches</p>
              <p>Start conversations with people who liked you back!</p>
              <p className="coming-soon">Matches list implementation coming in next prompt</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowMatches(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {showActivity && (
        <div className="modal-overlay" onClick={() => setShowActivity(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <FaEye style={{ marginRight: '8px' }} />
                Your Activity
              </h3>
              <button className="modal-close" onClick={() => setShowActivity(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <p>Track your activity:</p>
              <ul>
                <li>Who visited your profile</li>
                <li>Who liked you</li>
                <li>Your likes and visits</li>
                <li>Recent activity timeline</li>
              </ul>
              <p className="coming-soon">Activity tracking implementation coming in next prompt</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowActivity(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrowsePage;
