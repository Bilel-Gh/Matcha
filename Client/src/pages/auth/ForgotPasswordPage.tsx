import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FaEnvelope, FaArrowLeft } from 'react-icons/fa';
import authService from '../../services/authService';
import { getErrorMessage, getSuccessMessage, formatFieldError, ApiError } from '../../utils/errorMessages';

interface FormErrors {
  [key: string]: string;
}

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Redirect if already authenticated when component mounts
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/profile', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const clearErrors = () => {
    setError('');
    setFieldErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();
    setSuccess('');

    // Client-side validation
    const newFieldErrors: FormErrors = {};

    if (!email.trim()) {
      newFieldErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newFieldErrors.email = 'Please enter a valid email address';
    }

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      return;
    }

    setIsLoading(true);

    try {
      await authService.forgotPassword(email);
      setSuccess(getSuccessMessage('PASSWORD_RESET_SENT'));
      setEmail(''); // Clear the form
    } catch (err: unknown) {
      const apiError = err as ApiError;

      // Handle field-specific errors
      if (apiError.field) {
        const fieldError = formatFieldError(apiError);
        setFieldErrors({ [fieldError.field!]: fieldError.message });
      } else {
        // Handle general errors
        setError(getErrorMessage(apiError));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-header">
        <h1>Password Recovery</h1>
        <p>Enter your email to receive a reset link</p>
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
          <label htmlFor="email">
            <FaEnvelope style={{ marginRight: '8px' }} />
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            required
          />
        </div>

        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Sending Link...' : 'Send Recovery Link'}
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

export default ForgotPasswordPage;
