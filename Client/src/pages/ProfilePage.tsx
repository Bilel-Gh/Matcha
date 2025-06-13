import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FaUser, FaEnvelope, FaCalendarAlt } from 'react-icons/fa';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="auth-container">
        <h2>Please log in to view your profile</h2>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <h2>Profile</h2>
      <div className="profile-content">
        <div className="profile-avatar">
          <FaUser size={64} />
        </div>
        <div className="profile-info">
          <div className="profile-field">
            <FaUser style={{ marginRight: '8px' }} />
            <span>Username:</span>
            <strong>{user.username}</strong>
          </div>
          <div className="profile-field">
            <FaEnvelope style={{ marginRight: '8px' }} />
            <span>Email:</span>
            <strong>{user.email}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
