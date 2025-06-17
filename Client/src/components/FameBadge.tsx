import React from 'react';
import { getRatingLevel } from '../utils/fameRating';

interface FameBadgeProps {
  rating: number;
  size?: 'small' | 'medium' | 'large';
  showLevel?: boolean;
  className?: string;
}

const FameBadge: React.FC<FameBadgeProps> = ({
  rating,
  size = 'medium',
  showLevel = false,
  className = ''
}) => {
  const level = getRatingLevel(rating);

  return (
    <div className={`fame-badge ${size} ${className}`} style={{ borderColor: level.color }}>
      <div className="badge-content">
        <span className="badge-emoji">{level.emoji}</span>
        <span className="badge-rating">{rating}</span>
      </div>
      {showLevel && (
        <div className="badge-level" style={{ color: level.color }}>
          {level.label}
        </div>
      )}
    </div>
  );
};

export default FameBadge;
