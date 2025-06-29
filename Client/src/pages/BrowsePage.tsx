import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import useTheme from '../hooks/useTheme';
import { FaHeart, FaSearch, FaEye, FaFilter, FaTh, FaLayerGroup, FaSync, FaMapMarkerAlt, FaStar, FaTimes } from 'react-icons/fa';
import SwipeMode from '../components/SwipeMode';
import GridMode from '../components/GridMode';
import MatchesMode from '../components/MatchesMode';
import SearchModal from '../components/AdvancedSearchModal';
import FilterBar from '../components/FilterBar';
import MatchesModal from '../components/MatchesModal';
import ActivityModal from '../components/ActivityModal';
import { showToastError, showToastSuccess } from '../utils/toastUtils';
import './BrowsePage.css';
import { User } from '../types/user';
import { FilterParams } from '../types/filter';

const BrowsePage: React.FC = () => {
  const { token } = useAuth();
  useTheme(); // Initialize theme hook to ensure theme persistence

  // View mode state
  const [viewMode, setViewMode] = useState<'swipe' | 'grid' | 'matches'>('swipe');

  // Modal states
  const [showFilters, setShowFilters] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);

  // Data states
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [matchCount, setMatchCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<FilterParams>({ sort: 'distance' });

  // Load initial data
  useEffect(() => {
    if (token) {
      loadUsers();
      loadMatchCount();
    }
  }, [token]);

  const loadUsers = async (filters: FilterParams = appliedFilters) => {
    if (!token) return;

    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.append(key, String(value));
      }
    });

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/browse?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        setUsers(data.data.users || []);
      } else {
        throw new Error(data.message || 'Failed to load users');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load users';
      showToastError('Failed to load users', errorMessage);
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

      if (response.ok && data.status === 'success') {
        setMatchCount(data.data.matches?.length || 0);
      }
    } catch (error) {
      setMatchCount(0);
    }
  };

  const handleRefresh = () => {
    loadUsers(appliedFilters);
    loadMatchCount();
  };

  // Clear messages when switching modes
  const handleViewModeChange = (mode: 'swipe' | 'grid' | 'matches') => {
    setViewMode(mode);
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

  // Handle filter application
  const handleFiltersApply = (filteredUsers: User[], filterParams: FilterParams) => {
    setUsers(filteredUsers);
    setAppliedFilters(filterParams);
    showToastSuccess(`Found ${filteredUsers.length} users matching your filters`);
  };

  const handleSortChange = (newSort: string) => {
    const newFilters = { ...appliedFilters, sort: newSort };
    setAppliedFilters(newFilters);
    loadUsers(newFilters);
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
                  className="action-btn refresh-btn"
                  onClick={handleRefresh}
                  disabled={loading}
                >
                  <FaSync style={{ marginRight: '8px' }} />
                  Refresh
                </button>
              </div>

              {/* Filter Summary */}
              {Object.keys(appliedFilters).length > 0 && (
                <div className="filter-summary">
                  <span>Active filters:</span>
                  {appliedFilters.age_min && (
                    <span className="filter-chip">Age: {appliedFilters.age_min}+</span>
                  )}
                  {appliedFilters.age_max && (
                    <span className="filter-chip">Age: -{appliedFilters.age_max}</span>
                  )}
                  {appliedFilters.max_distance && appliedFilters.max_distance !== 50 && (
                    <span className="filter-chip">Distance: {appliedFilters.max_distance}km</span>
                  )}
                  {appliedFilters.fame_min && (
                    <span className="filter-chip">Fame: {appliedFilters.fame_min}+</span>
                  )}
                  {appliedFilters.fame_max && (
                    <span className="filter-chip">Fame: -{appliedFilters.fame_max}</span>
                  )}
                  {appliedFilters.min_common_interests && (
                    <span className="filter-chip">{appliedFilters.min_common_interests}+ common interests</span>
                  )}
                  {appliedFilters.interests && appliedFilters.interests.length > 0 && (
                    <span className="filter-chip">{appliedFilters.interests.length} interest{appliedFilters.interests.length !== 1 ? 's' : ''}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <FilterBar
          isOpen={showFilters}
          onClose={() => setShowFilters(false)}
          onFiltersApply={handleFiltersApply}
          currentFilters={appliedFilters}
        />

        {/* Main Content */}
        <div className="browse-content">
          {loading ? (
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
                  onShowMessage={(message, type) => type === 'success' ? showToastSuccess(message) : showToastError(message)}
                />
              ) : viewMode === 'grid' ? (
                <GridMode
                  users={users}
                  onUsersUpdate={handleRefresh}
                  onShowMessage={(message, type) => type === 'success' ? showToastSuccess(message) : showToastError(message)}
                  onUserRemoved={handleUserRemoved}
                  onUserLiked={handleUserLiked}
                  sortBy={appliedFilters.sort || 'distance'}
                  onSortChange={handleSortChange}
                />
              ) : (
                <MatchesMode
                  onShowMessage={(message, type) => type === 'success' ? showToastSuccess(message) : showToastError(message)}
                  onMatchCountChange={setMatchCount}
                  onUserUnliked={handleUserUnliked}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Search Modal */}
      <SearchModal
        isOpen={showAdvancedSearch}
        onClose={() => setShowAdvancedSearch(false)}
        onSearchResults={(results) => {
          setUsers(results);
          // Force grid mode when showing search results
          setViewMode('grid');
        }}
      />
    </div>
  );
};

export default BrowsePage;
