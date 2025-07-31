import React, { useState, useEffect } from 'react';
import { FaMapMarkerAlt, FaSync, FaEdit, FaSpinner, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import smartLocationService, { LocationData } from '../services/smartLocationService';
import LocationSearchModal from './LocationSearchModal';

interface SmartLocationManagerProps {
  token: string;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
  autoSetupOnMount?: boolean;
  onProfileUpdate?: () => void;
}

const SmartLocationManager: React.FC<SmartLocationManagerProps> = ({
  token,
  onSuccess,
  onError,
  autoSetupOnMount = false,
  onProfileUpdate,
}) => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [autoSetupAttempted, setAutoSetupAttempted] = useState(false);

  useEffect(() => {
    initializeLocation();
  }, [token]);

  const initializeLocation = async () => {
    setIsLoading(true);
    try {
      // Try to get existing location first
      const existingLocation = await smartLocationService.getCurrentLocation(token);

      if (existingLocation) {
        setLocation(existingLocation);
        setAutoSetupAttempted(true); // Mark as already setup
      } else if (autoSetupOnMount && !autoSetupAttempted) {
        // Auto-setup for new users
        await handleAutoSetup();
      }
    } catch (error) {
      // Silent error for new users without location
      setLocation(null);
    } finally {
      setIsLoading(false);
    }
  };

    const handleAutoSetup = async () => {
      if (!token) return;

      setIsLoading(true);
    try {
        const result = await smartLocationService.autoSetupLocation(token);
        setLocation(result);
        onSuccess?.('Location updated automatically');
      onProfileUpdate?.();
    } catch (error: any) {
        // Silent failure - show user-friendly error
        onError?.(error.message || 'Auto-setup failed. Please try manual location.');
    } finally {
        setIsLoading(false);
    }
  };

  const handleGPSUpdate = async () => {
    setIsUpdating(true);
    try {
      const updatedLocation = await smartLocationService.forceGPSUpdate(token);
      setLocation(updatedLocation);
      onSuccess?.(`🎯 GPS location updated: ${smartLocationService.formatLocationDisplay(updatedLocation)}`);
      onProfileUpdate?.();
    } catch (error: any) {
      onError?.(error.message || 'GPS update failed');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLocationSet = (newLocation: LocationData) => {
    setLocation(newLocation);
    setShowSearchModal(false);

    const sourceMessages = {
      gps: '🎯 GPS location set',
      ip: '🌐 Location detected automatically',
      search: '✅ Location selected'
    };

    const message = sourceMessages[newLocation.location_source] || 'Location updated';
    onSuccess?.(`${message}: ${smartLocationService.formatLocationDisplay(newLocation)}`);
    onProfileUpdate?.();
  };

  const handleSearchError = (message: string) => {
    onError?.(message);
  };

  const needsSetup = smartLocationService.needsLocationSetup(location);
  const hasLocation = !!location;

  if (isLoading) {
    return (
      <div className="smart-location-manager">
        <h3>
          <FaMapMarkerAlt style={{ marginRight: '8px' }} />
          Location
        </h3>
        <div className="location-loading">
          <FaSpinner className="spinning" style={{ marginRight: '8px' }} />
          Loading location...
        </div>
      </div>
    );
  }

  return (
    <div className="smart-location-manager">
      <h3>
        <FaMapMarkerAlt style={{ marginRight: '8px' }} />
        Location
      </h3>

      <p className="section-description">
        Your location helps us show you people nearby and improve your match quality.
        {needsSetup && ' Please set your location to get started.'}
      </p>

      <div className="location-section">
        {/* Status indicator */}
        <div className="location-status">
          <div className={`location-indicator ${hasLocation ? 'completed' : 'incomplete'}`}>
            {hasLocation ? (
              <>
                <FaCheckCircle className="status-icon" />
                Location Set
              </>
            ) : (
              <>
                <FaExclamationCircle className="status-icon" />
                Location Required
              </>
            )}
          </div>
        </div>

        {/* Location display */}
        {hasLocation && (
          <div className="location-display">
            <div className="location-info">
              <div className="location-main">
                <FaMapMarkerAlt className="location-icon" />
                <div className="location-details">
                  <span className="location-text">
                    {smartLocationService.formatLocationDisplay(location)}
                  </span>
                  <div className="location-meta">
                    <span className="location-source">
                      ({smartLocationService.formatLocationSource(location.location_source)})
                    </span>
                    <span className="location-separator">•</span>
                    <span className="location-updated">
                      Updated {smartLocationService.formatTimeAgo(location.location_updated_at)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="location-actions">
              <button
                className="btn btn-secondary location-action-btn"
                onClick={handleGPSUpdate}
                disabled={isUpdating}
                title="Update with GPS"
              >
                {isUpdating ? (
                  <>
                    <FaSpinner className="spinning" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <FaSync />
                    <span>GPS Update</span>
                  </>
                )}
              </button>

              <button
                className="btn btn-secondary location-action-btn"
                onClick={() => setShowSearchModal(true)}
                disabled={isUpdating}
                title="Change Location"
              >
                <FaEdit />
                <span>Change</span>
              </button>
            </div>
          </div>
        )}

        {/* Setup section for users without location */}
        {!hasLocation && (
          <div className="location-setup">
            <div className="setup-actions">
              {!autoSetupAttempted && (
                <button
                  className="btn btn-primary auto-setup-btn"
                  onClick={handleAutoSetup}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <>
                      <FaSpinner className="spinning" style={{ marginRight: '8px' }} />
                      Detecting location...
                    </>
                  ) : (
                    <>
                      <FaMapMarkerAlt style={{ marginRight: '8px' }} />
                      Auto-detect my location
                    </>
                  )}
                </button>
              )}

              <button
                className="btn btn-outline manual-setup-btn"
                onClick={() => setShowSearchModal(true)}
                disabled={isUpdating}
              >
                <FaEdit style={{ marginRight: '8px' }} />
                Choose manually
              </button>
            </div>

            <div className="setup-note">
              <small>
                💡 We'll try to detect your location automatically, or you can search for your city.
              </small>
            </div>
          </div>
        )}
      </div>

      {/* Search Modal */}
      <LocationSearchModal
        isOpen={showSearchModal}
        token={token}
        onLocationSet={handleLocationSet}
        onCancel={() => setShowSearchModal(false)}
        onError={handleSearchError}
      />
    </div>
  );
};

export default SmartLocationManager;
