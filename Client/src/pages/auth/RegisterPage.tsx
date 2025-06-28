import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FaUser, FaEnvelope, FaLock, FaCalendar, FaUserPlus } from 'react-icons/fa';
import { getErrorMessage, getSuccessMessage, formatFieldError, ApiError } from '../../utils/errorMessages';

interface FormErrors {
  [key: string]: string;
}

const RegisterPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { register, isAuthenticated } = useAuth();

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
      newFieldErrors.username = 'Username is required';
    } else if (username.trim().length < 3) {
      newFieldErrors.username = 'Username must be at least 3 characters long';
    }

    if (!email.trim()) {
      newFieldErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newFieldErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newFieldErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newFieldErrors.password = 'Password must be at least 8 characters long';
    }

    if (password !== confirmPassword) {
      newFieldErrors.confirmPassword = 'Passwords do not match';
    }

    if (!firstName.trim()) {
      newFieldErrors.firstName = 'First name is required';
    }

    if (!lastName.trim()) {
      newFieldErrors.lastName = 'Last name is required';
    }

    if (!birthDate) {
      newFieldErrors.birthDate = 'Birth date is required';
    } else {
      const birth = new Date(birthDate);
      const today = new Date();
      const age = today.getFullYear() - birth.getFullYear();

      if (age < 18) {
        newFieldErrors.birthDate = 'You must be at least 18 years old to register';
      }
    }

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      return;
    }

    setIsLoading(true);

    try {
      await register(username, email, password, firstName, lastName, birthDate);
      setSuccess(getSuccessMessage('REGISTRATION_SUCCESS'));
      setTimeout(() => {
        navigate('/login');
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
      <h2>Create Account</h2>

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
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="firstName">
              <FaUser style={{ marginRight: '8px' }} />
              First Name
            </label>
            <input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Enter your first name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="lastName">
              <FaUser style={{ marginRight: '8px' }} />
              Last Name
            </label>
            <input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Enter your last name"
              required
            />
          </div>

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
              placeholder="Choose a username"
              required
            />
          </div>

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
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="birthDate">
              <FaCalendar style={{ marginRight: '8px' }} />
              Birth Date
            </label>
            <input
              id="birthDate"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
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
              placeholder="Create a password"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">
              <FaLock style={{ marginRight: '8px' }} />
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              required
            />
          </div>
        </div>

        <button type="submit" disabled={isLoading}>
          {isLoading ? (
            'Creating account...'
          ) : (
            <>
              <FaUserPlus style={{ marginRight: '8px' }} />
              Create Account
            </>
          )}
        </button>
      </form>

      <p>
        Already have an account?{' '}
        <Link to="/login">Sign in here</Link>
      </p>
    </div>
  );
};

export default RegisterPage;
