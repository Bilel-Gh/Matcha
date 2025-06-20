import React, { useState } from 'react';
import { FaUser } from 'react-icons/fa';

interface UserIconProps {
  profilePictureUrl?: string;
  username: string;
  className?: string;
}

const UserIcon: React.FC<UserIconProps> = ({ profilePictureUrl, username, className = '' }) => {
  const [imageError, setImageError] = useState(false);

  // Reset error state when profilePictureUrl changes
  React.useEffect(() => {
    setImageError(false);
  }, [profilePictureUrl]);

  // If no profile picture URL or image failed to load, show icon
  if (!profilePictureUrl || imageError) {
    return (
      <div className={`user-icon-fallback ${className}`}>
        <FaUser />
      </div>
    );
  }

  return (
    <img
      src={profilePictureUrl}
      alt={`${username}'s profile`}
      className={`nav-profile-picture ${className}`}
      onError={() => {
        setImageError(true);
      }}
      onLoad={() => {
        setImageError(false);
      }}
    />
  );
};

export default UserIcon;
