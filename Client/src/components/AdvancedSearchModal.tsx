import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface SearchCriteria {
  age_min: string;
  age_max: string;
  fame_min: string;
  fame_max: string;
  max_distance: string;
  location: string;
  min_common_interests: string;
}



interface User {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  age: number;
  birth_date: string;
  city: string;
  country: string;
  profile_picture_url: string;
  biography: string;
  distance_km: number;
  fame_rating: number;
  common_interests: number;
  common_interests_count?: number;
  is_online: boolean;
  last_connection?: string;
}

interface AdvancedSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearchResults: (results: User[]) => void;
}

const SearchResultCard: React.FC<{ user: User }> = ({ user }) => {
  const { token } = useAuth();

  const handleViewProfile = async () => {
    if (!token) return;

    try {
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/interactions/visit/${user.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      alert(`👁️ Viewing ${user.firstname}'s profile (visit recorded)`);
    } catch (error) {
      console.error('Failed to record visit:', error);
      alert(`👁️ Viewing ${user.firstname}'s profile`);
    }
  };

  const handleLike = async () => {
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
          alert(`🎉 It's a match with ${user.firstname}!`);
        } else {
          alert('❤️ Like sent!');
        }
      } else {
        alert('Failed to like user');
      }
    } catch (error) {
      console.error('Failed to like user:', error);
      alert('Failed to like user');
    }
  };

  const getFullImageUrl = (url: string): string => {
    if (!url) return '/placeholder-image.svg';
    if (url.startsWith('http')) return url;
    return `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${url}`;
  };

  const calculateAge = (birthDate: string): number => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="search-result-card">
      <div className="result-image" onClick={handleViewProfile}>
        <img
          src={getFullImageUrl(user.profile_picture_url)}
          alt={user.firstname}
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/placeholder-image.svg';
          }}
        />
        <div className="result-overlay">
          <div className="online-status">
            {user.is_online ? '🟢' : '⚫'}
          </div>
        </div>
      </div>

      <div className="result-info">
        <h4>{user.firstname}, {calculateAge(user.birth_date)}</h4>
        <div className="result-stats">
          <span>📍 {user.distance_km}km</span>
          <span>⭐ {user.fame_rating}</span>
        </div>
        {(user.common_interests_count || user.common_interests) > 0 && (
          <div className="result-interests">
            ❤️ {user.common_interests_count || user.common_interests} common
          </div>
        )}
      </div>

      <div className="result-actions">
        <button className="result-view-btn" onClick={handleViewProfile}>
          👁️
        </button>
        <button className="result-like-btn" onClick={handleLike}>
          ❤️
        </button>
      </div>
    </div>
  );
};

const AdvancedSearchModal: React.FC<AdvancedSearchModalProps> = ({ isOpen, onClose, onSearchResults }) => {
  const { token } = useAuth();
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>({
    age_min: '',
    age_max: '',
    fame_min: '',
    fame_max: '',
    max_distance: '',
    location: '',
    min_common_interests: ''
  });

  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const updateCriteria = (key: keyof SearchCriteria, value: string) => {
    setSearchCriteria(prev => ({ ...prev, [key]: value }));
  };

  const handleSearch = async () => {
    if (!token) return;

    setIsSearching(true);
    try {
      const params = new URLSearchParams();

      // Add search criteria to params
      Object.entries(searchCriteria).forEach(([key, value]) => {
        if (value && value !== '') {
          params.append(key, String(value));
        }
      });

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/browse/search?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      setSearchResults(data.data?.users || []);
      setShowResults(true);
    } catch (error) {
      console.error('Search failed:', error);
      alert('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const resetSearch = () => {
    setSearchCriteria({
      age_min: '',
      age_max: '',
      fame_min: '',
      fame_max: '',
      max_distance: '',
      location: '',
      min_common_interests: ''
    });
    setSearchResults([]);
    setShowResults(false);
  };

  const closeModal = () => {
    resetSearch();
    onClose();
  };

  const useSearchResults = () => {
    onSearchResults(searchResults);
    closeModal();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="search-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🔍 Advanced Search</h2>
          <button className="close-btn" onClick={closeModal}>×</button>
        </div>

        {!showResults ? (
          <div className="search-form">
            {/* Demographics Section */}
            <div className="search-section">
              <h4>👤 Demographics</h4>
              <div className="form-row">
                <div className="input-group">
                  <label>Age Range</label>
                  <div className="range-inputs">
                    <input
                      type="number"
                      placeholder="Min age"
                      value={searchCriteria.age_min}
                      onChange={(e) => updateCriteria('age_min', e.target.value)}
                      min="18"
                      max="100"
                    />
                    <span>to</span>
                    <input
                      type="number"
                      placeholder="Max age"
                      value={searchCriteria.age_max}
                      onChange={(e) => updateCriteria('age_max', e.target.value)}
                      min="18"
                      max="100"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Location Section */}
            <div className="search-section">
              <h4>📍 Location</h4>
              <div className="form-row">
                <div className="input-group">
                  <label>Maximum Distance (km)</label>
                  <input
                    type="number"
                    placeholder="Distance in km"
                    value={searchCriteria.max_distance}
                    onChange={(e) => updateCriteria('max_distance', e.target.value)}
                    min="1"
                    max="500"
                  />
                </div>
                <div className="input-group">
                  <label>Location (optional)</label>
                  <input
                    type="text"
                    placeholder="City or area"
                    value={searchCriteria.location}
                    onChange={(e) => updateCriteria('location', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Fame Rating Section */}
            <div className="search-section">
              <h4>⭐ Fame Rating</h4>
              <div className="form-row">
                <div className="input-group">
                  <label>Fame Rating Range</label>
                  <div className="range-inputs">
                    <input
                      type="number"
                      placeholder="Min rating"
                      value={searchCriteria.fame_min}
                      onChange={(e) => updateCriteria('fame_min', e.target.value)}
                      min="0"
                      max="100"
                    />
                    <span>to</span>
                    <input
                      type="number"
                      placeholder="Max rating"
                      value={searchCriteria.fame_max}
                      onChange={(e) => updateCriteria('fame_max', e.target.value)}
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Common Interests Section */}
            <div className="search-section">
              <h4>❤️ Common Interests</h4>
              <div className="form-row">
                <div className="input-group">
                  <label>Minimum Common Interests</label>
                  <input
                    type="number"
                    placeholder="e.g. 3"
                    value={searchCriteria.min_common_interests}
                    onChange={(e) => updateCriteria('min_common_interests', e.target.value)}
                    min="0"
                    max="20"
                  />
                  <small>Number of interests you must have in common (0 = no requirement)</small>
                </div>
              </div>
            </div>

            {/* Search Actions */}
            <div className="search-actions">
              <button
                className="search-btn primary"
                onClick={handleSearch}
                disabled={isSearching}
              >
                {isSearching ? 'Searching...' : '🔍 Search'}
              </button>
              <button
                className="reset-btn secondary"
                onClick={resetSearch}
              >
                Reset
              </button>
            </div>
          </div>
        ) : (
          <div className="search-results">
            <div className="results-header">
              <h4>Search Results ({searchResults.length} found)</h4>
              <div className="results-actions">
                <button
                  className="back-btn"
                  onClick={() => setShowResults(false)}
                >
                  ← Back to Search
                </button>
                <button
                  className="use-results-btn"
                  onClick={useSearchResults}
                >
                  Use These Results
                </button>
                <button
                  className="new-search-btn"
                  onClick={resetSearch}
                >
                  New Search
                </button>
              </div>
            </div>

            {searchResults.length === 0 ? (
              <div className="empty-results">
                <h3>No users found</h3>
                <p>Try adjusting your search criteria</p>
                <button
                  className="modify-search-btn"
                  onClick={() => setShowResults(false)}
                >
                  Modify Search
                </button>
              </div>
            ) : (
              <div className="search-results-grid">
                {searchResults.map(user => (
                  <SearchResultCard key={user.id} user={user} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedSearchModal;
