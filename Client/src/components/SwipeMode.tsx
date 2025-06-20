import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import SwipeCard from './SwipeCard';

interface User {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  age?: number;
  birth_date?: string;
  city: string;
  country: string;
  profile_picture_url: string;
  biography: string;
  distance_km: number;
  fame_rating: number;
  common_interests: number;
  common_interests_count?: number;
  is_online?: boolean;
  last_connection?: string;
}

interface SwipeModeProps {
  users: User[];
  onUsersUpdate: () => void;
}

const SwipeMode: React.FC<SwipeModeProps> = ({ users, onUsersUpdate }) => {
  const { token } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isMatch, setIsMatch] = useState<boolean>(false);
  const [removingCardId, setRemovingCardId] = useState<number | null>(null);



  // Clear messages after delay
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
        setIsMatch(false);
      }, isMatch ? 4000 : 3000); // Longer duration for matches
      return () => clearTimeout(timer);
    }
  }, [successMessage, isMatch]);

  const getCurrentCards = () => {
    const cards = [];
    for (let i = currentIndex; i < Math.min(currentIndex + 3, users.length); i++) {
      if (users[i]) {
        cards.push(users[i]);
      }
    }
    return cards;
  };

  const currentCards = getCurrentCards();

  const handleSwipeRight = async (user: User) => {
    if (!token || isLoading || removingCardId) return;

    setIsLoading(true);
    setRemovingCardId(user.id);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/interactions/like/${user.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        if (data.data?.match) {
          setIsMatch(true);
          setSuccessMessage(`It's a match with ${user.firstname}!`);
        } else {
          setIsMatch(false);
          setSuccessMessage(`You liked ${user.firstname}`);
        }

        // Advance to next card after a short delay
        setTimeout(() => {
          moveToNextCard();
        }, 300);
      } else {
        // Handle specific error cases
        if (response.status === 409 && data.message && data.message.includes('Like already exists')) {
          // Like already exists - treat as success and move to next card
          setIsMatch(false);
          setSuccessMessage(`You already liked ${user.firstname}`);
          setTimeout(() => {
            moveToNextCard();
          }, 300);
        } else if (data.message && data.message.includes('Profile picture required')) {
          setErrorMessage('Please add a profile picture to like other users');
          // Reset the removing state on this error only
          setRemovingCardId(null);
        } else if (data.message && data.message.includes('Complete your profile')) {
          setErrorMessage('Please complete your profile to like other users');
          // Reset the removing state on this error only
          setRemovingCardId(null);
        } else {
          setErrorMessage(data.message || 'Failed to like user');
          // Reset the removing state on unknown errors only
          setRemovingCardId(null);
        }
      }
    } catch (error) {
      console.error('Failed to like user:', error);
      setErrorMessage('Network error. Please check your connection');
      setRemovingCardId(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwipeLeft = (user: User) => {
    if (removingCardId) return;

    console.log('Passed on', user.firstname);
    setRemovingCardId(user.id);
    setIsMatch(false);
    setSuccessMessage(`You passed on ${user.firstname}`);

    // Move to next card after a short delay
    setTimeout(() => {
      moveToNextCard();
    }, 300);
  };

  const moveToNextCard = () => {
    setCurrentIndex(prev => prev + 1);
    setRemovingCardId(null);
  };

  // Handle button clicks - trigger programmatic swipe
  const handleButtonLike = () => {
    const currentUser = currentCards[0];
    if (!currentUser || isLoading || removingCardId) return;

    // Trigger swipe animation first, then handle the like
    handleSwipeRight(currentUser);
  };

  const handleButtonPass = () => {
    const currentUser = currentCards[0];
    if (!currentUser || isLoading || removingCardId) return;

    // Trigger swipe animation first, then handle the pass
    handleSwipeLeft(currentUser);
  };

  // Check if we have more users
  const hasMoreUsers = currentIndex < users.length;

  if (!hasMoreUsers || currentCards.length === 0) {
    return (
      <div className="swipe-empty-state">
        <div className="empty-icon">😔</div>
        <h3>No more profiles</h3>
        <p>Try adjusting your filters to see more people</p>
        <button onClick={onUsersUpdate} className="reload-btn" disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Reload Users'}
        </button>
      </div>
    );
  }

  return (
    <div className="swipe-mode">
      {/* Messages */}
      {errorMessage && (
        <div className="swipe-message error-message">
          {errorMessage}
        </div>
      )}
      {successMessage && (
        <div className={`swipe-message success-message ${isMatch ? 'match-message' : ''}`}>
          {successMessage}
        </div>
      )}

      <div className="cards-stack">
        {currentCards.map((user, index) => (
          <SwipeCard
            key={`${user.id}-${currentIndex}-${index}`} // Unique key for proper re-rendering
            user={user}
            index={index}
            isActive={index === 0 && !removingCardId}
            onSwipeRight={() => handleSwipeRight(user)}
            onSwipeLeft={() => handleSwipeLeft(user)}
          />
        ))}
      </div>

      <div className="swipe-actions">
        <button
          className="action-btn pass-btn"
          onClick={handleButtonPass}
          disabled={!currentCards[0] || isLoading || !!removingCardId}
          title="Pass"
        >
          <span>👎</span>
        </button>
        <button
          className="action-btn like-btn"
          onClick={handleButtonLike}
          disabled={!currentCards[0] || isLoading || !!removingCardId}
          title="Like"
        >
          <span>{isLoading ? '⏳' : '👍'}</span>
        </button>
      </div>
    </div>
  );
};

export default SwipeMode;
