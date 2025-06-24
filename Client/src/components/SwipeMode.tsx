import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import SwipeCard from './SwipeCard';
import BlockUserModal from './BlockUserModal';
import ReportUserModal from './ReportUserModal';
import { User } from '../types/user';

interface SwipeModeProps {
  users: User[];
  onUsersUpdate: () => void;
  onUserRemoved?: (userId: number) => void;
  onUserLiked?: (userId: number, isMatch: boolean) => void;
  onShowMessage?: (message: string, type: 'success' | 'error') => void;
}

const SwipeMode: React.FC<SwipeModeProps> = ({ users, onUsersUpdate, onUserRemoved, onUserLiked, onShowMessage }) => {
  const { token } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [removingCardId, setRemovingCardId] = useState<number | null>(null);

  // Modal states
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isBlocking, setIsBlocking] = useState(false);
  const [isReporting, setIsReporting] = useState(false);

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
          onShowMessage?.(`🎉 It's a match with ${user.firstname}!`, 'success');
        } else {
          onShowMessage?.(`❤️ You liked ${user.firstname}`, 'success');
        }

        // Remove user from local list immediately for better UX
        if (onUserRemoved) {
          onUserRemoved(user.id);
        }

        // Notify parent about the like action
        if (onUserLiked) {
          onUserLiked(user.id, data.data?.match || false);
        }

        // Don't call moveToNextCard() here since onUserRemoved already removes the user
        // The next card will automatically become the current card
        // Just reset the removing state
        setRemovingCardId(null);
      } else {
        // Handle specific error cases
        if (response.status === 409 && data.message && data.message.includes('Like already exists')) {
          // Like already exists - treat as success and move to next card
          onShowMessage?.(`❤️ You already liked ${user.firstname}`, 'success');

          // Remove user from local list immediately
          if (onUserRemoved) {
            onUserRemoved(user.id);
          }

          // Notify parent about the like action (already liked, so no match)
          if (onUserLiked) {
            onUserLiked(user.id, false);
          }

          // Don't call moveToNextCard() here since onUserRemoved already removes the user
          // Just reset the removing state
          setRemovingCardId(null);
        } else if (data.message && data.message.includes('Profile picture required')) {
          onShowMessage?.('❌ Please add a profile picture to like other users', 'error');
          // Reset the removing state on this error only
          setRemovingCardId(null);
        } else if (data.message && data.message.includes('Complete your profile')) {
          onShowMessage?.('❌ Please complete your profile to like other users', 'error');
          // Reset the removing state on this error only
          setRemovingCardId(null);
        } else {
          onShowMessage?.(`❌ ${data.message || 'Failed to like user'}`, 'error');
          // Reset the removing state on unknown errors only
          setRemovingCardId(null);
        }
      }
    } catch (error) {
      onShowMessage?.('❌ Network error. Please check your connection', 'error');
      setRemovingCardId(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwipeLeft = (user: User) => {
    if (removingCardId) return;

    setRemovingCardId(user.id);
    onShowMessage?.(`👎 You passed on ${user.firstname}`, 'success');

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

  // Handle card action buttons
  const handleViewProfile = (user: User) => {
    // Navigate to user profile page - visit will be recorded there
    window.location.href = `/user/${user.id}`;
  };

  const handleBlockUser = (user: User) => {
    setSelectedUser(user);
    setShowBlockModal(true);
  };

  const confirmBlock = async (reason?: string) => {
    if (!selectedUser || !token) return;

    setIsBlocking(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/interactions/block/${selectedUser.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: reason || 'Blocked from swipe mode' })
      });

      if (response.ok) {
        onShowMessage?.(`${selectedUser.firstname} has been blocked`, 'success');
        if (onUserRemoved) {
          onUserRemoved(selectedUser.id);
        }
      } else {
        const data = await response.json();
        onShowMessage?.(data.message || 'Failed to block user', 'error');
      }
    } catch (error) {
      onShowMessage?.('Failed to block user', 'error');
    } finally {
      setIsBlocking(false);
      setShowBlockModal(false);
      setSelectedUser(null);
    }
  };

  const handleReportUser = (user: User) => {
    setSelectedUser(user);
    setShowReportModal(true);
  };

  const confirmReport = async (reason: string) => {
    if (!selectedUser || !token) return;

    setIsReporting(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/interactions/report/${selectedUser.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });

      if (response.ok) {
        onShowMessage?.(`${selectedUser.firstname} has been reported`, 'success');
      } else {
        const data = await response.json();
        onShowMessage?.(data.message || 'Failed to report user', 'error');
      }
    } catch (error) {
      onShowMessage?.('Failed to report user', 'error');
    } finally {
      setIsReporting(false);
      setShowReportModal(false);
      setSelectedUser(null);
    }
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
      <div className="cards-stack">
        {currentCards.map((user, index) => (
          <SwipeCard
            key={`${user.id}-${currentIndex}-${index}`} // Unique key for proper re-rendering
            user={user}
            index={index}
            isActive={index === 0 && !removingCardId}
            onSwipeRight={() => handleSwipeRight(user)}
            onSwipeLeft={() => handleSwipeLeft(user)}
            onViewProfile={() => handleViewProfile(user)}
            onBlock={() => handleBlockUser(user)}
            onReport={() => handleReportUser(user)}
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

      {/* Block User Modal */}
      {selectedUser && (
        <BlockUserModal
          isOpen={showBlockModal}
          onClose={() => {
            setShowBlockModal(false);
            setSelectedUser(null);
          }}
          onConfirm={confirmBlock}
          userName={selectedUser.firstname}
          isBlocking={isBlocking}
        />
      )}

      {/* Report User Modal */}
      {selectedUser && (
        <ReportUserModal
          isOpen={showReportModal}
          onClose={() => {
            setShowReportModal(false);
            setSelectedUser(null);
          }}
          onConfirm={confirmReport}
          userName={selectedUser.firstname}
          isReporting={isReporting}
        />
      )}
    </div>
  );
};

export default SwipeMode;
