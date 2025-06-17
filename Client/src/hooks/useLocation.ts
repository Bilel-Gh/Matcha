import { useState, useCallback } from 'react';
import locationService, { LocationData } from '../services/locationService';
import axios from 'axios';

interface UseLocationReturn {
  location: LocationData | null;
  isLoading: boolean;
  isUpdatingGPS: boolean;
  isSaving: boolean;
  loadLocation: () => Promise<void>;
  updateLocationFromGPS: () => Promise<LocationData>;
  updateLocationManually: (latitude: number, longitude: number) => Promise<LocationData>;
  setLocationFromIP: () => Promise<LocationData>;
  setupLocationFlow: () => Promise<{ location: LocationData; source: 'gps' | 'ip' }>;
  setLocation: React.Dispatch<React.SetStateAction<LocationData | null>>;
}

export const useLocation = (
  token: string,
  onSuccess?: (message: string) => void,
  onError?: (message: string) => void
): UseLocationReturn => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdatingGPS, setIsUpdatingGPS] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const loadLocation = useCallback(async () => {
    try {
      setIsLoading(true);
      const currentLocation = await locationService.getCurrentLocation(token);
      setLocation(currentLocation);
    } catch (error) {
      console.error('Failed to load location:', error);
      setLocation(null);
      // Don't show error for missing location - it's expected for new users
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const updateLocationFromGPS = useCallback(async (): Promise<LocationData> => {
    try {
      setIsUpdatingGPS(true);
      const updatedLocation = await locationService.updateLocationFromGPS(token);
      setLocation(updatedLocation);
      onSuccess?.(`✅ Location updated to ${updatedLocation.city || 'your area'}`);
      return updatedLocation;
    } catch (error) {
      console.error('GPS update failed:', error);
      const errorMessage = 'GPS update failed. Please check your browser permissions.';
      onError?.(errorMessage);
      throw error;
    } finally {
      setIsUpdatingGPS(false);
    }
  }, [token, onSuccess, onError]);

  const updateLocationManually = useCallback(async (latitude: number, longitude: number): Promise<LocationData> => {
    try {
      setSaving(true);
      const updatedLocation = await locationService.updateLocation(token, {
        latitude,
        longitude,
        source: 'manual'
      });
      setLocation(updatedLocation);
      onSuccess?.(`✅ Location changed to ${updatedLocation.city || 'your area'}`);
      return updatedLocation;
    } catch (error) {
      console.error('Manual location update failed:', error);
      if (axios.isAxiosError(error)) {
        const errorMsg = error.response?.data?.message || 'Failed to save location. Please try again.';
        onError?.(errorMsg);
      } else {
        onError?.('Failed to save location. Please try again.');
      }
      throw error;
    } finally {
      setSaving(false);
    }
  }, [token, onSuccess, onError]);

  const setLocationFromIP = useCallback(async (): Promise<LocationData> => {
    try {
      const ipLocation = await locationService.setLocationFromIP(token);
      setLocation(ipLocation);
      onSuccess?.(`📍 Location set to ${ipLocation.city || 'your area'}`);
      return ipLocation;
    } catch (error) {
      console.error('IP location setup failed:', error);
      const errorMessage = 'Failed to get location. Please try again.';
      onError?.(errorMessage);
      throw error;
    }
  }, [token, onSuccess, onError]);

  const setupLocationFlow = useCallback(async (): Promise<{ location: LocationData; source: 'gps' | 'ip' }> => {
    try {
      const result = await locationService.setupLocationFlow(token);
      setLocation(result.location);

      const sourceMessages = {
        gps: `✅ Location updated to ${result.location.city || 'your area'}`,
        ip: `📍 Location set to ${result.location.city || 'your area'}`
      };

      onSuccess?.(sourceMessages[result.source]);
      return result;
    } catch (error) {
      console.error('Location setup flow failed:', error);
      const errorMessage = 'Failed to set up location. Please try again.';
      onError?.(errorMessage);
      throw error;
    }
  }, [token, onSuccess, onError]);

  // Helper function to fix the setSaving error
  const setSaving = (saving: boolean) => {
    setIsSaving(saving);
  };

  return {
    location,
    isLoading,
    isUpdatingGPS,
    isSaving,
    loadLocation,
    updateLocationFromGPS,
    updateLocationManually,
    setLocationFromIP,
    setupLocationFlow,
    setLocation,
  };
};

export default useLocation;
