import React from 'react';
import { FaHeart, FaSpinner } from 'react-icons/fa';
import { UserInterest } from '../services/interestService';
import InterestTag from './InterestTag';

interface InterestTagListProps {
  userInterests: UserInterest[];
  onRemoveInterest: (interestId: number) => void;
  isRemoving?: boolean;
  removingId?: number | null;
}

const InterestTagList: React.FC<InterestTagListProps> = ({
  userInterests,
  onRemoveInterest,
  isRemoving = false,
  removingId = null,
}) => {
  if (userInterests.length === 0) {
    return (
      <div className="interests-empty-state">
        <FaHeart className="empty-icon" />
        <h4>No interests added yet</h4>
        <p>Add some interests to help others discover you!</p>
      </div>
    );
  }

  return (
    <div className="interest-tag-list">
      <div className="interests-header">
        <h4>
          Your Interests ({userInterests.length}/10)
        </h4>
      </div>
      <div className="interests-grid">
        {userInterests.map((userInterest) => {
          // Handle both direct interest and nested interest structure
          const interest = userInterest.interest || userInterest as any;
          const interestId = userInterest.interest_id || userInterest.id;

          if (!interest) {
            return null;
          }

          return (
            <div key={userInterest.id} className="interest-tag-wrapper">
              {isRemoving && removingId === interestId && (
                <div className="interest-tag-loading">
                  <FaSpinner className="spinning" />
                </div>
              )}
              <InterestTag
                interest={interest}
                onRemove={onRemoveInterest}
                isRemoving={isRemoving && removingId === interestId}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InterestTagList;
