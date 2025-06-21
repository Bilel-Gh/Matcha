import React, { useState } from 'react';

interface ReportUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  userName: string;
  isReporting: boolean;
}

const REPORT_REASONS = [
  'Fake account',
  'Inappropriate photos',
  'Harassment',
  'Spam or promotional content',
  'Underage user',
  'Offensive behavior',
  'Scam or fraud',
  'Impersonation',
  'Other'
];

const ReportUserModal: React.FC<ReportUserModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  userName,
  isReporting
}) => {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!selectedReason) return;

    // Always send the selectedReason from the enum, not the custom text
    // The custom text is just for display/context
    onConfirm(selectedReason);
    setSelectedReason('');
    setCustomReason('');
  };

  const handleClose = () => {
    setSelectedReason('');
    setCustomReason('');
    onClose();
  };

  const isValid = selectedReason;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Report {userName}</h3>
          <button
            className="modal-close-btn"
            onClick={handleClose}
            disabled={isReporting}
          >
            ×
          </button>
        </div>

        <div className="modal-body">
          <p>Why are you reporting this user? This helps us keep the community safe.</p>

          <div className="report-reasons">
            {REPORT_REASONS.map((reason) => (
              <label key={reason} className="reason-option">
                <input
                  type="radio"
                  name="report-reason"
                  value={reason}
                  checked={selectedReason === reason}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  disabled={isReporting}
                />
                <span className="reason-text">{reason}</span>
              </label>
            ))}
          </div>

          {selectedReason === 'Other' && (
            <div className="custom-reason">
              <label htmlFor="custom-reason-input">Please specify:</label>
              <textarea
                id="custom-reason-input"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Describe the reason for reporting..."
                rows={3}
                disabled={isReporting}
                maxLength={500}
              />
              <div className="character-count">
                {customReason.length}/500
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            className="btn btn-secondary"
            onClick={handleClose}
            disabled={isReporting}
          >
            Cancel
          </button>
          <button
            className="btn btn-danger"
            onClick={handleConfirm}
            disabled={!isValid || isReporting}
          >
            {isReporting ? 'Reporting...' : 'Report User'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportUserModal;
