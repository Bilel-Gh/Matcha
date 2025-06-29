import axios from 'axios';
import { ApiResponse, handleApiError, ApiError } from '../utils/errorMessages';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface ProfileData {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  email: string;
  gender?: string;
  sexual_preferences?: string;
  biography?: string;
  birth_date?: string;
  age?: number;
  profile_completed: boolean;
  profile_picture_url?: string;
  has_profile_picture: boolean;
  fame_rating?: number;
  // Location fields
  latitude?: number;
  longitude?: number;
  city?: string;
  country?: string;
  location_source?: 'gps' | 'ip' | 'manual';
  location_updated_at?: string;
  has_location?: boolean;
  created_at: string;
}

export interface ProfileUpdateData {
  firstname?: string;
  lastname?: string;
  email?: string;
  username?: string;
  gender?: string;
  sexual_preferences?: string;
  biography?: string;
  birth_date?: string;
}

export interface PasswordChangeData {
  current_password: string;
  new_password: string;
}

// Interface pour les erreurs du serveur
interface ServerErrorResponse {
  success: false;
  message: string;
  code?: string;
  error?: string;
  field?: string;
  details?: string[];
}

const profileService = {
  async getProfile(token: string): Promise<ProfileData> {
    try {
      const response = await axios.get<ApiResponse<ProfileData>>(`${API_URL}/api/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Le serveur utilise encore l'ancien format "status"
      if (response.data.status !== 'success') {
        throw {
          success: false,
          message: (response.data as any).message || 'Failed to get profile',
          code: (response.data as any).error
        };
      }

      return response.data.data!;
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'success' in error && error.success === false) {
        throw error;
      }
      throw handleApiError(error);
    }
  },

  async getUserInfo(token: string): Promise<{ username: string; email: string; first_name: string; last_name: string; profile_picture_url?: string }> {
    try {
      const response = await axios.get<ApiResponse<ProfileData>>(`${API_URL}/api/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Le serveur utilise encore l'ancien format "status"
      if (response.data.status !== 'success') {
        throw {
          success: false,
          message: (response.data as any).message || 'Failed to get user info',
          code: (response.data as any).error
        };
      }

      const profile = response.data.data!;

      // Ensure full URL for profile picture
      const getFullImageUrl = (url: string): string => {
        if (!url) return '';
        if (url.startsWith('http://') || url.startsWith('https://')) {
          return url;
        }
        return `${API_URL}${url}`;
      };

      return {
        username: profile.username,
        email: profile.email,
        first_name: profile.firstname,
        last_name: profile.lastname,
        profile_picture_url: profile.profile_picture_url ? getFullImageUrl(profile.profile_picture_url) : undefined,
      };
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'success' in error && error.success === false) {
        throw error;
      }
      throw handleApiError(error);
    }
  },

  async updateProfile(token: string, data: ProfileUpdateData): Promise<ProfileData> {
    try {
      const response = await axios.put<ApiResponse<ProfileData>>(`${API_URL}/api/profile`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // Le serveur utilise le format "status"
      if (response.data.status !== 'success') {
        const errorData = response.data as any;
        // Si on a des details, utiliser le premier detail comme message principal
        const message = errorData.details && errorData.details.length > 0
          ? errorData.details[0]
          : errorData.message || 'Failed to update profile';

        throw {
          success: false,
          message,
          code: errorData.code || errorData.error,
          field: errorData.field,
          details: errorData.details
        };
      }

      return response.data.data!;
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'success' in error && error.success === false) {
        throw error;
      }
      throw handleApiError(error);
    }
  },

  async changePassword(token: string, data: PasswordChangeData): Promise<void> {
    try {
      const response = await axios.post<ApiResponse<void>>(`${API_URL}/api/profile/change-password`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // Le serveur utilise le format "status"
      if (response.data.status !== 'success') {
        throw {
          success: false,
          message: (response.data as any).message || 'Failed to change password',
          code: (response.data as any).error
        };
      }
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'success' in error && error.success === false) {
        throw error;
      }
      throw handleApiError(error);
    }
  },
};

export default profileService;
