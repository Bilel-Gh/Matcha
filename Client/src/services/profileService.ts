import axios from 'axios';

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

interface ApiResponse<T> {
  status: string;
  data: T;
  message?: string;
}

const profileService = {
  async getProfile(token: string): Promise<ProfileData> {
    try {
      const response = await axios.get<ApiResponse<ProfileData>>(`${API_URL}/api/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data.data;
    } catch (error) {
      throw error;
    }
  },

  async getUserInfo(token: string): Promise<{ username: string; email: string; first_name: string; last_name: string; profile_picture_url?: string }> {
    try {
      const response = await axios.get<ApiResponse<ProfileData>>(`${API_URL}/api/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const profile = response.data.data;

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
    } catch (error) {
      throw error;
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
      return response.data.data;
    } catch (error) {
      throw error;
    }
  },

  async changePassword(token: string, data: PasswordChangeData): Promise<void> {
    try {
      await axios.put<ApiResponse<void>>(`${API_URL}/api/profile/password`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      throw error;
    }
  },
};

export default profileService;
