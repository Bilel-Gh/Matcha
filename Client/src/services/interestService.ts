import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface Interest {
  id: number;
  name: string;
  tag: string;
  created_at: string;
}

export interface UserInterest {
  id: number;
  user_id: number;
  interest_id: number;
  interest: Interest;
  created_at: string;
}

interface ApiResponse<T> {
  status: 'success' | 'error';
  data: T;
  message?: string;
}

interface SearchInterestsResponse {
  interests: Interest[];
  total: number;
}

interface UserInterestsResponse {
  interests: UserInterest[];
  count: number;
}

const interestService = {
  // Get all available interests
  async getAllInterests(token: string): Promise<Interest[]> {
    try {
      const response = await axios.get<ApiResponse<Interest[]>>(`${API_URL}/api/interests`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.status !== 'success') {
        throw new Error(response.data.message || 'Failed to get interests');
      }

      // Handle case where data might be an object with interests array
      const data = response.data.data;
      if (Array.isArray(data)) {
        return data;
      } else if (data && typeof data === 'object' && 'interests' in data) {
        return (data as any).interests;
      } else {
        return [];
      }
    } catch (error) {
      throw error;
    }
  },

  // Search interests with query
  async searchInterests(token: string, query: string): Promise<Interest[]> {
    try {
      const response = await axios.get<ApiResponse<SearchInterestsResponse>>(`${API_URL}/api/interests/search`, {
        params: { q: query },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.status !== 'success') {
        throw new Error(response.data.message || 'Failed to search interests');
      }

      return response.data.data.interests;
    } catch (error) {
      throw error;
    }
  },

  // Create new interest
  async createInterest(token: string, name: string): Promise<Interest> {
    try {
      const response = await axios.post<ApiResponse<Interest>>(`${API_URL}/api/interests`,
        { name },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.status !== 'success') {
        throw new Error(response.data.message || 'Failed to create interest');
      }

      return response.data.data;
    } catch (error) {
      throw error;
    }
  },

  // Get user's current interests
  async getUserInterests(token: string): Promise<UserInterest[]> {
    try {
      const response = await axios.get<ApiResponse<UserInterestsResponse>>(`${API_URL}/api/profile/interests`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.status !== 'success') {
        throw new Error(response.data.message || 'Failed to get user interests');
      }

      const data = response.data.data;

      // Handle different response formats
      if (Array.isArray(data)) {
        return data;
      } else if (data && data.interests && Array.isArray(data.interests)) {
        return data.interests;
      } else {
        return [];
      }
    } catch (error) {
      throw error;
    }
  },

  // Update user interests (bulk replace)
  async updateUserInterests(token: string, interestIds: number[]): Promise<UserInterest[]> {
    try {
      const response = await axios.put<ApiResponse<UserInterestsResponse>>(`${API_URL}/api/profile/interests`,
        { interest_ids: interestIds },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.status !== 'success') {
        throw new Error(response.data.message || 'Failed to update user interests');
      }

      return response.data.data.interests;
    } catch (error) {
      throw error;
    }
  },

  // Add single interest to user
  async addUserInterest(token: string, interestId: number): Promise<void> {
    try {
      const response = await axios.post<ApiResponse<any>>(`${API_URL}/api/profile/interests/add/${interestId}`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.status !== 'success') {
        throw new Error(response.data.message || 'Failed to add interest');
      }
    } catch (error) {
      throw error;
    }
  },

  // Remove interest from user
  async removeUserInterest(token: string, interestId: number): Promise<void> {
    try {
      const response = await axios.delete<ApiResponse<any>>(`${API_URL}/api/profile/interests/remove/${interestId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.status !== 'success') {
        throw new Error(response.data.message || 'Failed to remove interest');
      }
    } catch (error) {
      throw error;
    }
  },

  // Add interest by name (auto-create if doesn't exist)
  async addInterestByName(token: string, name: string): Promise<void> {
    try {
      const response = await axios.post<ApiResponse<any>>(`${API_URL}/api/profile/interests/add-by-name`,
        { name },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.status !== 'success') {
        throw new Error(response.data.message || 'Failed to add interest');
      }
    } catch (error) {
      throw error;
    }
  },
};

export default interestService;
