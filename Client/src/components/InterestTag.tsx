import React from 'react';
import { FaTimes } from 'react-icons/fa';
import { Interest } from '../services/interestService';

interface InterestTagProps {
  interest: Interest;
  onRemove: (interestId: number) => void;
  isRemoving?: boolean;
}

const InterestTag: React.FC<InterestTagProps> = ({
  interest,
  onRemove,
  isRemoving = false,
}) => {
  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onRemove(interest.id);
  };

  // Safety check for interest object
  if (!interest) {
    return null;
  }

  return (
    <div className="interest-tag">
      <span className="interest-name">#{interest.tag || interest.name}</span>
      <button
        className="interest-remove-btn"
        onClick={handleRemove}
        disabled={isRemoving}
        title={`Remove ${interest.name || 'interest'}`}
        type="button"
      >
        <FaTimes />
      </button>
    </div>
  );
};

export default InterestTag;
