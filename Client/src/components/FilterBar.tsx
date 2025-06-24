import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { showToastError } from '../utils/toastUtils'

interface FilterBarProps {
  isOpen: boolean;
  onClose: () => void;
  onFiltersApply: (users: any[], filterParams: any) => void;
  currentFilters?: any;
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
    min_common_interests: currentFilters.min_common_interests || ''
  });


  const [loading, setLoading] = useState(false);



  useEffect(() => {
    // Update filters when currentFilters prop changes
    setFilters({
      age_min: currentFilters.age_min || '',
      age_max: currentFilters.age_max || '',
      max_distance: currentFilters.max_distance || 200,
      fame_min: currentFilters.fame_min || '',
      fame_max: currentFilters.fame_max || '',
      min_common_interests: currentFilters.min_common_interests || ''
    });
  }, [currentFilters]);



  const updateFilter = (key: string, value: string | number) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };



  const applyFilters = async () => {
    if (!token) return;

    setLoading(true);

    const filterParams = {
      ...filters
    };

    try {
      const params = new URLSearchParams();

      Object.entries(filterParams).forEach(([key, value]) => {
        if (value && value !== '') {
          params.append(key, String(value));
        }
      });

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/browse?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        onFiltersApply(data.data?.users || data.users || [], filterParams);
        onClose();
      } else {
        throw new Error(data.message || 'Failed to apply filters');
      }
    } catch (error) {
      showToastError("Failed to like user", error);
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
      min_common_interests: ''
    });
  };

  const resetAndApply = async () => {
    if (!token) return;

    setLoading(true);
    clearFilters();

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/browse`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        onFiltersApply(data.data?.users || data.users || [], {});
        onClose();
      } else {
        throw new Error(data.message || 'Failed to reset filters');
      }
    } catch (error) {
      console.error('Failed to reset filters:', error);
      alert('Failed to reset filters. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const hasActiveFilters = () => {
    return Object.values(filters).some(value => value && value !== '' && value !== 200);
  };

  if (!isOpen) return null;

  return (
    <div className={`filter-bar ${hasActiveFilters() ? 'has-filters' : ''}`}>
      <div className="filter-header">
        <h3>🔍 Filter Results</h3>
        <button className="filter-close-btn" onClick={onClose} disabled={loading}>
          ×
        </button>
      </div>

      <div className="filter-content">
        <div className="filter-row">
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
