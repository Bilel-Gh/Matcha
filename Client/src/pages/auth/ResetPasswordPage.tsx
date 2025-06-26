import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FaLock, FaCheckCircle, FaExclamationCircle, FaArrowLeft } from 'react-icons/fa';
import axios from 'axios';

const ResetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { resetPassword } = useAuth();

  useEffect(() => {
    if (password) {
      validatePassword(password);
    } else {
      setPasswordErrors([]);
    }
  }, [password]);

  const validatePassword = (pwd: string) => {
    const errors: string[] = [];
    if (pwd.length < 8) {
      errors.push('Password must be at least 8 characters long.');
    }
    if (!/[A-Z]/.test(pwd)) {
      errors.push('Password must contain at least one uppercase letter.');
    }
    if (!/[a-z]/.test(pwd)) {
      errors.push('Password must contain at least one lowercase letter.');
    }
    if (!/[0-9]/.test(pwd)) {
      errors.push('Password must contain at least one number.');
    }
    setPasswordErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!validatePassword(password)) {
      setError('Please fix the errors in your password.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!token) {
      setError('No reset token found. Please request a new link.');
      return;
    }

    setIsLoading(true);

    try {
      await resetPassword(token, password);
      setMessage('Password has been reset successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 3000);
    } catch (error: any) {
      const errorMessage = error.message || 'An unexpected error occurred.';
      if (errorMessage.toLowerCase().includes('token')) {
        setError('This reset link is invalid or has expired. Please request a new one.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-header">
        <h1>Set a New Password</h1>
      </div>

      {error && <div className="error-message">{error}</div>}
      {message && <div className="success-message">{message}</div>}

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

        {passwordErrors.length > 0 && (
          <div className="password-requirements">
            {passwordErrors.map((err, index) => (
              <p key={index} className="error-text">
                <FaExclamationCircle style={{ marginRight: '5px' }} />
                {err}
              </p>
            ))}
          </div>
        )}

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

        <button type="submit" disabled={isLoading || !!message || passwordErrors.length > 0}>
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

      {error.toLowerCase().includes('token') && (
        <p className="auth-link">
          <Link to="/forgot-password">Request a new reset link</Link>
        </p>
      )}

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
