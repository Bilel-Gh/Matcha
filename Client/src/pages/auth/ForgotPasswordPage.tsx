import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FaEnvelope, FaArrowLeft } from 'react-icons/fa';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { forgotPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      await forgotPassword(email);
      setSuccess('Password reset instructions have been sent to your email.');
    } catch (err) {
      setError('Failed to send reset instructions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>Reset Password</h2>
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

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
            placeholder="Enter your email"
            required
          />
        </div>

        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Sending...' : 'Send Reset Instructions'}
        </button>
      </form>

      <p>
        <Link to="/login">
          <FaArrowLeft style={{ marginRight: '8px' }} />
          Back to Login
        </Link>
      </p>
    </div>
  );
};

export default ForgotPasswordPage;
