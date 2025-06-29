import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FaLock, FaCheckCircle, FaArrowLeft } from 'react-icons/fa';
import authService from '../../services/authService';
import { getErrorMessage, getSuccessMessage, formatFieldError, ApiError } from '../../utils/errorMessages';

interface FormErrors {
  [key: string]: string;
}

const ResetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Check for token and redirect if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/profile', { replace: true });
      return;
    }

    if (!token) {
      setError('Invalid or missing reset token. Please request a new password reset.');
      return;
    }
  }, [isAuthenticated, navigate, token]);

  const clearErrors = () => {
    setError('');
    setFieldErrors({});
  };

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();
    setSuccess('');

    if (!token) {
      setError('Invalid or missing reset token. Please request a new password reset.');
      return;
    }

    // Client-side validation
    const newFieldErrors: FormErrors = {};

    if (!password) {
      newFieldErrors.password = 'New password is required';
    } else {
      const passwordErrors = validatePassword(password);
      if (passwordErrors.length > 0) {
        newFieldErrors.password = passwordErrors[0]; // Show first error
      }
    }

    if (!confirmPassword) {
      newFieldErrors.confirmPassword = 'Please confirm your new password';
    } else if (password !== confirmPassword) {
      newFieldErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      return;
    }

    setIsLoading(true);

    try {
      await authService.resetPassword(password, token);
      setSuccess(getSuccessMessage('PASSWORD_UPDATED'));

      // Clear form and redirect after success
      setPassword('');
      setConfirmPassword('');

      setTimeout(() => {
        navigate('/login', {
          state: { message: 'Password updated successfully! You can now log in with your new password.' }
        });
      }, 3000);
    } catch (err: unknown) {
      const apiError = err as ApiError;

      // Handle field-specific errors
      if (apiError.field) {
        const fieldError = formatFieldError(apiError);
        setFieldErrors({ [fieldError.field!]: fieldError.message });
      } else {
        // Handle general errors
        setError(getErrorMessage(apiError));

        // If token is invalid, provide helpful message
        if (apiError.code === 'INVALID_TOKEN' || apiError.message?.includes('expired')) {
          setError('This reset link has expired or is invalid. Please request a new password reset.');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="auth-container">
        <div className="auth-header">
          <h1>Invalid Reset Link</h1>
          <p>This password reset link is invalid or has expired</p>
        </div>

        <div className="error-message">Invalid or missing reset token. Please request a new password reset.</div>

        <p className="auth-link">
          <Link to="/forgot-password">Request New Reset Link</Link>
        </p>
        <p className="auth-link">
          <Link to="/login">
            <FaArrowLeft style={{ marginRight: '5px' }} />
            Back to Login
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-header">
        <h1>Set a New Password</h1>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      {Object.keys(fieldErrors).length > 0 && (
        <div className="error-message">
          {Object.values(fieldErrors).map((err, idx) => (
            <div key={idx}>{err}</div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="password">
            <FaLock style={{ marginRight: '8px' }} />
            New Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your new password"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">
            <FaLock style={{ marginRight: '8px' }} />
            Confirm New Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your new password"
            required
          />
        </div>

        <button type="submit" disabled={isLoading || !!success}>
          {isLoading ? (
            'Resetting...'
          ) : (
            <>
              <FaCheckCircle style={{ marginRight: '8px' }} />
              Reset Password
            </>
          )}
        </button>
      </form>

      <p className="auth-link">
        <Link to="/login">
          <FaArrowLeft style={{ marginRight: '5px' }} />
          Back to Login
        </Link>
      </p>
    </div>
  );
};

export default ResetPasswordPage;
