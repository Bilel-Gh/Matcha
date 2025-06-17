import React, { useState } from 'react';
import { FaStar, FaTrash, FaSpinner } from 'react-icons/fa';
import { Photo } from '../services/photoService';
import ConfirmDeleteModal from './ConfirmDeleteModal';

interface PhotoCardProps {
  photo: Photo;
  onSetProfile: (photoId: number) => Promise<void>;
  onDelete: (photoId: number) => Promise<void>;
}

const PhotoCard: React.FC<PhotoCardProps> = ({
  photo,
  onSetProfile,
  onDelete,
}) => {
  const [isSettingProfile, setIsSettingProfile] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSetProfile = async () => {
    if (photo.is_profile) return;

    try {
      setIsSettingProfile(true);
      await onSetProfile(photo.id);
    } catch (error) {
      console.error('Failed to set profile picture:', error);
    } finally {
      setIsSettingProfile(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onDelete(photo.id);
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Failed to delete photo:', error);
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="photo-card">
        <div className="photo-container">
          <img
            src={photo.url}
            alt="User photo"
            className="photo-image"
            onError={(e) => {
              e.currentTarget.src = '/placeholder-image.svg'; // Fallback image
            }}
          />

          {photo.is_profile && (
            <div className="profile-badge">
              <FaStar />
              <span>PROFILE</span>
            </div>
          )}

          <div className="photo-overlay">
            <div className="photo-actions">
              {!photo.is_profile && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleSetProfile}
                  disabled={isSettingProfile}
                  title="Set as profile picture"
                >
                  {isSettingProfile ? (
                    <FaSpinner className="spinning" />
                  ) : (
                    <>
                      <FaStar style={{ marginRight: '4px' }} />
                      Set Profile
                    </>
                  )}
                </button>
              )}

              <button
                className="btn btn-danger btn-sm"
                onClick={() => setShowDeleteModal(true)}
                title="Delete photo"
              >
                <FaTrash />
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
        isDeleting={isDeleting}
      />
    </>
  );
};

export default PhotoCard;
