import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaSignInAlt, FaUser, FaLock, FaCamera } from 'react-icons/fa';
import axios from 'axios';
import PersonalInfoForm from '../components/PersonalInfoForm';
import PasswordChangeForm from '../components/PasswordChangeForm';
import PhotoManagement from '../components/PhotoManagement';
import profileService, { ProfileData, ProfileUpdateData, PasswordChangeData } from '../services/profileService';

const ProfilePage: React.FC = () => {
  const { user, token, updateUser } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'personal' | 'photos' | 'security'>('personal');
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (token) {
      loadProfile();
    }
  }, [token]);

  const loadProfile = async () => {
    try {
      setIsLoadingProfile(true);
      const profileData = await profileService.getProfile(token!);
      setProfile(profileData);
    } catch (error) {
      console.error('Failed to load profile:', error);
      setErrorMessage('Failed to load profile. Please try again.');
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleUpdateProfile = async (data: ProfileUpdateData) => {
    try {
      setIsUpdatingProfile(true);
      setErrorMessage('');

      const updatedProfile = await profileService.updateProfile(token!, data);
      setProfile(updatedProfile);

      // Update user data in AuthContext if username, email, firstname, or lastname changed
      if (data.username || data.email || data.firstname || data.lastname) {
        updateUser({
          username: updatedProfile.username,
          email: updatedProfile.email,
          first_name: updatedProfile.firstname,
          last_name: updatedProfile.lastname,
        });
      }

      setSuccessMessage('Profile updated successfully!');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Failed to update profile:', error);
      if (axios.isAxiosError(error)) {
        const errorMsg = error.response?.data?.message || 'Failed to update profile. Please try again.';
        setErrorMessage(Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg);
      } else {
        setErrorMessage('Failed to update profile. Please try again.');
      }
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (data: PasswordChangeData) => {
    try {
      setIsChangingPassword(true);
      setErrorMessage('');

      await profileService.changePassword(token!, data);
      setSuccessMessage('Password changed successfully!');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Failed to change password:', error);
      if (axios.isAxiosError(error)) {
        const errorMsg = error.response?.data?.message || 'Failed to change password. Please try again.';
        setErrorMessage(Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg);
      } else {
        setErrorMessage('Failed to change password. Please try again.');
      }
      throw error; // Re-throw to let PasswordChangeForm handle it
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (!user) {
    return (
      <div className="auth-container">
        <h2>Please log in to view your profile</h2>
        <button
          onClick={() => navigate('/login')}
          className="auth-button"
        >
          <FaSignInAlt style={{ marginRight: '8px' }} />
          Go to Login
        </button>
      </div>
    );
  }

  if (isLoadingProfile) {
    return (
      <div className="auth-container">
        <h2>Profile</h2>
        <div className="loading-message">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h2>My Profile</h2>
        <p>Manage your personal information and account security</p>
      </div>

      {successMessage && (
        <div className="success-message global-message">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="error-message global-message">
          {errorMessage}
        </div>
      )}

      <div className="profile-tabs">
        <button
          className={`tab-button ${activeTab === 'personal' ? 'active' : ''}`}
          onClick={() => setActiveTab('personal')}
        >
          <FaUser style={{ marginRight: '8px' }} />
          Personal Information
        </button>
        <button
          className={`tab-button ${activeTab === 'photos' ? 'active' : ''}`}
          onClick={() => setActiveTab('photos')}
        >
          <FaCamera style={{ marginRight: '8px' }} />
          Photos
        </button>
        <button
          className={`tab-button ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          <FaLock style={{ marginRight: '8px' }} />
          Security
        </button>
      </div>

      <div className="profile-content">
        {activeTab === 'personal' && (
          <PersonalInfoForm
            profile={profile}
            onUpdate={handleUpdateProfile}
            isLoading={isUpdatingProfile}
          />
        )}

        {activeTab === 'photos' && token && (
          <PhotoManagement
            token={token}
            onSuccess={setSuccessMessage}
            onError={setErrorMessage}
          />
        )}

        {activeTab === 'security' && (
          <PasswordChangeForm
            onChangePassword={handleChangePassword}
            isLoading={isChangingPassword}
          />
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
