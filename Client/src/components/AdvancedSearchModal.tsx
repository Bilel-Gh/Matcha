import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { showToastError, showToastSuccess } from '../utils/toastUtils';
import { User } from '../types/user';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearchResults: (results: User[]) => void;
}

const SearchResultCard: React.FC<{ user: User; searchQuery: string }> = ({ user, searchQuery }) => {
  const { token } = useAuth();

  const handleViewProfile = () => {
    // Navigate to user profile page - visit will be recorded there
    window.location.href = `/user/${user.id}`;
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
          // Don't show immediate toast for match - let the real-time notification handle it
        } else {
          // Don't show immediate toast for like - let the real-time notification handle it
          // showToastSuccess(`❤️ You liked ${user.firstname}!`);
        }
      } else {
        showToastError('Failed to like user', data.message);
      }
    } catch (error) {
      showToastError('Failed to like user', error);
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

  const highlightMatch = (text: string, searchQuery: string): JSX.Element => {
    if (!searchQuery.trim()) return <span>{text}</span>;

    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return (
      <span>
        {parts.map((part, index) =>
          regex.test(part) ? (
            <mark key={index} style={{ background: '#ffeb3b', padding: '0 2px', borderRadius: '2px' }}>
              {part}
            </mark>
          ) : (
            <span key={index}>{part}</span>
          )
        )}
      </span>
    );
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
        <h4>
          {highlightMatch(`${user.firstname} ${user.lastname}`, searchQuery)}, {calculateAge(user.birth_date)}
        </h4>
        <div className="result-username">
          @{highlightMatch(user.username, searchQuery)}
        </div>
        <div className="result-stats">
          <span>📍 {user.city} • {user.distance_km}km</span>
          <span>⭐ {user.fame_rating}</span>
        </div>
        {(user.common_interests_count || user.common_interests) > 0 && (
          <div className="result-interests">
            ❤️ {user.common_interests_names && user.common_interests_names.length > 0
              ? user.common_interests_names.slice(0, 2).join(', ') + (user.common_interests_names.length > 2 ? '...' : '')
              : `${user.common_interests_count || user.common_interests} common`
            }
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

const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, onSearchResults }) => {
  const { token } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [resultsPerPage] = useState(20);

  // Auto-search when user types (debounced)
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (searchQuery.trim().length >= 2) {
      const timeout = setTimeout(() => {
        handleSearch();
      }, 500); // 500ms delay after user stops typing
      setSearchTimeout(timeout);
    } else if (searchQuery.trim().length === 0) {
      setSearchResults([]);
      setHasSearched(false);
    }

    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchQuery]);

  const handleSearch = async (page: number = 1) => {
    if (!token || !searchQuery.trim()) return;

    setIsSearching(true);
    setHasSearched(true);

    try {
      const params = new URLSearchParams();
      params.append('search', searchQuery.trim());
      params.append('page', String(page));
      params.append('limit', String(resultsPerPage));

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/browse/search?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        setSearchResults(data.data?.users || []);
        setTotalResults(data.data?.total || 0);
        setTotalPages(data.data?.totalPages || 1);
        setCurrentPage(data.data?.page || 1);
        setHasNext(data.data?.hasNext || false);
        setHasPrev(data.data?.hasPrev || false);
      } else {
        showToastError('Search failed', data.message || 'Unknown error occurred');
        setSearchResults([]);
      }
    } catch (error) {
      showToastError('Search failed', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim().length >= 2) {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
      handleSearch();
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
    setCurrentPage(1);
    setTotalPages(1);
    setTotalResults(0);
    setHasNext(false);
    setHasPrev(false);
  };

  const closeModal = () => {
    clearSearch();
    onClose();
  };

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      handleSearch(newPage);
    }
  };

  const handleNextPage = () => {
    if (hasNext) {
      handlePageChange(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (hasPrev) {
      handlePageChange(currentPage - 1);
    }
  };

  const useSearchResults = () => {
    onSearchResults(searchResults);
    clearSearch();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="search-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🔍 Search Users</h2>
          <button className="close-btn" onClick={closeModal}>×</button>
        </div>

        <div className="search-content">
          {/* Search Input */}
          <div className="search-input-section">
            <div className="search-input-wrapper">
              <div className="search-icon">🔍</div>
                  <input
                    type="text"
                className="search-input"
                placeholder="Search by name, first name, or username..."
                value={searchQuery}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                autoFocus
              />
              {searchQuery && (
                <button className="clear-search-btn" onClick={clearSearch}>
                  ×
                </button>
              )}
            </div>
            <div className="search-hint">
              💡 Type at least 2 characters to start searching
            </div>
            {isSearching && (
              <div className="search-loading">
                <div className="loading-spinner"></div>
                Searching...
              </div>
            )}
          </div>

          {/* Search Results */}
          {hasSearched && (
            <div className="search-results-section">
            <div className="results-header">
                <h4>
                  {totalResults > 0
                    ? `Found ${totalResults} user${totalResults === 1 ? '' : 's'}`
                    : 'No users found'
                  }
                </h4>
                {totalResults > 0 && (
              <div className="results-actions">
                    <button className="use-results-btn" onClick={useSearchResults}>
                      Use These Results ({totalResults})
                </button>
              </div>
                )}
            </div>

            {searchResults.length === 0 ? (
              <div className="empty-results">
                  <div className="empty-icon">🔍</div>
                <h3>No users found</h3>
                  <p>Try different keywords or check your spelling</p>
                  <div className="search-tips">
                    <strong>Search tips:</strong>
                    <ul>
                      <li>Try searching by first name: "John"</li>
                      <li>Try searching by username: "john123"</li>
                      <li>Use partial names: "Jo" will find "John", "Joan", etc.</li>
                    </ul>
                  </div>
              </div>
            ) : (
              <>
                <div className="search-results-grid">
                  {searchResults.map(user => (
                      <SearchResultCard key={user.id} user={user} searchQuery={searchQuery} />
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="pagination-controls">
                    <div className="pagination-info">
                      <span>Page {currentPage} of {totalPages}</span>
                      <span>Showing {searchResults.length} of {totalResults} users</span>
                    </div>

                    <div className="pagination-buttons">
                      <button
                        className="pagination-btn prev-btn"
                        onClick={handlePrevPage}
                        disabled={!hasPrev}
                      >
                        ← Previous
                      </button>

                      <div className="page-numbers">
                        {/* Show first page */}
                        {currentPage > 3 && (
                          <>
                            <button
                              className="page-btn"
                              onClick={() => handlePageChange(1)}
                            >
                              1
                            </button>
                            {currentPage > 4 && <span className="page-ellipsis">...</span>}
                          </>
                        )}

                        {/* Show pages around current page */}
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                          if (pageNum > totalPages) return null;

                          return (
                            <button
                              key={pageNum}
                              className={`page-btn ${pageNum === currentPage ? 'active' : ''}`}
                              onClick={() => handlePageChange(pageNum)}
                            >
                              {pageNum}
                            </button>
                          );
                        })}

                        {/* Show last page */}
                        {currentPage < totalPages - 2 && (
                          <>
                            {currentPage < totalPages - 3 && <span className="page-ellipsis">...</span>}
                            <button
                              className="page-btn"
                              onClick={() => handlePageChange(totalPages)}
                            >
                              {totalPages}
                            </button>
                          </>
                        )}
                      </div>

                      <button
                        className="pagination-btn next-btn"
                        onClick={handleNextPage}
                        disabled={!hasNext}
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

          {/* Initial State */}
          {!hasSearched && !searchQuery && (
            <div className="search-welcome">
              <div className="welcome-icon">👋</div>
              <h3>Find someone special</h3>
              <p>Search for users by their name, first name, or username</p>
              <div className="search-examples">
                <strong>Examples:</strong>
                <div className="example-searches">
                  <span className="example-tag">John</span>
                  <span className="example-tag">Marie</span>
                  <span className="example-tag">alex123</span>
                  <span className="example-tag">Sarah</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchModal;
