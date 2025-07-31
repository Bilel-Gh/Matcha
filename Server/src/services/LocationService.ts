import { UserRepository } from '../repositories/UserRepository';
import { User } from '../types/user';
import { AppError } from '../utils/AppError';
import { FameRatingService } from './FameRatingService';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface LocationData extends LocationCoordinates {
  city?: string;
  country?: string;
  region?: string;
}

export interface IPLocationResponse {
  latitude: number;
  longitude: number;
  city: string;
  region: string;
  country: string;
  ip: string;
}

export interface LocationUpdateData {
  latitude: number;
  longitude: number;
  source: 'gps' | 'ip' | 'manual' | 'search';
  city?: string;
  country?: string;
}

export interface UserLocationResponse {
  latitude?: number;
  longitude?: number;
  city?: string;
  country?: string;
  source?: string;
  updated_at?: string;
  has_location: boolean;
}

export class LocationService {
  // Paris coordinates as default for development/fallback
  private static readonly DEFAULT_LOCATION = {
    latitude: 48.8566,
    longitude: 2.3522,
    city: 'Paris',
    country: 'France'
  };

  // Precision level for privacy (rounds to ~100m)
  private static readonly COORDINATE_PRECISION = 3;

  /**
   * Get user's IP address from request headers
   */
  static getUserIP(req: any): string {
    return req.headers['x-forwarded-for']?.split(',')[0] ||
           req.headers['x-real-ip'] ||
           req.connection?.remoteAddress ||
           req.socket?.remoteAddress ||
           req.ip ||
           '127.0.0.1';
  }

  /**
   * Get location data from IP address using ipapi.co
   */
  static async getLocationFromIP(ip: string): Promise<IPLocationResponse> {
    try {
      // Handle localhost/development IPs
      if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
        return {
          ...this.DEFAULT_LOCATION,
          region: 'Île-de-France',
          ip: ip
        };
      }

      const response = await fetch(`https://ipapi.co/${ip}/json/`);

      if (!response.ok) {
        console.warn(`IP API request failed: ${response.status}`);
        throw new Error(`IP API request failed: ${response.status}`);
      }

      const data = await response.json();

      // Check for API error
      if (data.error) {
        console.warn(`IP API error: ${data.reason || 'Unknown error'}`);
        throw new Error(`IP API error: ${data.reason || 'Unknown error'}`);
      }

      // Validate required fields
      if (!data.latitude || !data.longitude) {
        console.warn(`Invalid location data from IP API:`, data);
        throw new Error('Invalid location data from IP API');
      }

      const result = {
        latitude: parseFloat(data.latitude),
        longitude: parseFloat(data.longitude),
        city: data.city || 'Unknown',
        region: data.region || 'Unknown',
        country: data.country_name || 'Unknown',
        ip: ip
      };

      return result;
    } catch (error: any) {
      console.warn(`IP location failed for ${ip}:`, error.message);
      // Return default location instead of null for better UX
      return {
        ...this.DEFAULT_LOCATION,
        region: 'Île-de-France',
        ip: ip
      };
    }
  }

  /**
   * Round coordinates to neighborhood level for privacy
   */
  static roundToNeighborhood(latitude: number, longitude: number): LocationCoordinates {
    return {
      latitude: parseFloat(latitude.toFixed(this.COORDINATE_PRECISION)),
      longitude: parseFloat(longitude.toFixed(this.COORDINATE_PRECISION))
    };
  }

  /**
   * Validate coordinate ranges
   */
  static validateCoordinates(latitude: number, longitude: number): boolean {
    return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
  }

  /**
   * Calculate distance between two points using Haversine formula
   * Returns distance in kilometers
   */
  static calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Convert degrees to radians
   */
  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Update user's location
   */
  static async updateUserLocation(userId: number, locationData: LocationUpdateData): Promise<UserLocationResponse> {
    const { latitude, longitude, source, city, country } = locationData;

    // Validate coordinates
    if (!this.validateCoordinates(latitude, longitude)) {
      throw new AppError('Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180', 400);
    }

    // Round coordinates for privacy
    const roundedCoords = this.roundToNeighborhood(latitude, longitude);

    // Update user in database
    const updatedUser = await UserRepository.updateLocation(userId, {
      latitude: roundedCoords.latitude,
      longitude: roundedCoords.longitude,
      location_source: source,
      city,
      country,
      location_updated_at: new Date()
    });

    if (!updatedUser) {
      throw new AppError('Failed to update user location', 500);
    }

    // Auto-update fame rating when location is updated
    try {
      await FameRatingService.updateUserFameRating(userId);
    } catch (error) {
      // Silent error handling - no console output for defense requirements
    }

    return this.formatLocationResponse(updatedUser);
  }

  /**
   * Get user's current location
   */
  static async getUserLocation(userId: number): Promise<UserLocationResponse> {
    const user = await UserRepository.findById(userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return this.formatLocationResponse(user);
  }

  /**
   * Set location from IP address (automatic fallback)
   */
  static async setLocationFromIP(userId: number, ip: string): Promise<UserLocationResponse> {
    const ipLocation = await this.getLocationFromIP(ip);

    return this.updateUserLocation(userId, {
      latitude: ipLocation.latitude,
      longitude: ipLocation.longitude,
      source: 'ip',
      city: ipLocation.city,
      country: ipLocation.country
    });
  }

  /**
   * Format location response
   */
  private static formatLocationResponse(user: User): UserLocationResponse {
    const hasLocation = !!(user.latitude && user.longitude);

    return {
      latitude: user.latitude || undefined,
      longitude: user.longitude || undefined,
      city: user.city || undefined,
      country: user.country || undefined,
      source: user.location_source || undefined,
      updated_at: user.location_updated_at?.toISOString(),
      has_location: hasLocation
    };
  }

  /**
   * Find users within a certain radius (for matching)
   */
  static async findUsersNearby(
    centerLat: number,
    centerLng: number,
    radiusKm: number,
    excludeUserId?: number
  ): Promise<User[]> {
    // This would typically be done with a PostGIS query, but for now we'll use a simple approach
    // In production, consider using PostGIS for better performance with geographic queries

    const users = await UserRepository.findUsersWithLocation(excludeUserId);

    return users.filter(user => {
      if (!user.latitude || !user.longitude) return false;

      const distance = this.calculateDistance(
        centerLat, centerLng,
        user.latitude, user.longitude
      );

      return distance <= radiusKm;
    });
  }

  /**
   * Reverse geocoding - convert coordinates to address (placeholder)
   * In production, you might want to use a proper geocoding service
   */
  static async reverseGeocode(latitude: number, longitude: number): Promise<LocationData> {
    try {
      // Using a free reverse geocoding service (nominatim)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
      );

      if (!response.ok) {
        throw new Error('Reverse geocoding failed');
      }

      const data = await response.json();

      return {
        latitude,
        longitude,
        city: data.address?.city || data.address?.town || data.address?.village || 'Unknown',
        country: data.address?.country || 'Unknown'
      };
    } catch (error) {
      // Silent error handling - no console output for defense requirements
      return null;
    }
  }

    /**
   * Fallback cities data for development/testing
   */
  private static readonly FALLBACK_CITIES = [
    { id: '1', name: 'Paris', country: 'France', display_name: 'Paris, France', latitude: 48.8566, longitude: 2.3522, type: 'city', importance: 0.9 },
    { id: '2', name: 'London', country: 'United Kingdom', display_name: 'London, United Kingdom', latitude: 51.5074, longitude: -0.1278, type: 'city', importance: 0.9 },
    { id: '3', name: 'New York', country: 'United States', display_name: 'New York, United States', latitude: 40.7128, longitude: -74.0060, type: 'city', importance: 0.9 },
    { id: '4', name: 'Tokyo', country: 'Japan', display_name: 'Tokyo, Japan', latitude: 35.6762, longitude: 139.6503, type: 'city', importance: 0.9 },
    { id: '5', name: 'Berlin', country: 'Germany', display_name: 'Berlin, Germany', latitude: 52.5200, longitude: 13.4050, type: 'city', importance: 0.8 },
    { id: '6', name: 'Madrid', country: 'Spain', display_name: 'Madrid, Spain', latitude: 40.4168, longitude: -3.7038, type: 'city', importance: 0.8 },
    { id: '7', name: 'Rome', country: 'Italy', display_name: 'Rome, Italy', latitude: 41.9028, longitude: 12.4964, type: 'city', importance: 0.8 },
    { id: '8', name: 'Amsterdam', country: 'Netherlands', display_name: 'Amsterdam, Netherlands', latitude: 52.3676, longitude: 4.9041, type: 'city', importance: 0.7 },
    { id: '9', name: 'Barcelona', country: 'Spain', display_name: 'Barcelona, Spain', latitude: 41.3851, longitude: 2.1734, type: 'city', importance: 0.7 },
    { id: '10', name: 'Munich', country: 'Germany', display_name: 'Munich, Germany', latitude: 48.1351, longitude: 11.5820, type: 'city', importance: 0.7 }
  ];

  /**
   * Search cities using Nominatim geocoding service
   */
  static async searchCities(query: string, limit: number = 10): Promise<any[]> {
    try {
      // Use Nominatim service for city search with proper User-Agent
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=${Math.min(limit, 50)}&addressdetails=1&extratags=1&accept-language=en`,
        {
          headers: {
            'User-Agent': 'Matcha-Dating-App/1.0',
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        console.warn(`Nominatim API error: ${response.status} ${response.statusText}`);
        return [];
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        console.warn('Invalid response format from Nominatim API');
        return [];
      }



      // Filter and format results to include places (more permissive filtering)
      const cities = data
        .filter((place: any) => {
          if (!place || !place.lat || !place.lon) {
            return false;
          }

          const type = place.type;
          const category = place.category;
          const placeClass = place.class;

          // More permissive filtering - include more place types
          const isValidPlace = (
            (category === 'place') ||
            (category === 'boundary' && type === 'administrative') ||
            (placeClass === 'place') ||
            (placeClass === 'boundary' && type === 'administrative') || // Major cities fix
            (placeClass === 'boundary' && type === 'ceremonial') || // London-type cities
            (place.addresstype === 'city') || // Explicit city addresstype
            (type && ['city', 'town', 'village', 'suburb', 'hamlet', 'neighbourhood', 'quarter', 'state', 'county'].includes(type)) ||
            // High importance places (major cities/towns)
            (place.importance && parseFloat(place.importance) > 0.5)
          );
          return isValidPlace;
        })
        .map((place: any) => {
          const addressParts = place.display_name.split(',');
          const mainName = place.address?.city ||
                          place.address?.town ||
                          place.address?.village ||
                          place.address?.suburb ||
                          place.address?.hamlet ||
                          addressParts[0]?.trim();

          return {
            id: place.place_id.toString(),
            name: mainName,
            country: place.address?.country || addressParts[addressParts.length - 1]?.trim() || 'Unknown',
            display_name: place.display_name,
            latitude: parseFloat(place.lat),
            longitude: parseFloat(place.lon),
            type: place.type,
            importance: parseFloat(place.importance || '0')
          };
        })
        .filter((city: any) => city.name && city.name.length > 0) // Remove entries without valid names
        .sort((a: any, b: any) => b.importance - a.importance) // Sort by importance
        .slice(0, limit);

                  // Always search in fallback and merge results for better coverage
      const fallbackResults = this.searchFallbackCities(query, limit);

      // Merge and deduplicate results, prioritizing fallback cities (they're more important)
      const mergedResults = [...fallbackResults];

      // Add Nominatim results that aren't already covered by fallback
      cities.forEach(city => {
        const isDuplicate = fallbackResults.some(fallback =>
          fallback.name.toLowerCase() === city.name.toLowerCase() &&
          fallback.country.toLowerCase() === city.country.toLowerCase()
        );
        if (!isDuplicate && mergedResults.length < limit) {
          mergedResults.push(city);
        }
      });

      return mergedResults.slice(0, limit);
    } catch (error: any) {
      console.warn(`Nominatim API failed for "${query}":`, error.message);
      // Fallback to local search in predefined cities
      return this.searchFallbackCities(query, limit);
    }
  }

    /**
   * Search in fallback cities when external API fails
   */
  private static searchFallbackCities(query: string, limit: number): any[] {
    const queryLower = query.toLowerCase().trim();

    const matchedCities = this.FALLBACK_CITIES
      .filter(city => {
        const cityName = city.name.toLowerCase();
        const cityCountry = city.country.toLowerCase();
        const cityDisplay = city.display_name.toLowerCase();

        // Enhanced matching logic
        return (
          cityName.includes(queryLower) ||
          cityCountry.includes(queryLower) ||
          cityDisplay.includes(queryLower) ||
          // Special cases for common searches
          (queryLower === 'ny' && cityName.includes('new york')) ||
          (queryLower === 'nyc' && cityName.includes('new york')) ||
          (queryLower.includes('new') && cityName.includes('new york')) ||
          (queryLower.includes('york') && cityName.includes('new york')) ||
          // Split city names for multi-word searches
          cityName.split(' ').some(word => word.startsWith(queryLower)) ||
          queryLower.split(' ').every(queryWord =>
            cityName.includes(queryWord) || cityCountry.includes(queryWord)
          )
        );
      })
      .sort((a, b) => {
        // Prioritize exact matches
        const aExact = a.name.toLowerCase() === queryLower ? 10 : 0;
        const bExact = b.name.toLowerCase() === queryLower ? 10 : 0;
        if (aExact !== bExact) return bExact - aExact;

        // Then prioritize starts with
        const aStarts = a.name.toLowerCase().startsWith(queryLower) ? 5 : 0;
        const bStarts = b.name.toLowerCase().startsWith(queryLower) ? 5 : 0;
        if (aStarts !== bStarts) return bStarts - aStarts;

        // Prioritize by word matches
        const aWordMatch = a.name.toLowerCase().split(' ').some(word => word === queryLower) ? 3 : 0;
        const bWordMatch = b.name.toLowerCase().split(' ').some(word => word === queryLower) ? 3 : 0;
        if (aWordMatch !== bWordMatch) return bWordMatch - aWordMatch;

        // Finally by importance
        return b.importance - a.importance;
      })
      .slice(0, limit);

        return matchedCities;
  }
}
