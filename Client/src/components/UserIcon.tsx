import React from 'react';
import { FaUser } from 'react-icons/fa';

interface UserIconProps {
  profilePictureUrl?: string;
  username: string;
  className?: string;
}

const UserIcon: React.FC<UserIconProps> = ({ profilePictureUrl, username, className = '' }) => {
  if (profilePictureUrl) {
    return (
      <img
        src={profilePictureUrl}
        alt={`${username}'s profile`}
        className={`nav-profile-picture ${className}`}
        onError={(e) => {
          // Replace image with icon on error
          const target = e.currentTarget;
          const iconElement = document.createElement('div');
          iconElement.innerHTML = '<svg style="margin-right: 8px; width: 1em; height: 1em; fill: currentColor;" viewBox="0 0 448 512"><path d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512H418.3c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304H178.3z"></path></svg>';
          target.parentNode?.replaceChild(iconElement.firstChild!, target);
        }}
      />
    );
  }

  return <FaUser style={{ marginRight: '8px' }} />;
};

export default UserIcon;
