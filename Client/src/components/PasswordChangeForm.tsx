import React, { useState } from 'react';
import { FaLock, FaKey, FaEye, FaEyeSlash } from 'react-icons/fa';
import { PasswordChangeData } from '../services/profileService';

interface PasswordChangeFormProps {
  onChangePassword: (data: PasswordChangeData) => Promise<void>;
  isLoading: boolean;
}

const PasswordChangeForm: React.FC<PasswordChangeFormProps> = ({
  onChangePassword,
  isLoading,
}) => {
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [errors, setErrors] = useState<string[]>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/(?=.*\d)/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    // Validation
    const validationErrors: string[] = [];

    if (!formData.current_password) {
      validationErrors.push('Current password is required');
    }

    if (!formData.new_password) {
      validationErrors.push('New password is required');
    } else {
      const passwordErrors = validatePassword(formData.new_password);
      validationErrors.push(...passwordErrors);
    }

    if (formData.new_password !== formData.confirm_password) {
      validationErrors.push('New passwords do not match');
    }

    if (formData.current_password === formData.new_password) {
      validationErrors.push('New password must be different from current password');
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      await onChangePassword({
        current_password: formData.current_password,
        new_password: formData.new_password,
      });

      // Clear form on success
      setFormData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
    } catch (error) {
      // Error handling is done in parent component
    }
  };

  return (
    <div className="profile-section security-section">
      <h3>Security</h3>
      <p className="section-description">
        Change your password to keep your account secure.
      </p>

      <form onSubmit={handleSubmit}>
        {errors.length > 0 && (
          <div className="form-errors">
            {errors.map((error, index) => (
              <div key={index} className="error-message">
                {error}
              </div>
            ))}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="current_password">
            <FaLock style={{ marginRight: '8px' }} />
            Current Password
          </label>
          <div className="password-input-wrapper">
            <input
              id="current_password"
              name="current_password"
              type={showPasswords.current ? 'text' : 'password'}
              value={formData.current_password}
              onChange={handleInputChange}
              placeholder="Enter your current password"
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => togglePasswordVisibility('current')}
            >
              {showPasswords.current ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="new_password">
            <FaKey style={{ marginRight: '8px' }} />
            New Password
          </label>
          <div className="password-input-wrapper">
            <input
              id="new_password"
              name="new_password"
              type={showPasswords.new ? 'text' : 'password'}
              value={formData.new_password}
              onChange={handleInputChange}
              placeholder="Enter your new password"
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => togglePasswordVisibility('new')}
            >
              {showPasswords.new ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          <div className="password-requirements">
            <small>
              Password must be at least 8 characters with uppercase, lowercase, and number.
            </small>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="confirm_password">
            <FaKey style={{ marginRight: '8px' }} />
            Confirm New Password
          </label>
          <div className="password-input-wrapper">
            <input
              id="confirm_password"
              name="confirm_password"
              type={showPasswords.confirm ? 'text' : 'password'}
              value={formData.confirm_password}
              onChange={handleInputChange}
              placeholder="Confirm your new password"
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => togglePasswordVisibility('confirm')}
            >
              {showPasswords.confirm ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="change-password-button"
        >
          {isLoading ? 'Changing Password...' : 'Change Password'}
        </button>
      </form>
    </div>
  );
};

export default PasswordChangeForm;
