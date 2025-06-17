import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaSignInAlt, FaUser, FaLock, FaCamera, FaHeart, FaMapMarkerAlt, FaTachometerAlt } from 'react-icons/fa';
import axios from 'axios';
import PersonalInfoForm from '../components/PersonalInfoForm';
import PasswordChangeForm from '../components/PasswordChangeForm';
import PhotoManagement from '../components/PhotoManagement';
import InterestsManager from '../components/InterestsManager';
import LocationManager from '../components/LocationManager';
import FameRatingCard from '../components/FameRatingCard';
import profileService, { ProfileData, ProfileUpdateData, PasswordChangeData } from '../services/profileService';

const ProfilePage: React.FC = () => {
  const { user, token, updateUser } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'personal' | 'photos' | 'interests' | 'location' | 'security' | 'overview'>('overview');
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Helper functions for auto-clearing messages
  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const showErrorMessage = (message: string) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(''), 5000);
  };

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
      showErrorMessage('Failed to load profile. Please try again.');
    } finally {
      setIsLoadingProfile(false);
    }
  };

  // Callback to refresh profile data
  const handleProfileUpdate = () => {
    loadProfile();
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

            showSuccessMessage('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to update profile:', error);
      if (axios.isAxiosError(error)) {
        const errorMsg = error.response?.data?.message || 'Failed to update profile. Please try again.';
        showErrorMessage(Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg);
      } else {
        showErrorMessage('Failed to update profile. Please try again.');
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
            showSuccessMessage('Password changed successfully!');
    } catch (error) {
      console.error('Failed to change password:', error);
      if (axios.isAxiosError(error)) {
        const errorMsg = error.response?.data?.message || 'Failed to change password. Please try again.';
        showErrorMessage(Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg);
      } else {
        showErrorMessage('Failed to change password. Please try again.');
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
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <FaTachometerAlt style={{ marginRight: '8px' }} />
          Overview
        </button>
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
          className={`tab-button ${activeTab === 'interests' ? 'active' : ''}`}
          onClick={() => setActiveTab('interests')}
        >
          <FaHeart style={{ marginRight: '8px' }} />
          Interests
        </button>
        <button
          className={`tab-button ${activeTab === 'location' ? 'active' : ''}`}
          onClick={() => setActiveTab('location')}
        >
          <FaMapMarkerAlt style={{ marginRight: '8px' }} />
          Location
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
          <>
            <PersonalInfoForm
              profile={profile}
              onUpdate={handleUpdateProfile}
              isLoading={isUpdatingProfile}
            />
            {profile && (
              <FameRatingCard
                fameRating={profile.fame_rating || 0}
              />
            )}
          </>
        )}

        {activeTab === 'photos' && token && (
          <PhotoManagement
            token={token}
            onSuccess={showSuccessMessage}
            onError={showErrorMessage}
            onProfileUpdate={handleProfileUpdate}
          />
        )}

        {activeTab === 'interests' && token && (
          <InterestsManager
            token={token}
            onSuccess={showSuccessMessage}
            onError={showErrorMessage}
            onProfileUpdate={handleProfileUpdate}
          />
        )}

        {activeTab === 'location' && token && (
          <LocationManager
            token={token}
            onSuccess={showSuccessMessage}
            onError={showErrorMessage}
            showInitialSetup={!profile?.profile_completed}
            onProfileUpdate={handleProfileUpdate}
          />
        )}

        {activeTab === 'security' && (
          <PasswordChangeForm
            onChangePassword={handleChangePassword}
            isLoading={isChangingPassword}
          />
        )}

        {activeTab === 'overview' && profile && (
          <div className="overview-section">
            <FameRatingCard
              fameRating={profile.fame_rating || 0}
            />

            <div className="profile-stats">
              <h3>Profile Completion</h3>
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-icon">📸</span>
                  <span className="stat-label">Profile Picture</span>
                  <span className={`stat-status ${profile.has_profile_picture ? 'completed' : 'incomplete'}`}>
                    {profile.has_profile_picture ? '✓' : '✗'}
                  </span>
                </div>

                <div className="stat-item">
                  <span className="stat-icon">✍️</span>
                  <span className="stat-label">Biography</span>
                  <span className={`stat-status ${profile.biography ? 'completed' : 'incomplete'}`}>
                    {profile.biography ? '✓' : '✗'}
                  </span>
                </div>

                <div className="stat-item">
                  <span className="stat-icon">📍</span>
                  <span className="stat-label">Location</span>
                  <span className={`stat-status ${profile.has_location ? 'completed' : 'incomplete'}`}>
                    {profile.has_location ? '✓' : '✗'}
                  </span>
                </div>

                <div className="stat-item">
                  <span className="stat-icon">⚥</span>
                  <span className="stat-label">Gender & Preferences</span>
                  <span className={`stat-status ${profile.gender && profile.sexual_preferences ? 'completed' : 'incomplete'}`}>
                    {profile.gender && profile.sexual_preferences ? '✓' : '✗'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
