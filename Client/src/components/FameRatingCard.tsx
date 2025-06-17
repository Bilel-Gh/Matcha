import React, { useState } from 'react';
import { FaStar } from 'react-icons/fa';
import CircularProgress from './CircularProgress';
import ImprovementTipsModal from './ImprovementTipsModal';
import { getRatingLevel, getRatingMessage } from '../utils/fameRating';

interface FameRatingCardProps {
  fameRating: number;
  className?: string;
}

const FameRatingCard: React.FC<FameRatingCardProps> = ({
  fameRating = 0,
  className = ''
}) => {
  const [showTipsModal, setShowTipsModal] = useState(false);
  const level = getRatingLevel(fameRating);
  const message = getRatingMessage(fameRating);

  const handleShowTips = () => {
    setShowTipsModal(true);
  };

  const handleCloseTips = () => {
    setShowTipsModal(false);
  };

  return (
    <>
      <div className={`fame-rating-card ${className}`}>
        <div className="fame-header">
          <h3>
            <FaStar style={{ marginRight: '8px' }} />
            Your Fame Rating
          </h3>
          <div
            className="rating-level-badge"
            style={{ backgroundColor: `${level.color}20`, borderColor: level.color }}
          >
            <span className="level-emoji">{level.emoji}</span>
            <span className="level-label">{level.label}</span>
          </div>
        </div>

        <div className="rating-circle">
          <CircularProgress
            value={fameRating}
            size={120}
            strokeWidth={8}
            className="rating-progress"
          />
          <div className="rating-center">
            <span className="rating-number">{fameRating}</span>
            <span className="rating-max">/100</span>
          </div>
        </div>

        <div className="rating-description">
          <p>{message}</p>
        </div>

        <div className="rating-actions">
          <button className="improve-btn" onClick={handleShowTips}>
            💡 How to improve
          </button>
        </div>
      </div>

      <ImprovementTipsModal
        isOpen={showTipsModal}
        onClose={handleCloseTips}
        currentRating={fameRating}
      />
    </>
  );
};

export default FameRatingCard;
