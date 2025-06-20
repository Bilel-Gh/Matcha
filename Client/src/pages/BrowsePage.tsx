import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FaHeart, FaSearch, FaEye, FaFilter, FaTh, FaLayerGroup, FaSync, FaMapMarkerAlt, FaStar, FaTimes } from 'react-icons/fa';
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
}

const BrowsePage: React.FC = () => {
  const { token } = useAuth();

  // View mode state
  const [viewMode, setViewMode] = useState<'swipe' | 'grid'>('swipe');

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
                  onClick={() => setViewMode('swipe')}
                >
                  <FaLayerGroup style={{ marginRight: '8px' }} />
                  Swipe
                </button>
                <button
                  className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                >
                  <FaTh style={{ marginRight: '8px' }} />
                  Grid
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
                <div className="swipe-mode-placeholder">
                  <div className="mode-header">
                    <FaLayerGroup className="mode-icon" />
                    <h3>Swipe Mode</h3>
                  </div>
                  <p><strong>{users.length}</strong> users available</p>
                  <p>Swipe through profiles to find your match!</p>
                  <p className="coming-soon">Swipe implementation coming in next prompt</p>
                  {users.length > 0 && (
                    <div className="preview-stats">
                      <div className="stat-item">
                        <FaMapMarkerAlt className="stat-icon" />
                        <div className="stat-info">
                          <span className="stat-label">Average distance</span>
                          <span className="stat-value">{Math.round(users.reduce((sum, u) => sum + (u.distance_km || 0), 0) / users.length)} km</span>
                        </div>
                      </div>
                      <div className="stat-item">
                        <FaStar className="stat-icon" />
                        <div className="stat-info">
                          <span className="stat-label">Average fame</span>
                          <span className="stat-value">{Math.round(users.reduce((sum, u) => sum + (u.fame_rating || 0), 0) / users.length)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid-mode-placeholder">
                  <div className="mode-header">
                    <FaTh className="mode-icon" />
                    <h3>Grid Mode</h3>
                  </div>
                  <p><strong>{users.length}</strong> users found</p>
                  <p>Browse profiles in a grid layout</p>
                  <p className="coming-soon">Grid implementation coming in next prompt</p>
                  {users.length > 0 && (
                    <div className="preview-list">
                      <h4>Preview of available users:</h4>
                      <div className="user-preview-grid">
                        {users.slice(0, 6).map(user => (
                          <div key={user.id} className="user-preview-card">
                            <div className="user-info">
                              <strong>{user.firstname}</strong>, {user.age}
                            </div>
                            <div className="user-location">
                              <FaMapMarkerAlt className="location-icon" />
                              {user.city} ({user.distance_km}km)
                            </div>
                            <div className="user-stats">
                              <FaStar className="star-icon" /> {user.fame_rating} | <FaHeart className="heart-icon" /> {user.common_interests} interests
                            </div>
                          </div>
                        ))}
                        {users.length > 6 && (
                          <div className="user-preview-card more-users">
                            +{users.length - 6} more users
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal Placeholders */}
      {showAdvancedSearch && (
        <div className="modal-overlay" onClick={() => setShowAdvancedSearch(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <FaSearch style={{ marginRight: '8px' }} />
                Advanced Search
              </h3>
              <button className="modal-close" onClick={() => setShowAdvancedSearch(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <p>Advanced search with filters for:</p>
              <ul>
                <li>Age range</li>
                <li>Distance radius</li>
                <li>Fame rating</li>
                <li>Common interests</li>
                <li>Location</li>
              </ul>
              <p className="coming-soon">Implementation coming in next prompt</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAdvancedSearch(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

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
