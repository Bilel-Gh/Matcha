import React from 'react';
import { FaImages } from 'react-icons/fa';
import { Photo } from '../services/photoService';
import PhotoCard from './PhotoCard';

interface PhotoGridProps {
  photos: Photo[];
  onSetProfile: (photoId: number) => Promise<void>;
  onDelete: (photoId: number) => Promise<void>;
  onUploadClick: () => void;
}

const PhotoGrid: React.FC<PhotoGridProps> = ({
  photos,
  onSetProfile,
  onDelete,
  onUploadClick,
}) => {
  // Ensure photos is an array
  const photosArray = Array.isArray(photos) ? photos : [];

  if (photosArray.length === 0) {
    return (
      <div className="photo-grid-empty">
        <div className="empty-state">
          <FaImages className="empty-icon" />
          <h3>No photos yet</h3>
          <p>Upload your first photo to get started</p>
          <button className="btn btn-primary" onClick={onUploadClick}>
            Upload Photo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="photo-grid">
      {photosArray.map((photo, index) => (
        <PhotoCard
          key={photo.id || `photo-${index}`}
          photo={photo}
          onSetProfile={onSetProfile}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default PhotoGrid;
