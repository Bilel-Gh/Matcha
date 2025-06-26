import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FaEnvelope, FaArrowLeft } from 'react-icons/fa';
import axios from 'axios';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const { forgotPassword } = useAuth();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldown > 0) {
      setError(`Please wait ${cooldown} seconds before trying again.`);
      return;
    }

    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      await forgotPassword(email);
      setMessage('If an account with this email exists, a password reset link has been sent.');
      setIsSent(true);
      setCooldown(60); // 60-second cooldown
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const errorMessage = err.response?.data?.message || 'Failed to send reset link.';
        setError(errorMessage);
      } else {
        setError('An unexpected error occurred. Please try again.');
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
      {message && <div className="success-message">{message}</div>}

      {!isSent ? (
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

          <button type="submit" disabled={isLoading || cooldown > 0}>
            {isLoading
              ? 'Sending Link...'
              : cooldown > 0
              ? `Resend in ${cooldown}s`
              : 'Send Recovery Link'}
          </button>
        </form>
      ) : (
        <div className="resend-info">
          <p>You can request another link in {cooldown} seconds.</p>
        </div>
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

export default ForgotPasswordPage;
