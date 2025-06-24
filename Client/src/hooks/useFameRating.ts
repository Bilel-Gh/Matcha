import { useState, useCallback } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface UseFameRatingReturn {
  isUpdating: boolean;
  updateFameRating: (userId: number) => Promise<{ fame_rating: number }>;
  error: string | null;
}

export const useFameRating = (
  token: string,
  onSuccess?: (message: string) => void,
  onError?: (message: string) => void
): UseFameRatingReturn => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateFameRating = useCallback(async (userId: number): Promise<{ fame_rating: number }> => {
    try {
      setIsUpdating(true);
      setError(null);

      const response = await axios.put(
        `${API_URL}/api/profile/fame-rating/${userId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const newRating = response.data.data.fame_rating;
      onSuccess?.(`Fame rating updated to ${newRating}!`);

      return { fame_rating: newRating };
    } catch (error) {
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.message || 'Failed to update fame rating'
        : 'Failed to update fame rating';

      setError(errorMessage);
      onError?.(errorMessage);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  }, [token, onSuccess, onError]);

  return {
    isUpdating,
    updateFameRating,
    error,
  };
};

export default useFameRating;
