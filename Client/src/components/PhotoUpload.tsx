import React, { useState, useRef } from 'react';
import { FaCloudUploadAlt, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';

interface PhotoUploadProps {
  onUpload: (files: File[]) => Promise<void>;
  isUploading: boolean;
  maxPhotos: number;
  currentPhotoCount: number;
  disabled?: boolean;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({
  onUpload,
  isUploading,
  maxPhotos,
  currentPhotoCount,
  disabled = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canUpload = currentPhotoCount < maxPhotos && !disabled;
  const remainingSlots = maxPhotos - currentPhotoCount;

  const validateFile = (file: File): string | null => {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      return `${file.name}: Only JPEG and PNG files are allowed`;
    }

    // Check file size (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return `${file.name}: File too large (max 5MB)`;
    }

    return null;
  };

  const validateFiles = (files: File[]): { validFiles: File[]; errors: string[] } => {
    const validFiles: File[] = [];
    const newErrors: string[] = [];

    // Check if user has reached photo limit
    if (currentPhotoCount >= maxPhotos) {
      newErrors.push(`Maximum ${maxPhotos} photos allowed`);
      return { validFiles, errors: newErrors };
    }

    // Check if trying to upload too many files
    if (files.length > remainingSlots) {
      newErrors.push(`You can only upload ${remainingSlots} more photo(s)`);
      return { validFiles, errors: newErrors };
    }

    files.forEach((file) => {
      const error = validateFile(file);
      if (error) {
        newErrors.push(error);
      } else {
        validFiles.push(file);
      }
    });

    return { validFiles, errors: newErrors };
  };

  const handleFiles = async (files: File[]) => {
    if (!canUpload) return;

    const { validFiles, errors: validationErrors } = validateFiles(files);
    setErrors(validationErrors);

    if (validFiles.length > 0) {
      try {
        await onUpload(validFiles);
        // Clear errors on successful upload
        if (validationErrors.length === 0) {
          setErrors([]);
        }
      } catch (error) {
        // This error is caught and handled in the parent component (PhotoManagement)
        // which will display a toast notification.
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (canUpload && !isUploading) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (!canUpload || isUploading) return;

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFiles(files);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    if (canUpload && !isUploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const getDropzoneClass = () => {
    let className = 'photo-upload-dropzone';

    if (!canUpload) {
      className += ' disabled';
    } else if (isDragOver && !isUploading) {
      className += ' drag-over';
    } else if (isUploading) {
      className += ' uploading';
    }

    return className;
  };

  const getDropzoneContent = () => {
    if (isUploading) {
      return (
        <>
          <FaSpinner className="upload-icon spinning" />
          <p>Uploading photos...</p>
        </>
      );
    }

    if (!canUpload) {
      return (
        <>
          <FaExclamationTriangle className="upload-icon disabled" />
          <p>Maximum {maxPhotos} photos reached</p>
        </>
      );
    }

    if (isDragOver) {
      return (
        <>
          <FaCloudUploadAlt className="upload-icon active" />
          <p>Drop files here to upload</p>
        </>
      );
    }

    return (
      <>
        <FaCloudUploadAlt className="upload-icon" />
        <p>Drag & drop photos here</p>
        <p className="upload-subtitle">or click to browse</p>
        <p className="upload-info">
          JPEG, PNG • Max 5MB • {remainingSlots} slot(s) remaining
        </p>
      </>
    );
  };

  return (
    <div className="photo-upload">
      <div className="photo-count-info">
        <span className="photo-count">
          {currentPhotoCount}/{maxPhotos} photos
        </span>
      </div>

      <div
        className={getDropzoneClass()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        {getDropzoneContent()}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/jpg"
          multiple
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </div>

      {errors.length > 0 && (
        <div className="upload-errors">
          {errors.map((error, index) => (
            <div key={index} className="error-message">
              {error}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PhotoUpload;
