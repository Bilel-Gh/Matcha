import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface LocationData {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
  location_source: 'gps' | 'ip' | 'manual';
  location_updated_at: string;
}

export interface LocationUpdateData {
  latitude: number;
  longitude: number;
  source: 'gps' | 'ip' | 'manual';
}

export interface AddressData {
  city: string;
  country: string;
  display_name: string;
}

export interface DistanceData {
  distance_km: number;
}

interface ApiResponse<T> {
  status: string;
  data: T;
  message?: string;
}

// GPS options for high accuracy
const GPS_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 600000 // 10 minutes
};

const locationService = {
  // Get current user's location
  async getCurrentLocation(token: string): Promise<LocationData> {
    try {
      const response = await axios.get<ApiResponse<LocationData>>(`${API_URL}/api/profile/location`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data.data;
    } catch (error) {
      console.error('Get location service error:', error);
      throw error;
    }
  },

  // Update location with coordinates
  async updateLocation(token: string, data: LocationUpdateData): Promise<LocationData> {
    try {
      const response = await axios.put<ApiResponse<LocationData>>(`${API_URL}/api/profile/location`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data.data;
    } catch (error) {
      console.error('Update location service error:', error);
      throw error;
    }
  },

  // Get location from IP address
  async getLocationFromIP(token: string): Promise<{ latitude: number; longitude: number; city: string; country: string }> {
    try {
      const response = await axios.post<ApiResponse<{ latitude: number; longitude: number; city: string; country: string }>>(`${API_URL}/api/location/ip`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data.data;
    } catch (error) {
      console.error('Get IP location service error:', error);
      throw error;
    }
  },

  // Set location from IP (automatic)
  async setLocationFromIP(token: string): Promise<LocationData> {
    try {
      const response = await axios.post<ApiResponse<LocationData>>(`${API_URL}/api/location/set-from-ip`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data.data;
    } catch (error) {
      console.error('Set IP location service error:', error);
      throw error;
    }
  },

  // Get address from coordinates
  async getAddressFromCoords(token: string, latitude: number, longitude: number): Promise<AddressData> {
    try {
      const response = await axios.get<ApiResponse<AddressData>>(`${API_URL}/api/location/reverse-geocode`, {
        params: { latitude, longitude },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data.data;
    } catch (error) {
      console.error('Reverse geocode service error:', error);
      throw error;
    }
  },

  // Calculate distance between two points
  async calculateDistance(
    token: string,
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): Promise<DistanceData> {
    try {
      const response = await axios.get<ApiResponse<DistanceData>>(`${API_URL}/api/location/distance`, {
        params: { lat1, lng1, lat2, lng2 },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data.data;
    } catch (error) {
      console.error('Calculate distance service error:', error);
      throw error;
    }
  },

  // Request GPS location from browser
  async requestGPSLocation(): Promise<{ latitude: number; longitude: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          let errorMessage = 'Failed to get GPS location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'GPS permission denied by user';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'GPS position unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'GPS request timed out';
              break;
          }
          reject(new Error(errorMessage));
        },
        GPS_OPTIONS
      );
    });
  },

  // Update location from GPS coordinates
  async updateLocationFromGPS(token: string): Promise<LocationData> {
    try {
      const coords = await this.requestGPSLocation();
      return await this.updateLocation(token, {
        latitude: coords.latitude,
        longitude: coords.longitude,
        source: 'gps'
      });
    } catch (error) {
      console.error('Update location from GPS error:', error);
      throw error;
    }
  },

  // Complete location setup flow with GPS fallback to IP
  async setupLocationFlow(token: string): Promise<{ location: LocationData; source: 'gps' | 'ip' }> {
    try {
      // Try GPS first
      const location = await this.updateLocationFromGPS(token);
      return { location, source: 'gps' };
    } catch (gpsError) {
      console.log('GPS failed, falling back to IP location:', gpsError);
      // Fallback to IP location
      try {
        const location = await this.setLocationFromIP(token);
        return { location, source: 'ip' };
      } catch (ipError) {
        console.error('Both GPS and IP location failed:', ipError);
        throw new Error('Unable to determine location');
      }
    }
  },

  // Validate coordinates
  validateCoordinates(latitude: number, longitude: number): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (isNaN(latitude) || latitude < -90 || latitude > 90) {
      errors.push('Latitude must be between -90 and 90');
    }

    if (isNaN(longitude) || longitude < -180 || longitude > 180) {
      errors.push('Longitude must be between -180 and 180');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  },

  // Format time ago
  formatTimeAgo(dateString: string): string {
    if (!dateString) {
      return 'never';
    }

    const date = new Date(dateString);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'unknown';
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) {
      return 'just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  },

  // Format location source for display
  formatLocationSource(source: string): string {
    if (!source) {
      return 'Unknown';
    }

    switch (source.toLowerCase()) {
      case 'gps':
        return 'GPS';
      case 'ip':
        return 'Approximate';
      case 'manual':
        return 'Manual';
      default:
        return 'Unknown';
    }
  },

  // Get address from coordinates with fallback
  async tryToGetAddress(token: string, latitude: number, longitude: number): Promise<{ city?: string; country?: string }> {
    try {
      const address = await this.getAddressFromCoords(token, latitude, longitude);
      return { city: address.city, country: address.country };
    } catch (error) {
      console.warn('Failed to get address for coordinates:', error);
      return {};
    }
  }
};

export default locationService;
