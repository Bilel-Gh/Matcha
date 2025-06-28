import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FaUser, FaLock, FaSignInAlt } from 'react-icons/fa';
import { getErrorMessage, getSuccessMessage, formatFieldError, ApiError } from '../../utils/errorMessages';

interface FormErrors {
  [key: string]: string;
}

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

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

    if (!username.trim()) {
      newFieldErrors.username = 'Email or username is required';
    }

    if (!password) {
      newFieldErrors.password = 'Password is required';
    }

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      return;
    }

    setIsLoading(true);

    try {
      await login(username, password);
      setSuccess(getSuccessMessage('LOGIN_SUCCESS'));
      navigate('/profile');
    } catch (err: unknown) {
      const apiError = err as ApiError;

      // Handle field-specific errors
      if (apiError.field) {
        const fieldError = formatFieldError(apiError);
        setFieldErrors({ [fieldError.field!]: fieldError.message });
      } else {
        // Handle general errors with user-friendly messages
        setError(getErrorMessage(apiError));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-header">
        <h1>Matcha</h1>
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
          <label htmlFor="username">
            <FaUser style={{ marginRight: '8px' }} />
            Username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">
            <FaLock style={{ marginRight: '8px' }} />
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />
        </div>

        <button type="submit" disabled={isLoading}>
          {isLoading ? (
            'Signing in...'
          ) : (
            <>
              <FaSignInAlt style={{ marginRight: '8px' }} />
              Sign In
            </>
          )}
        </button>
      </form>

      <p>
        <Link to="/forgot-password">Forgot your password?</Link>
      </p>
      <p>
        Don't have an account?{' '}
        <Link to="/register">Create one now</Link>
      </p>
    </div>
  );
};

export default LoginPage;
