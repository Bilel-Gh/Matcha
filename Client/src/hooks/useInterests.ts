import { useState, useCallback } from 'react';
import interestService, { Interest, UserInterest } from '../services/interestService';
import axios from 'axios';

interface UseInterestsReturn {
  userInterests: UserInterest[];
  searchResults: Interest[];
  popularInterests: Interest[];
  isLoading: boolean;
  isSearching: boolean;
  isAddingInterest: boolean;
  isRemovingInterest: boolean;
  removingInterestId: number | null;
  loadUserInterests: () => Promise<void>;
  searchInterests: (query: string) => Promise<void>;
  addExistingInterest: (interest: Interest) => Promise<void>;
  createAndAddInterest: (name: string) => Promise<void>;
  removeInterest: (interestId: number) => Promise<void>;
  setUserInterests: React.Dispatch<React.SetStateAction<UserInterest[]>>;
  setSearchResults: React.Dispatch<React.SetStateAction<Interest[]>>;
  setPopularInterests: React.Dispatch<React.SetStateAction<Interest[]>>;
}

export const useInterests = (
  token: string,
  onSuccess?: (message: string) => void,
  onError?: (message: string) => void,
  maxInterests: number = 10
): UseInterestsReturn => {
  const [userInterests, setUserInterests] = useState<UserInterest[]>([]);
  const [searchResults, setSearchResults] = useState<Interest[]>([]);
  const [popularInterests, setPopularInterests] = useState<Interest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isAddingInterest, setIsAddingInterest] = useState(false);
  const [isRemovingInterest, setIsRemovingInterest] = useState(false);
  const [removingInterestId, setRemovingInterestId] = useState<number | null>(null);

  const loadUserInterests = useCallback(async () => {
    try {
      setIsLoading(true);
      const interests = await interestService.getUserInterests(token);
      setUserInterests(interests);
    } catch (error) {
      console.error('Failed to load user interests:', error);
      onError?.('Failed to load your interests. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [token, onError]);

  const searchInterests = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const results = await interestService.searchInterests(token, query);
      setSearchResults(results);
    } catch (error) {
      console.error('Failed to search interests:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [token]);

  const addExistingInterest = useCallback(async (interest: Interest) => {
    if (userInterests.length >= maxInterests) {
      onError?.(`You can only have up to ${maxInterests} interests.`);
      return;
    }

    if (userInterests.some(ui => ui.interest_id === interest.id)) {
      onError?.('You already have this interest.');
      return;
    }

    try {
      setIsAddingInterest(true);
      await interestService.addUserInterest(token, interest.id);

      // Add to local state optimistically
      const newUserInterest: UserInterest = {
        id: Date.now(), // Temporary ID
        user_id: 0, // Will be set by server
        interest_id: interest.id,
        interest: interest,
        created_at: new Date().toISOString(),
      };

      setUserInterests(prev => [...prev, newUserInterest]);
      onSuccess?.(`Added "${interest.name}" to your interests!`);
    } catch (error) {
      console.error('Failed to add interest:', error);
      if (axios.isAxiosError(error)) {
        const errorMsg = error.response?.data?.message || 'Failed to add interest. Please try again.';
        onError?.(errorMsg);
      } else {
        onError?.('Failed to add interest. Please try again.');
      }
    } finally {
      setIsAddingInterest(false);
    }
  }, [token, userInterests, maxInterests, onSuccess, onError]);

  const createAndAddInterest = useCallback(async (name: string) => {
    if (userInterests.length >= maxInterests) {
      onError?.(`You can only have up to ${maxInterests} interests.`);
      return;
    }

    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      onError?.('Interest name must be at least 2 characters long.');
      return;
    }

    if (trimmedName.length > 30) {
      onError?.('Interest name must be less than 30 characters.');
      return;
    }

    try {
      setIsAddingInterest(true);
      await interestService.addInterestByName(token, trimmedName);

      // Reload user interests to get the new one
      await loadUserInterests();
      onSuccess?.(`Added "${trimmedName}" to your interests!`);
    } catch (error) {
      console.error('Failed to create and add interest:', error);
      if (axios.isAxiosError(error)) {
        const errorMsg = error.response?.data?.message || 'Failed to add interest. Please try again.';
        onError?.(errorMsg);
      } else {
        onError?.('Failed to add interest. Please try again.');
      }
    } finally {
      setIsAddingInterest(false);
    }
  }, [token, userInterests, maxInterests, loadUserInterests, onSuccess, onError]);

  const removeInterest = useCallback(async (interestId: number) => {
    const interestToRemove = userInterests.find(ui => ui.interest_id === interestId);
    if (!interestToRemove) return;

    try {
      setIsRemovingInterest(true);
      setRemovingInterestId(interestId);

      await interestService.removeUserInterest(token, interestId);

      // Remove from local state
      setUserInterests(prev => prev.filter(ui => ui.interest_id !== interestId));
      onSuccess?.(`Removed "${interestToRemove.interest.name}" from your interests.`);
    } catch (error) {
      console.error('Failed to remove interest:', error);
      if (axios.isAxiosError(error)) {
        const errorMsg = error.response?.data?.message || 'Failed to remove interest. Please try again.';
        onError?.(errorMsg);
      } else {
        onError?.('Failed to remove interest. Please try again.');
      }
    } finally {
      setIsRemovingInterest(false);
      setRemovingInterestId(null);
    }
  }, [token, userInterests, onSuccess, onError]);

  return {
    userInterests,
    searchResults,
    popularInterests,
    isLoading,
    isSearching,
    isAddingInterest,
    isRemovingInterest,
    removingInterestId,
    loadUserInterests,
    searchInterests,
    addExistingInterest,
    createAndAddInterest,
    removeInterest,
    setUserInterests,
    setSearchResults,
    setPopularInterests,
  };
};
