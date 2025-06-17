import React from 'react';
import { FaTimes } from 'react-icons/fa';
import { getImprovementTips } from '../utils/fameRating';

interface ImprovementTipsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRating: number;
}

const ImprovementTipsModal: React.FC<ImprovementTipsModalProps> = ({
  isOpen,
  onClose,
  currentRating
}) => {
  const tips = getImprovementTips(currentRating);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content tips-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>💡 Boost Your Fame Rating</h3>
          <button className="modal-close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="modal-body">
          <p className="tips-intro">
            Here are some ways to increase your fame rating and become more popular:
          </p>

          <div className="tips-list">
            {tips.map((tip, index) => (
              <div key={index} className="tip-item">
                <span className="tip-icon">{tip.icon}</span>
                <div className="tip-content">
                  <h4>{tip.title}</h4>
                  <p>{tip.description}</p>
                  <span className="tip-points">+{tip.points} points</span>
                </div>
              </div>
            ))}
          </div>

          <div className="tips-footer">
            <p className="tips-note">
              <strong>Pro tip:</strong> The more complete and engaging your profile is,
              the higher your fame rating will become!
            </p>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImprovementTipsModal;
