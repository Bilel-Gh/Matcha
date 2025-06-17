import React, { useState, useEffect } from 'react';
import { FaMapMarkerAlt } from 'react-icons/fa';
import locationService, { LocationData } from '../services/locationService';
import LocationDisplay from './LocationDisplay';
import LocationRequestModal from './LocationRequestModal';
import ManualLocationEditor from './ManualLocationEditor';

interface LocationManagerProps {
  token: string;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
  showInitialSetup?: boolean;
  onProfileUpdate?: () => void;
}

const LocationManager: React.FC<LocationManagerProps> = ({
  token,
  onSuccess,
  onError,
  showInitialSetup = false,
  onProfileUpdate,
}) => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showManualEditor, setShowManualEditor] = useState(false);

  useEffect(() => {
    loadCurrentLocation();
  }, [token]);

  useEffect(() => {
    // Show initial setup modal if location is not set and showInitialSetup is true
    if (showInitialSetup && !isLoading && !location) {
      setShowLocationModal(true);
    }
  }, [showInitialSetup, isLoading, location]);

  const loadCurrentLocation = async () => {
    try {
      setIsLoading(true);
      const currentLocation = await locationService.getCurrentLocation(token);
      setLocation(currentLocation);
    } catch (error) {
      console.error('Failed to load current location:', error);
      // Don't show error for missing location - it's expected for new users
      setLocation(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocationSet = (newLocation: LocationData) => {
    setLocation(newLocation);
    setShowLocationModal(false);

    // Show success message based on source
    const sourceMessages = {
      gps: `✅ Location updated to ${newLocation.city || 'your area'}`,
      ip: `📍 Location set to ${newLocation.city || 'your area'}`,
      manual: `✅ Location changed to ${newLocation.city || 'your area'}`
    };

    onSuccess?.(sourceMessages[newLocation.location_source] || 'Location updated successfully!');
    onProfileUpdate?.();
  };

  const handleLocationUpdate = (updatedLocation: LocationData) => {
    setLocation(updatedLocation);
    onSuccess?.(`✅ Location updated to ${updatedLocation.city || 'your area'}`);
    onProfileUpdate?.();
  };

  const handleManualSave = (savedLocation: LocationData) => {
    setLocation(savedLocation);
    setShowManualEditor(false);
    onSuccess?.(`✅ Location changed to ${savedLocation.city || 'your area'}`);
    onProfileUpdate?.();
  };

  const handleError = (message: string) => {
    onError?.(message);
  };

  const openManualEditor = () => {
    setShowManualEditor(true);
  };

  const closeManualEditor = () => {
    setShowManualEditor(false);
  };

  const hasLocation = location !== null;

  if (isLoading) {
    return (
      <div className="location-manager">
        <h3>
          <FaMapMarkerAlt style={{ marginRight: '8px' }} />
          Location
        </h3>
        <div className="loading-message">Loading location...</div>
      </div>
    );
  }

  return (
    <div className="location-manager">
      <h3>
        <FaMapMarkerAlt style={{ marginRight: '8px' }} />
        Location
      </h3>
      <p className="section-description">
        Your location helps us show you people nearby and improve your matches.
        {!hasLocation && ' Please set your location to continue.'}
      </p>

      <div className="location-section">
        <div className="location-status">
          <div className={`location-indicator ${hasLocation ? 'completed' : 'incomplete'}`}>
            Location {hasLocation ? 'Set' : 'Required'}
          </div>
        </div>

        <LocationDisplay
          location={location}
          token={token}
          onLocationUpdate={handleLocationUpdate}
          onOpenManualEditor={openManualEditor}
          onError={handleError}
        />

        {!hasLocation && (
          <div className="location-setup">
            <button
              className="btn btn-primary setup-location-btn"
              onClick={() => setShowLocationModal(true)}
            >
              <FaMapMarkerAlt style={{ marginRight: '8px' }} />
              Set Up Location
            </button>
          </div>
        )}
      </div>

      <LocationRequestModal
        show={showLocationModal}
        token={token}
        onLocationSet={handleLocationSet}
        onError={handleError}
      />

      <ManualLocationEditor
        isOpen={showManualEditor}
        token={token}
        currentLocation={location}
        onSave={handleManualSave}
        onCancel={closeManualEditor}
        onError={handleError}
      />
    </div>
  );
};

export default LocationManager;
