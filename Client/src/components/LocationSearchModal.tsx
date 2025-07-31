import React, { useState, useEffect, useRef } from 'react';
import { FaSearch, FaMapMarkerAlt, FaTimes, FaSpinner, FaGlobe } from 'react-icons/fa';
import smartLocationService, { LocationData, CitySearchResult } from '../services/smartLocationService';

interface LocationSearchModalProps {
  isOpen: boolean;
  token: string;
  onLocationSet: (location: LocationData) => void;
  onCancel: () => void;
  onError: (message: string) => void;
}

const LocationSearchModal: React.FC<LocationSearchModalProps> = ({
  isOpen,
  token,
  onLocationSet,
  onCancel,
  onError,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CitySearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSettingLocation, setIsSettingLocation] = useState(false);
  const [selectedResult, setSelectedResult] = useState<CitySearchResult | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setSelectedResult(null);
      setShowSuggestions(false);
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (searchQuery.length >= 2) {
      debounceRef.current = setTimeout(() => {
        handleSearch(searchQuery);
      }, 300);
    } else {
      setSearchResults([]);
      setShowSuggestions(false);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchQuery]);

  const handleSearch = async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearching(true);
    try {
      const results = await smartLocationService.searchCities(query.trim(), token);
      setSearchResults(results);
      setShowSuggestions(true);
    } catch (error: any) {
      // Silent failure - show empty results
      setSearchResults([]);
      setShowSuggestions(false);
      onError('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setSelectedResult(null);
  };

  const handleCitySelect = async (city: CitySearchResult) => {
    setSelectedResult(city);
    setSearchQuery(city.display_name);
    setShowSuggestions(false);
    setIsSettingLocation(true);

    try {
      const location = await smartLocationService.setLocationFromCity(token, city);
      onLocationSet(location);
    } catch (error) {
      onError('Failed to set location. Please try again.');
    } finally {
      setIsSettingLocation(false);
    }
  };

  const handleAutoDetect = async () => {
    setIsSettingLocation(true);
    try {
      const location = await smartLocationService.autoSetupLocation(token);
      onLocationSet(location);
    } catch (error) {
      onError('Unable to detect your location automatically. Please search manually.');
    } finally {
      setIsSettingLocation(false);
    }
  };

  const handleCancel = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedResult(null);
    setShowSuggestions(false);
    onCancel();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (showSuggestions) {
        setShowSuggestions(false);
      } else {
        handleCancel();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content location-search-modal">
        <div className="modal-header">
          <h3>
            <FaMapMarkerAlt style={{ marginRight: '8px' }} />
            Set Your Location
          </h3>
          <button className="modal-close-btn" onClick={handleCancel} disabled={isSettingLocation}>
            <FaTimes />
          </button>
        </div>

        <div className="modal-body">
          <p className="modal-description">
            Choose your location to find people nearby and improve your matches.
          </p>

          {/* Auto-detect option */}
          <div className="auto-detect-section">
            <button
              className="btn btn-primary auto-detect-btn"
              onClick={handleAutoDetect}
              disabled={isSettingLocation}
            >
              {isSettingLocation ? (
                <>
                  <FaSpinner className="spinning" style={{ marginRight: '8px' }} />
                  Detecting...
                </>
              ) : (
                <>
                  <FaGlobe style={{ marginRight: '8px' }} />
                  Auto-detect my location
                </>
              )}
            </button>
            <small className="auto-detect-note">
              We'll try to detect your location automatically
            </small>
          </div>

          <div className="or-divider">
            <span>or</span>
          </div>

          {/* Manual search */}
          <div className="search-section">
            <label htmlFor="city-search">Search for your city or area:</label>
            <div className="search-input-container">
              <div className="search-input-wrapper">
                <FaSearch className="search-icon" />
                <input
                  ref={searchInputRef}
                  id="city-search"
                  type="text"
                  placeholder="Type your city name..."
                  value={searchQuery}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  disabled={isSettingLocation}
                  className="search-input"
                />
                {isSearching && (
                  <FaSpinner className="search-loading spinning" />
                )}
              </div>

              {showSuggestions && searchResults.length > 0 && (
                <div className="search-suggestions">
                  {searchResults.map((city) => (
                    <button
                      key={city.id}
                      className="suggestion-item"
                      onClick={() => handleCitySelect(city)}
                      disabled={isSettingLocation}
                    >
                      <FaMapMarkerAlt className="suggestion-icon" />
                      <div className="suggestion-content">
                        <div className="suggestion-name">{city.name}</div>
                        <div className="suggestion-country">{city.country}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {showSuggestions && searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
                <div className="search-suggestions">
                  <div className="no-results">
                    <FaMapMarkerAlt className="no-results-icon" />
                    <span>No cities found. Try a different search term.</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="search-tips">
            <small>
              💡 <strong>Tips:</strong> Try searching for your city, neighborhood, or nearby landmarks.
              <br />
              Examples: "Paris", "Brooklyn", "London", "Tokyo"
            </small>
          </div>
        </div>

        <div className="modal-footer">
          <button
            className="btn btn-secondary"
            onClick={handleCancel}
            disabled={isSettingLocation}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationSearchModal;
