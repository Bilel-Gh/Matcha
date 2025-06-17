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
      console.error('Get profile service error:', error);
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
      console.error('Update profile service error:', error);
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
      console.error('Change password service error:', error);
      throw error;
    }
  },
};

export default profileService;
