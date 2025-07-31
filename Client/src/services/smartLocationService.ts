import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface LocationData {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
  location_source: 'gps' | 'ip' | 'search';
  location_updated_at: string;
}

export interface CitySearchResult {
  id: string;
  name: string;
  country: string;
  display_name: string;
  latitude: number;
  longitude: number;
}

interface ApiResponse<T> {
  status: string;
  data: T;
  message?: string;
}

const smartLocationService = {
  // Auto-setup location intelligently (GPS -> IP fallback)
  async autoSetupLocation(token: string): Promise<LocationData> {
    try {
      // Try GPS first (silently, no user prompt)
      const gpsLocation = await this.tryGPSLocation();
      if (gpsLocation) {
        try {
          return await this.updateLocationCoords(token, gpsLocation.latitude, gpsLocation.longitude, 'gps');
        } catch (error) {
          // Silent failure - will try IP fallback
        }
      }
    } catch (error) {
      // Silent failure - will try IP fallback
    }

    // Fallback to IP location (automatic, no user permission needed)
    try {
      return await this.setLocationFromIP(token);
    } catch (error: any) {
      // Silent failure
      throw new Error('Unable to determine your location automatically. Please try setting it manually.');
    }
  },

  // Try GPS location silently
  async tryGPSLocation(): Promise<{ latitude: number; longitude: number } | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      const timeout = setTimeout(() => {
        resolve(null);
      }, 5000); // 5 second timeout

      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(timeout);
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        () => {
          clearTimeout(timeout);
          resolve(null); // Don't throw, just return null
        },
        {
          enableHighAccuracy: false, // Faster response
          timeout: 5000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  },

  // Get current location
  async getCurrentLocation(token: string): Promise<LocationData | null> {
    try {
      const response = await axios.get<ApiResponse<LocationData>>(`${API_URL}/api/profile/location`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data;
    } catch (error) {
      return null; // Return null instead of throwing for missing location
    }
  },

  // Set location from IP (automatic)
  async setLocationFromIP(token: string): Promise<LocationData> {
    const response = await axios.post<ApiResponse<LocationData>>(`${API_URL}/api/location/set-from-ip`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data;
  },

  // Update location with coordinates
  async updateLocationCoords(token: string, latitude: number, longitude: number, source: 'gps' | 'ip' | 'search'): Promise<LocationData> {
    const response = await axios.put<ApiResponse<LocationData>>(`${API_URL}/api/profile/location`, {
      latitude,
      longitude,
      source
    }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data;
  },

    // Search cities for location selection
  async searchCities(query: string, token: string): Promise<CitySearchResult[]> {
    if (query.length < 2) return [];

    try {
      const response = await axios.get<ApiResponse<CitySearchResult[]>>(`${API_URL}/api/location/search-cities`, {
        params: { q: query, limit: 10 },
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000,
      });

      const cities = response.data.data || [];
      return cities;
    } catch (error: any) {
      // Silent failure - return empty results
      return [];
    }
  },

  // Set location from city search
  async setLocationFromCity(token: string, city: CitySearchResult): Promise<LocationData> {
    try {
      const response = await axios.put<ApiResponse<LocationData>>(`${API_URL}/api/profile/location`, {
        latitude: city.latitude,
        longitude: city.longitude,
        source: 'search',
        city: city.name,
        country: city.country
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
              return response.data.data;
      } catch (error: any) {
        // Silent failure - rethrow for caller to handle
        throw error;
      }
  },

  // Force GPS update
  async forceGPSUpdate(token: string): Promise<LocationData> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('GPS not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const location = await this.updateLocationCoords(
              token,
              position.coords.latitude,
              position.coords.longitude,
              'gps'
            );
            resolve(location);
          } catch (error) {
            reject(error);
          }
        },
        (error) => {
          let message = 'GPS failed';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = 'GPS permission denied. Please enable location access.';
              break;
            case error.POSITION_UNAVAILABLE:
              message = 'GPS position unavailable. Please try again.';
              break;
            case error.TIMEOUT:
              message = 'GPS request timed out. Please try again.';
              break;
          }
          reject(new Error(message));
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 60000
        }
      );
    });
  },

  // Get address from coordinates
  async getAddressFromCoords(token: string, latitude: number, longitude: number): Promise<{ city?: string; country?: string }> {
    try {
      const response = await axios.get(`${API_URL}/api/location/reverse-geocode`, {
        params: { latitude, longitude },
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data;
    } catch (error) {
      return {};
    }
  },

  // Format location display
  formatLocationDisplay(location: LocationData): string {
    if (location.city && location.country) {
      return `${location.city}, ${location.country}`;
    }
    return `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
  },

  // Format location source
  formatLocationSource(source: string): string {
    switch (source) {
      case 'gps': return 'GPS';
      case 'ip': return 'Approximate';
      case 'search': return 'Selected';
      default: return 'Unknown';
    }
  },

  // Format time ago
  formatTimeAgo(dateString: string): string {
    if (!dateString) return 'never';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'unknown';

    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  },

  // Check if location needs setup
  needsLocationSetup(location: LocationData | null): boolean {
    return !location || (!location.latitude || !location.longitude);
  }
};

export default smartLocationService;
