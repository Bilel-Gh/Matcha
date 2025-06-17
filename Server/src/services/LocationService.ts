import { UserRepository } from '../repositories/UserRepository';
import { User } from '../types/user';
import { AppError } from '../utils/AppError';

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
  source: 'gps' | 'ip' | 'manual';
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
        throw new Error(`IP API request failed: ${response.status}`);
      }

      const data = await response.json();

      // Check for API error
      if (data.error) {
        throw new Error(`IP API error: ${data.reason || 'Unknown error'}`);
      }

      // Validate required fields
      if (!data.latitude || !data.longitude) {
        throw new Error('Invalid location data from IP API');
      }

      return {
        latitude: parseFloat(data.latitude),
        longitude: parseFloat(data.longitude),
        city: data.city || 'Unknown',
        region: data.region || 'Unknown',
        country: data.country_name || 'Unknown',
        ip: ip
      };
    } catch (error) {
      console.error('IP geolocation failed:', error);

      // Return default location on failure
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
      console.error('Reverse geocoding failed:', error);

      // Return coordinates only on failure
      return {
        latitude,
        longitude,
        city: 'Unknown',
        country: 'Unknown'
      };
    }
  }
}
