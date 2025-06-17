import React, { useState, useEffect, useCallback } from 'react';
import { FaHeart, FaTags } from 'react-icons/fa';
import interestService, { Interest, UserInterest } from '../services/interestService';
import InterestTagList from './InterestTagList';
import AddInterestInput from './AddInterestInput';
import axios from 'axios';

interface InterestsManagerProps {
  token: string;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

const InterestsManager: React.FC<InterestsManagerProps> = ({
  token,
  onSuccess,
  onError,
}) => {
  const [userInterests, setUserInterests] = useState<UserInterest[]>([]);
  const [searchResults, setSearchResults] = useState<Interest[]>([]);
  const [popularInterests, setPopularInterests] = useState<Interest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isAddingInterest, setIsAddingInterest] = useState(false);
  const [isRemovingInterest, setIsRemovingInterest] = useState(false);
  const [removingInterestId, setRemovingInterestId] = useState<number | null>(null);

  const maxInterests = 10;

  // Load user interests and popular interests on mount
  useEffect(() => {
    loadUserInterests();
    loadPopularInterests();
  }, [token]);

  const loadUserInterests = async () => {
    try {
      setIsLoading(true);
      const interests = await interestService.getUserInterests(token);
      console.log('User interests received:', interests);

      // Ensure interests is an array
      if (Array.isArray(interests)) {
        setUserInterests(interests);
      } else {
        console.warn('getUserInterests did not return an array:', interests);
        setUserInterests([]);
      }
    } catch (error) {
      console.error('Failed to load user interests:', error);
      setUserInterests([]);
      onError?.('Failed to load your interests. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPopularInterests = async () => {
    try {
      const allInterests = await interestService.getAllInterests(token);
      console.log('All interests received:', allInterests);

      // Ensure allInterests is an array
      if (Array.isArray(allInterests)) {
        // Take first 10 as popular interests for now
        setPopularInterests(allInterests.slice(0, 10));
      } else {
        console.warn('getAllInterests did not return an array:', allInterests);
        setPopularInterests([]);
      }
    } catch (error) {
      console.error('Failed to load popular interests:', error);
      setPopularInterests([]);
      // Don't show error for popular interests as it's not critical
    }
  };

  const handleSearch = useCallback(async (query: string) => {
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

  const handleAddExistingInterest = async (interest: Interest) => {
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
  };

  const handleCreateAndAddInterest = async (name: string) => {
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
        console.error('Error details:', error.response?.data);
        const errorMsg = error.response?.data?.message || error.response?.data?.details || 'Failed to add interest. Please try again.';
        onError?.(Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg);
      } else {
        onError?.('Failed to add interest. Please try again.');
      }
    } finally {
      setIsAddingInterest(false);
    }
  };

  const handleRemoveInterest = async (interestId: number) => {
    // Handle both nested and direct interest structures
    const interestToRemove = userInterests.find(ui => {
      const currentInterestId = ui.interest_id || ui.id;
      return currentInterestId === interestId;
    });

    if (!interestToRemove) {
      console.warn('Interest to remove not found:', interestId);
      return;
    }

    try {
      setIsRemovingInterest(true);
      setRemovingInterestId(interestId);

      await interestService.removeUserInterest(token, interestId);

      // Remove from local state
      setUserInterests(prev => prev.filter(ui => {
        const currentInterestId = ui.interest_id || ui.id;
        return currentInterestId !== interestId;
      }));

      const interestName = interestToRemove.interest?.name || interestToRemove.name || 'interest';
      onSuccess?.(`Removed "${interestName}" from your interests.`);
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
  };

  const userInterestIds = userInterests.map(ui => {
    // Handle both nested and direct interest structures
    return ui.interest_id || ui.id;
  }).filter(id => id !== undefined);

  if (isLoading) {
    return (
      <div className="interests-manager">
        <h3>
          <FaHeart style={{ marginRight: '8px' }} />
          Interests
        </h3>
        <div className="loading-message">Loading interests...</div>
      </div>
    );
  }

  return (
    <div className="interests-manager">
      <h3>
        <FaHeart style={{ marginRight: '8px' }} />
        Interests
      </h3>
      <p className="section-description">
        Add interests to help others discover you. You can have up to {maxInterests} interests.
      </p>

      <div className="interests-section">
        <div className="add-interests-section">
          <h4>
            <FaTags style={{ marginRight: '8px' }} />
            Add Interests
          </h4>
          <AddInterestInput
            onAddInterest={handleAddExistingInterest}
            onCreateAndAddInterest={handleCreateAndAddInterest}
            onSearch={handleSearch}
            suggestions={searchResults}
            isLoading={isSearching || isAddingInterest}
            userInterestIds={userInterestIds}
            popularInterests={popularInterests}
          />
        </div>

        <div className="current-interests-section">
          <InterestTagList
            userInterests={userInterests}
            onRemoveInterest={handleRemoveInterest}
            isRemoving={isRemovingInterest}
            removingId={removingInterestId}
          />
        </div>
      </div>
    </div>
  );
};

export default InterestsManager;
