import React, { useState, useEffect } from 'react';
import { FaMapMarkerAlt, FaEdit, FaSpinner, FaSync } from 'react-icons/fa';
import locationService, { LocationData } from '../services/locationService';

// Extended interface to handle different possible field names from backend
interface ExtendedLocationData extends LocationData {
  source?: string;
  updated_at?: string;
  created_at?: string;
}

interface LocationDisplayProps {
  location: LocationData | null;
  token: string;
  onLocationUpdate: (location: LocationData) => void;
  onOpenManualEditor: () => void;
  onError: (message: string) => void;
}

const LocationDisplay: React.FC<LocationDisplayProps> = ({
  location,
  token,
  onLocationUpdate,
  onOpenManualEditor,
  onError,
}) => {
  const [isUpdatingGPS, setIsUpdatingGPS] = useState(false);
  const [displayLocation, setDisplayLocation] = useState<string>('');
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);

  // Effect to update display location when location changes
  useEffect(() => {
    if (!location) {
      setDisplayLocation('');
      return;
    }

    const updateDisplayLocation = async () => {
      // If we have city and country, use them
      if (location.city && location.country) {
        setDisplayLocation(`${location.city}, ${location.country}`);
        return;
      }

      // If we only have coordinates, try to get address
      if (location.latitude && location.longitude) {
        setIsLoadingAddress(true);
        try {
          const address = await locationService.tryToGetAddress(token, location.latitude, location.longitude);
          if (address.city && address.country) {
            setDisplayLocation(`${address.city}, ${address.country}`);
          } else {
            // Fallback to coordinates
            setDisplayLocation(`${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`);
          }
        } catch {
          // Fallback to coordinates on error
          setDisplayLocation(`${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`);
        } finally {
          setIsLoadingAddress(false);
        }
      } else {
        setDisplayLocation('Location unavailable');
      }
    };

    updateDisplayLocation();
  }, [location, token]);

  const handleGPSUpdate = async () => {
    setIsUpdatingGPS(true);

    try {
      const updatedLocation = await locationService.updateLocationFromGPS(token);
      onLocationUpdate(updatedLocation);
    } catch (error) {
      console.error('GPS update failed:', error);
      onError('GPS update failed. Please check your browser permissions.');
    } finally {
      setIsUpdatingGPS(false);
    }
  };

  if (!location) {
    return (
      <div className="location-display">
        <div className="location-info">
          <div className="location-status">
            <FaMapMarkerAlt className="location-icon" />
            <span>No location set</span>
          </div>
        </div>
      </div>
    );
  }

  // Safely extract location source - handle different possible field names
  const getLocationSource = (location: LocationData): string => {
    // Try different possible field names the backend might send
    const extendedLocation = location as ExtendedLocationData;
    const source = extendedLocation.location_source ||
                   extendedLocation.source ||
                   '';
    return source;
  };

  // Safely extract location updated time - handle different possible field names
  const getLocationUpdatedAt = (location: LocationData): string => {
    // Try different possible field names the backend might send
    const extendedLocation = location as ExtendedLocationData;
    const updatedAt = extendedLocation.location_updated_at ||
                      extendedLocation.updated_at ||
                      extendedLocation.created_at ||
                      '';
    return updatedAt;
  };

  const sourceLabel = locationService.formatLocationSource(getLocationSource(location));
  const timeAgo = locationService.formatTimeAgo(getLocationUpdatedAt(location));

  return (
    <div className="location-display">
      <div className="location-info">
        <div className="location-main">
          <FaMapMarkerAlt className="location-icon" />
          <div className="location-details">
            <span className="location-text">
              {isLoadingAddress ? (
                <>
                  <FaSpinner className="spinning" style={{ marginRight: '8px' }} />
                  Getting address...
                </>
              ) : (
                displayLocation
              )}
            </span>
            <div className="location-meta">
              <span className="location-source">({sourceLabel})</span>
              <span className="location-separator">•</span>
              <span className="location-updated">Updated {timeAgo}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="location-actions">
        <button
          className="btn btn-secondary location-action-btn"
          onClick={handleGPSUpdate}
          disabled={isUpdatingGPS}
          title="Update GPS Location"
        >
          {isUpdatingGPS ? (
            <>
              <FaSpinner className="spinning" />
              <span>Updating...</span>
            </>
          ) : (
            <>
              <FaSync />
              <span>Update GPS</span>
            </>
          )}
        </button>

        <button
          className="btn btn-secondary location-action-btn"
          onClick={onOpenManualEditor}
          title="Edit Manually"
        >
          <FaEdit />
          <span>Edit</span>
        </button>
      </div>
    </div>
  );
};

export default LocationDisplay;
