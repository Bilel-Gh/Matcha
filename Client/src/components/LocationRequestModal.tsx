import React, { useState } from 'react';
import { FaMapMarkerAlt, FaGlobe, FaSpinner } from 'react-icons/fa';
import locationService from '../services/locationService';

interface LocationRequestModalProps {
  show: boolean;
  token: string;
  onLocationSet: (location: any) => void;
  onError: (message: string) => void;
}

const LocationRequestModal: React.FC<LocationRequestModalProps> = ({
  show,
  token,
  onLocationSet,
  onError,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  if (!show) return null;

  const handleGPSLocation = async () => {
    setIsLoading(true);
    setLoadingMessage('Requesting GPS permission...');

    try {
      const result = await locationService.setupLocationFlow(token);

      if (result.source === 'gps') {
        onLocationSet(result.location);
      } else {
        // IP fallback
        onLocationSet(result.location);
      }
    } catch (error) {
      console.error('Location setup failed:', error);
      onError('Failed to set up location. Please try again.');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handleIPLocation = async () => {
    setIsLoading(true);
    setLoadingMessage('Getting approximate location...');

    try {
      const location = await locationService.setLocationFromIP(token);
      onLocationSet(location);
    } catch (error) {
      console.error('IP location failed:', error);
      onError('Failed to get location. Please try again.');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content location-request-modal">
        <div className="modal-header">
          <h3>🗺️ Set Your Location</h3>
        </div>

        <div className="modal-body">
          <p className="modal-description">
            We need your location to show you people nearby and improve your matches.
          </p>
          <p className="privacy-note">
            <strong>Privacy first:</strong> We only show your neighborhood area, not your exact location.
          </p>

          {isLoading ? (
            <div className="loading-state">
              <FaSpinner className="spinning" />
              <p>{loadingMessage}</p>
            </div>
          ) : (
            <div className="location-options">
              <button
                className="btn btn-primary location-option-btn"
                onClick={handleGPSLocation}
                disabled={isLoading}
              >
                <FaMapMarkerAlt className="option-icon" />
                <div className="option-content">
                  <span className="option-title">Use My Current Location</span>
                  <span className="option-subtitle">Most accurate • Uses GPS</span>
                </div>
              </button>

              <button
                className="btn btn-secondary location-option-btn"
                onClick={handleIPLocation}
                disabled={isLoading}
              >
                <FaGlobe className="option-icon" />
                <div className="option-content">
                  <span className="option-title">Use Approximate Location</span>
                  <span className="option-subtitle">Based on your connection</span>
                </div>
              </button>
            </div>
          )}

          <small className="modal-note">
            You can change this anytime in your profile settings.
          </small>
        </div>
      </div>
    </div>
  );
};

export default LocationRequestModal;
