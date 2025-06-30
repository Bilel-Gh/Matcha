import React, { useState, useEffect } from 'react';
import { FaUser, FaEnvelope, FaVenusMars, FaHeart, FaCalendarAlt, FaEdit } from 'react-icons/fa';
import { ProfileData, ProfileUpdateData } from '../services/profileService';

interface PersonalInfoFormProps {
  profile: ProfileData | null;
  onUpdate: (data: ProfileUpdateData) => Promise<void>;
  isLoading: boolean;
}

interface FormErrors {
  [key: string]: string;
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
  const [errors, setErrors] = useState<FormErrors>({});
  const [generalError, setGeneralError] = useState('');

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
      // Clear errors when profile loads
      setErrors({});
      setGeneralError('');
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

    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (generalError) {
      setGeneralError('');
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

  const clearErrors = () => {
    setErrors({});
    setGeneralError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    // Client-side validation
    const newErrors: FormErrors = {};

    if (!formData.firstname?.trim()) {
      newErrors.firstname = 'First name is required';
    }

    if (!formData.lastname?.trim()) {
      newErrors.lastname = 'Last name is required';
    }

    if (!formData.email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.username?.trim()) {
      newErrors.username = 'Username is required';
    }

    if (formData.birth_date && !validateAge(formData.birth_date)) {
      newErrors.birth_date = 'You must be at least 18 years old';
    }

    if (bioLength > 500) {
      newErrors.biography = 'Biography must not exceed 500 characters';
    }

    // If there are validation errors, show them and don't submit
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
    await onUpdate(formData);
    setIsDirty(false);
      clearErrors();
    } catch (error: any) {
      // Handle server errors
      if (error.field) {
        // Field-specific error
        setErrors({ [error.field]: error.message });
      } else {
        // General error
        setGeneralError(error.message || 'Failed to update profile. Please try again.');
      }
    }
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

      {generalError && (
        <div className="form-errors">
          <div className="error-message">{generalError}</div>
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
              className={errors.firstname ? 'error' : ''}
            />
            {errors.firstname && <div className="field-error">{errors.firstname}</div>}
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
              className={errors.lastname ? 'error' : ''}
            />
            {errors.lastname && <div className="field-error">{errors.lastname}</div>}
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
              className={errors.email ? 'error' : ''}
            />
            {errors.email && <div className="field-error">{errors.email}</div>}
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
              className={errors.username ? 'error' : ''}
            />
            {errors.username && <div className="field-error">{errors.username}</div>}
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
              className={errors.gender ? 'error' : ''}
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
            {errors.gender && <div className="field-error">{errors.gender}</div>}
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
              className={errors.sexual_preferences ? 'error' : ''}
            >
              <option value="">Select preference</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="both">Both</option>
            </select>
            {errors.sexual_preferences && <div className="field-error">{errors.sexual_preferences}</div>}
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
              className={errors.birth_date ? 'error' : ''}
            />
            {errors.birth_date && <div className="field-error">{errors.birth_date}</div>}
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
            className={errors.biography ? 'error' : ''}
          />
          <div className={`character-counter ${bioLength > 450 ? 'warning' : ''}`}>
            {bioLength}/500 characters
          </div>
          {errors.biography && <div className="field-error">{errors.biography}</div>}
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
