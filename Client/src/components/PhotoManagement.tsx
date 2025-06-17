import React, { useState, useEffect, useRef } from 'react';
import { FaCamera } from 'react-icons/fa';
import photoService, { Photo } from '../services/photoService';
import PhotoUpload from './PhotoUpload';
import PhotoGrid from './PhotoGrid';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

interface PhotoManagementProps {
  token: string;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

const PhotoManagement: React.FC<PhotoManagementProps> = ({
  token,
  onSuccess,
  onError,
}) => {
  const { refreshUser } = useAuth();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const uploadRef = useRef<HTMLDivElement>(null);

  const maxPhotos = 5;

  useEffect(() => {
    loadPhotos();
  }, [token]);

  const loadPhotos = async () => {
    try {
      setIsLoading(true);
      const userPhotos = await photoService.getUserPhotos(token);
      setPhotos(userPhotos || []); // Ensure we always have an array
    } catch (error) {
      console.error('Failed to load photos:', error);
      setPhotos([]); // Set empty array on error
      onError?.('Failed to load photos. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (files: File[]) => {
    setIsUploading(true);
    const uploadPromises = files.map((file) =>
      photoService.uploadPhoto(token, file)
    );

    try {
      const uploadedPhotos = await Promise.all(uploadPromises);

      // Add uploaded photos to state
      setPhotos(prev => [...prev, ...uploadedPhotos]);

      const successMessage = files.length === 1
        ? 'Photo uploaded successfully!'
        : `${files.length} photos uploaded successfully!`;

      onSuccess?.(successMessage);
    } catch (error) {
      console.error('Upload failed:', error);

      let errorMessage = 'Failed to upload photos. Please try again.';
      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.message || errorMessage;
      }

      onError?.(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSetProfile = async (photoId: number) => {
    try {
      await photoService.setProfilePicture(token, photoId);

      // Update photos state to reflect new profile picture
      setPhotos(prev => prev.map(photo => ({
        ...photo,
        is_profile: photo.id === photoId
      })));

      // Refresh user info in navbar to show new profile picture
      await refreshUser();

      onSuccess?.('Profile picture updated successfully!');
    } catch (error) {
      console.error('Failed to set profile picture:', error);

      let errorMessage = 'Failed to set profile picture. Please try again.';
      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.message || errorMessage;
      }

      onError?.(errorMessage);
      throw error; // Re-throw to handle in PhotoCard
    }
  };

  const handleDelete = async (photoId: number) => {
    try {
      // Check if the photo being deleted is the profile picture
      const photoToDelete = photos.find(photo => photo.id === photoId);
      const isProfilePicture = photoToDelete?.is_profile;

      await photoService.deletePhoto(token, photoId);

      // Remove photo from state
      setPhotos(prev => prev.filter(photo => photo.id !== photoId));

      // If profile picture was deleted, refresh user info to remove it from navbar
      if (isProfilePicture) {
        await refreshUser();
      }

      onSuccess?.('Photo deleted successfully!');
    } catch (error) {
      console.error('Failed to delete photo:', error);

      let errorMessage = 'Failed to delete photo. Please try again.';
      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.message || errorMessage;
      }

      onError?.(errorMessage);
      throw error; // Re-throw to handle in PhotoCard
    }
  };

  const scrollToUpload = () => {
    uploadRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="photo-management">
        <h3>
          <FaCamera style={{ marginRight: '8px' }} />
          Photos
        </h3>
        <div className="loading-message">Loading photos...</div>
      </div>
    );
  }

  return (
    <div className="photo-management">
      <h3>
        <FaCamera style={{ marginRight: '8px' }} />
        Photos
      </h3>
      <p className="section-description">
        Upload and manage your photos. You can have up to {maxPhotos} photos, and one can be set as your profile picture.
      </p>

      <div ref={uploadRef}>
        <PhotoUpload
          onUpload={handleUpload}
          isUploading={isUploading}
          maxPhotos={maxPhotos}
          currentPhotoCount={photos.length}
        />
      </div>

      <div className="photo-grid-section">
        <PhotoGrid
          photos={photos}
          onSetProfile={handleSetProfile}
          onDelete={handleDelete}
          onUploadClick={scrollToUpload}
        />
      </div>
    </div>
  );
};

export default PhotoManagement;
