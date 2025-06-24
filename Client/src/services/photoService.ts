import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface Photo {
  id: number;
  user_id: number;
  filename: string;
  url: string;
  is_profile: boolean;
  created_at: string;
}

// Helper function to ensure full URL
const getFullImageUrl = (url: string): string => {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `${API_URL}${url}`;
};

interface ApiResponse<T> {
  status: string;
  data: T;
  message?: string;
}

const photoService = {
  async getUserPhotos(token: string): Promise<Photo[]> {
    try {
      const response = await axios.get<ApiResponse<{ photos: Photo[]; count: number; max_photos: number; has_profile_picture: boolean }>>(`${API_URL}/api/profile/photos`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const photos = response.data.data.photos;
      // Ensure all photos have full URLs
      return photos.map(photo => ({
        ...photo,
        url: getFullImageUrl(photo.url)
      }));
    } catch (error) {
      throw error;
    }
  },

  async uploadPhoto(token: string, file: File): Promise<Photo> {
    try {
      const formData = new FormData();
      formData.append('photo', file);

      const response = await axios.post<ApiResponse<{ success: boolean; photo: Photo; count: number }>>(`${API_URL}/api/profile/photos`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      const photo = response.data.data.photo;
      // Ensure photo has full URL
      return {
        ...photo,
        url: getFullImageUrl(photo.url)
      };
    } catch (error) {
      throw error;
    }
  },

  async setProfilePicture(token: string, photoId: number): Promise<void> {
    try {
      await axios.put<ApiResponse<void>>(`${API_URL}/api/profile/photos/${photoId}/profile`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      throw error;
    }
  },

  async deletePhoto(token: string, photoId: number): Promise<void> {
    try {
      await axios.delete<ApiResponse<void>>(`${API_URL}/api/profile/photos/${photoId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      throw error;
    }
  },
};

export default photoService;
