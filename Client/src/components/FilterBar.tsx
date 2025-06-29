import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { showToastError } from '../utils/toastUtils'
import { User } from '../types/user';
import { FilterParams } from '../types/filter';

interface FilterBarProps {
  isOpen: boolean;
  onClose: () => void;
  onFiltersApply: (users: User[], filterParams: FilterParams) => void;
  currentFilters?: FilterParams;
}

const FilterBar: React.FC<FilterBarProps> = ({
  isOpen,
  onClose,
  onFiltersApply,
  currentFilters = {}
}) => {
  const { token } = useAuth();

  const [filters, setFilters] = useState({
    age_min: currentFilters.age_min || '',
    age_max: currentFilters.age_max || '',
    max_distance: currentFilters.max_distance || 200,
    fame_min: currentFilters.fame_min || '',
    fame_max: currentFilters.fame_max || '',
    min_common_interests: currentFilters.min_common_interests || '',
  });

  const [sortBy, setSortBy] = useState(currentFilters.sort || 'distance');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Update filters when currentFilters prop changes
    setFilters({
      age_min: currentFilters.age_min || '',
      age_max: currentFilters.age_max || '',
      max_distance: currentFilters.max_distance || 200,
      fame_min: currentFilters.fame_min || '',
      fame_max: currentFilters.fame_max || '',
      min_common_interests: currentFilters.min_common_interests || '',
    });
    setSortBy(currentFilters.sort || 'distance');
  }, [currentFilters]);

  const updateFilter = (key: string, value: string | number) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = async () => {
    if (!token) return;

    setLoading(true);

    const filterParams: FilterParams = {
      ...filters,
      sort: sortBy,
    };

    try {
      const params = new URLSearchParams();

      Object.entries(filterParams).forEach(([key, value]) => {
        if (value && value !== '') {
          params.append(key, String(value));
        }
      });

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/browse?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        onFiltersApply(data.data?.users || [], filterParams);
        onClose();
      } else {
        throw new Error(data.message || 'Failed to apply filters');
      }
    } catch (error) {
      showToastError('Failed to apply filters', error);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      age_min: '',
      age_max: '',
      max_distance: 200,
      fame_min: '',
      fame_max: '',
      min_common_interests: '',
    });
    setSortBy('distance');
  };

  const resetAndApply = async () => {
    if (!token) return;

    setLoading(true);
    const clearedSort = 'distance'; // Default sort
    setSortBy(clearedSort);
    clearFilters();

    try {
      const params = new URLSearchParams();
      params.append('sort', clearedSort);

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/browse?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        onFiltersApply(data.data?.users || [], { sort: clearedSort });
        onClose();
      } else {
        throw new Error(data.message || 'Failed to reset filters');
      }
    } catch (error) {
      showToastError('Failed to reset filters. Please try again.', error);
    } finally {
      setLoading(false);
    }
  };

  const hasActiveFilters = () => {
    return (
      Object.values(filters).some(value => value && value !== '' && value !== 200) ||
      sortBy !== 'distance'
    );
  };

  if (!isOpen) return null;

  return (
    <div className={`filter-bar ${hasActiveFilters() ? 'has-filters' : ''}`}>
      <div className="filter-header">
        <h3>🔍 Filter & Sort Results</h3>
        <button className="filter-close-btn" onClick={onClose} disabled={loading}>
          ×
        </button>
      </div>

      <div className="filter-content">
        <div className="filter-row">
          {/* Sorting */}
          <div className="filter-group">
            <label htmlFor="sort_by">Sort By</label>
            <select
              id="sort_by"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              disabled={loading}
            >
              <option value="distance">Location</option>
              <option value="age">Age</option>
              <option value="fame_rating">Fame Rating</option>
              <option value="common_interests">Common Tags</option>
            </select>
          </div>

          {/* Age Filter */}
          <div className="filter-group">
            <label>Age Range</label>
            <div className="range-inputs">
              <input
                type="number"
                placeholder="Min"
                value={filters.age_min}
                onChange={(e) => updateFilter('age_min', e.target.value)}
                min="18"
                max="100"
                disabled={loading}
              />
              <span>to</span>
              <input
                type="number"
                placeholder="Max"
                value={filters.age_max}
                onChange={(e) => updateFilter('age_max', e.target.value)}
                min="18"
                max="100"
                disabled={loading}
              />
            </div>
          </div>

          {/* Distance Filter */}
          <div className="filter-group">
            <label>Distance: {filters.max_distance}km</label>
            <div className="distance-slider-container">
              <input
                type="range"
                min="1"
                max="1000"
                value={filters.max_distance}
                onChange={(e) => updateFilter('max_distance', parseInt(e.target.value))}
                className="distance-slider"
                disabled={loading}
              />
              <div className="distance-labels">
                <span>1km</span>
                <span>1000km</span>
              </div>
            </div>
          </div>

          {/* Fame Rating Filter */}
          <div className="filter-group">
            <label>Fame Rating</label>
            <div className="range-inputs">
              <input
                type="number"
                placeholder="Min"
                value={filters.fame_min}
                onChange={(e) => updateFilter('fame_min', e.target.value)}
                min="0"
                max="100"
                disabled={loading}
              />
              <span>to</span>
              <input
                type="number"
                placeholder="Max"
                value={filters.fame_max}
                onChange={(e) => updateFilter('fame_max', e.target.value)}
                min="0"
                max="100"
                disabled={loading}
              />
            </div>
          </div>

          {/* Common Interests Filter */}
          <div className="filter-group">
            <label>Min Common Interests</label>
            <input
              type="number"
              placeholder="At least"
              value={filters.min_common_interests}
              onChange={(e) => updateFilter('min_common_interests', e.target.value)}
              min="0"
              max="10"
              disabled={loading}
            />
          </div>
        </div>

        {/* Filter Actions */}
        <div className="filter-actions">
          <button
            className="apply-filters-btn"
            onClick={applyFilters}
            disabled={loading}
          >
            {loading ? 'Applying...' : 'Apply Filters'}
          </button>
          <button
            className="clear-filters-btn"
            onClick={clearFilters}
            disabled={loading}
          >
            Clear
          </button>
          <button
            className="reset-filters-btn"
            onClick={resetAndApply}
            disabled={loading}
          >
            {loading ? 'Resetting...' : 'Reset & Reload'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
