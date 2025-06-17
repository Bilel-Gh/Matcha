import React, { useState, useEffect } from 'react';
import { FaEdit, FaSave, FaTimes, FaSpinner, FaMapMarkerAlt } from 'react-icons/fa';
import locationService, { LocationData } from '../services/locationService';

interface ManualLocationEditorProps {
  isOpen: boolean;
  token: string;
  currentLocation: LocationData | null;
  onSave: (location: LocationData) => void;
  onCancel: () => void;
  onError: (message: string) => void;
}

const ManualLocationEditor: React.FC<ManualLocationEditorProps> = ({
  isOpen,
  token,
  currentLocation,
  onSave,
  onCancel,
  onError,
}) => {
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [addressPreview, setAddressPreview] = useState('');
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen && currentLocation) {
      setLatitude(currentLocation.latitude.toString());
      setLongitude(currentLocation.longitude.toString());
      setAddressPreview(
        currentLocation.city && currentLocation.country
          ? `${currentLocation.city}, ${currentLocation.country}`
          : 'Address unavailable'
      );
    }
  }, [isOpen, currentLocation]);

  // Debounced address preview
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (latitude && longitude) {
        updateAddressPreview();
      }
    }, 1000); // Wait 1 second after user stops typing

    return () => clearTimeout(timeoutId);
  }, [latitude, longitude]);

  const updateAddressPreview = async () => {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    // Validate coordinates
    const validation = locationService.validateCoordinates(lat, lng);
    if (!validation.valid) {
      setValidationErrors(validation.errors);
      setAddressPreview('Invalid coordinates');
      return;
    }

    setValidationErrors([]);
    setIsLoadingAddress(true);

    try {
      const address = await locationService.getAddressFromCoords(token, lat, lng);
      setAddressPreview(`${address.city}, ${address.country}`);
    } catch (error) {
      console.error('Failed to get address preview:', error);
      setAddressPreview('Address lookup failed');
    } finally {
      setIsLoadingAddress(false);
    }
  };

  const handleLatitudeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLatitude(e.target.value);
  };

  const handleLongitudeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLongitude(e.target.value);
  };

  const handleSave = async () => {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    // Validate coordinates
    const validation = locationService.validateCoordinates(lat, lng);
    if (!validation.valid) {
      setValidationErrors(validation.errors);
      return;
    }

    setIsSaving(true);
    setValidationErrors([]);

    try {
      const updatedLocation = await locationService.updateLocation(token, {
        latitude: lat,
        longitude: lng,
        source: 'manual'
      });

      onSave(updatedLocation);
    } catch (error) {
      console.error('Failed to save manual location:', error);
      onError('Failed to save location. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setValidationErrors([]);
    onCancel();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content manual-location-editor">
        <div className="modal-header">
          <h3>
            <FaEdit style={{ marginRight: '8px' }} />
            Edit Your Location
          </h3>
          <button className="modal-close-btn" onClick={handleCancel}>
            <FaTimes />
          </button>
        </div>

        <div className="modal-body">
          <p className="modal-description">
            Enter your coordinates manually. You can find them using any map service.
          </p>

          <div className="coordinate-inputs">
            <div className="form-group">
              <label htmlFor="latitude">
                Latitude
                <span className="coordinate-range">(-90 to 90)</span>
              </label>
              <input
                id="latitude"
                type="number"
                step="0.000001"
                value={latitude}
                onChange={handleLatitudeChange}
                placeholder="48.8566"
                className={validationErrors.some(e => e.includes('Latitude')) ? 'error' : ''}
              />
            </div>

            <div className="form-group">
              <label htmlFor="longitude">
                Longitude
                <span className="coordinate-range">(-180 to 180)</span>
              </label>
              <input
                id="longitude"
                type="number"
                step="0.000001"
                value={longitude}
                onChange={handleLongitudeChange}
                placeholder="2.3522"
                className={validationErrors.some(e => e.includes('Longitude')) ? 'error' : ''}
              />
            </div>
          </div>

          {validationErrors.length > 0 && (
            <div className="validation-errors">
              {validationErrors.map((error, index) => (
                <div key={index} className="error-message">
                  {error}
                </div>
              ))}
            </div>
          )}

          <div className="address-preview">
            <div className="address-preview-header">
              <FaMapMarkerAlt style={{ marginRight: '8px' }} />
              Location Preview
            </div>
            <div className="address-preview-content">
              {isLoadingAddress ? (
                <span className="loading-address">
                  <FaSpinner className="spinning" style={{ marginRight: '8px' }} />
                  Getting address...
                </span>
              ) : (
                <span className="preview-address">📍 {addressPreview}</span>
              )}
            </div>
          </div>

          <div className="coordinate-examples">
            <small>
              <strong>Examples:</strong>
              <br />
              Paris: 48.8566, 2.3522
              <br />
              New York: 40.7128, -74.0060
              <br />
              Tokyo: 35.6762, 139.6503
            </small>
          </div>
        </div>

        <div className="modal-footer">
          <button
            className="btn btn-secondary"
            onClick={handleCancel}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={isSaving || validationErrors.length > 0 || !latitude || !longitude}
          >
            {isSaving ? (
              <>
                <FaSpinner className="spinning" style={{ marginRight: '8px' }} />
                Saving...
              </>
            ) : (
              <>
                <FaSave style={{ marginRight: '8px' }} />
                Save Location
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManualLocationEditor;
