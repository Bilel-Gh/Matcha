import React, { useState, useEffect } from 'react';
import { FaUser, FaEnvelope, FaVenusMars, FaHeart, FaCalendarAlt, FaEdit } from 'react-icons/fa';
import { ProfileData, ProfileUpdateData } from '../services/profileService';

interface PersonalInfoFormProps {
  profile: ProfileData | null;
  onUpdate: (data: ProfileUpdateData) => Promise<void>;
  isLoading: boolean;
}

const PersonalInfoForm: React.FC<PersonalInfoFormProps> = ({
  profile,
  onUpdate,
  isLoading,
}) => {
  const [formData, setFormData] = useState<ProfileUpdateData>({
    firstname: '',
    lastname: '',
    email: '',
    username: '',
    gender: '',
    sexual_preferences: '',
    biography: '',
    birth_date: '',
  });

  const [isDirty, setIsDirty] = useState(false);
  const [bioLength, setBioLength] = useState(0);

  useEffect(() => {
    if (profile) {
      const newFormData = {
        firstname: profile.firstname || '',
        lastname: profile.lastname || '',
        email: profile.email || '',
        username: profile.username || '',
        gender: profile.gender || '',
        sexual_preferences: profile.sexual_preferences || '',
        biography: profile.biography || '',
        birth_date: profile.birth_date || '',
      };
      setFormData(newFormData);
      setBioLength((profile.biography || '').length);
      setIsDirty(false);
    }
  }, [profile]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setIsDirty(true);

    if (name === 'biography') {
      setBioLength(value.length);
    }
  };

  const calculateAge = (birthDate: string): number | null => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age;
  };

  const validateAge = (birthDate: string): boolean => {
    const age = calculateAge(birthDate);
    return age !== null && age >= 18;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.firstname || !formData.lastname || !formData.email || !formData.username) {
      alert('Please fill in all required fields');
      return;
    }

    if (formData.birth_date && !validateAge(formData.birth_date)) {
      alert('You must be at least 18 years old');
      return;
    }

    if (bioLength > 500) {
      alert('Biography must not exceed 500 characters');
      return;
    }

    await onUpdate(formData);
    setIsDirty(false);
  };

  const currentAge = formData.birth_date ? calculateAge(formData.birth_date) : null;

  return (
    <div className="profile-section">
      <h3>Personal Information</h3>

      {profile && (
        <div className="profile-completion">
          <div className={`completion-indicator ${profile.profile_completed ? 'completed' : 'incomplete'}`}>
            Profile {profile.profile_completed ? 'Complete' : 'Incomplete'}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          {/* Account Fields */}
          <div className="form-group">
            <label htmlFor="firstname">
              <FaUser style={{ marginRight: '8px' }} />
              First Name *
            </label>
            <input
              id="firstname"
              name="firstname"
              type="text"
              value={formData.firstname}
              onChange={handleInputChange}
              placeholder="Enter your first name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="lastname">
              <FaUser style={{ marginRight: '8px' }} />
              Last Name *
            </label>
            <input
              id="lastname"
              name="lastname"
              type="text"
              value={formData.lastname}
              onChange={handleInputChange}
              placeholder="Enter your last name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">
              <FaEnvelope style={{ marginRight: '8px' }} />
              Email *
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="username">
              <FaUser style={{ marginRight: '8px' }} />
              Username *
            </label>
            <input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="Enter your username"
              required
            />
          </div>

          {/* Profile Fields */}
          <div className="form-group">
            <label htmlFor="gender">
              <FaVenusMars style={{ marginRight: '8px' }} />
              Gender
            </label>
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleInputChange}
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="sexual_preferences">
              <FaHeart style={{ marginRight: '8px' }} />
              Sexual Preferences
            </label>
            <select
              id="sexual_preferences"
              name="sexual_preferences"
              value={formData.sexual_preferences}
              onChange={handleInputChange}
            >
              <option value="">Select preference</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="both">Both</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="birth_date">
              <FaCalendarAlt style={{ marginRight: '8px' }} />
              Birth Date *
              {currentAge && <span className="age-display">(Age: {currentAge})</span>}
            </label>
            <input
              id="birth_date"
              name="birth_date"
              type="date"
              value={formData.birth_date}
              onChange={handleInputChange}
              required
            />
            {formData.birth_date && !validateAge(formData.birth_date) && (
              <div className="field-error">You must be at least 18 years old</div>
            )}
          </div>
        </div>

        {/* Biography - Full Width */}
        <div className="form-group bio-group">
          <label htmlFor="biography">
            <FaEdit style={{ marginRight: '8px' }} />
            Biography
          </label>
          <textarea
            id="biography"
            name="biography"
            value={formData.biography}
            onChange={handleInputChange}
            placeholder="Tell us about yourself..."
            rows={4}
            maxLength={500}
          />
          <div className={`character-counter ${bioLength > 450 ? 'warning' : ''}`}>
            {bioLength}/500 characters
          </div>
        </div>

        {isDirty && (
          <div className="unsaved-changes">
            You have unsaved changes
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !isDirty}
          className="save-button"
        >
          {isLoading ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
};

export default PersonalInfoForm;
