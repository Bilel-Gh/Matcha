import React, { useState } from 'react';

interface BlockUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
  userName: string;
  isBlocking: boolean;
}

const BlockUserModal: React.FC<BlockUserModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  userName,
  isBlocking
}) => {
  const [reason, setReason] = useState<string>('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(reason.trim() || undefined);
    setReason('');
  };

  const handleClose = () => {
    setReason('');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Block {userName}</h3>
          <button
            className="modal-close-btn"
            onClick={handleClose}
            disabled={isBlocking}
          >
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="block-warning">
            <div className="warning-icon">⚠️</div>
            <div className="warning-text">
              <p><strong>Are you sure you want to block {userName}?</strong></p>
              <p>When you block someone:</p>
              <ul>
                <li>They won't be able to see your profile</li>
                <li>You won't see them in your browsing results</li>
                <li>Any existing matches will be removed</li>
                <li>This action cannot be undone easily</li>
              </ul>
            </div>
          </div>

          <div className="block-reason">
            <label htmlFor="block-reason-input">
              Reason for blocking (optional):
            </label>
            <textarea
              id="block-reason-input"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why are you blocking this user? (optional)"
              rows={3}
              disabled={isBlocking}
              maxLength={500}
            />
            <div className="character-count">
              {reason.length}/500
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button
            className="btn btn-secondary"
            onClick={handleClose}
            disabled={isBlocking}
          >
            Cancel
          </button>
          <button
            className="btn btn-danger"
            onClick={handleConfirm}
            disabled={isBlocking}
          >
            {isBlocking ? 'Blocking...' : 'Block User'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BlockUserModal;
