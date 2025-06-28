import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FaCheckCircle, FaExclamationTriangle, FaSpinner } from 'react-icons/fa';
import authService from '../../services/authService';
import { getErrorMessage, getSuccessMessage, ApiError } from '../../utils/errorMessages';

const EmailVerificationPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const token = searchParams.get('token');

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated) {
      navigate('/profile', { replace: true });
      return;
    }

    // Verify email if token is present
    if (token) {
      verifyEmail(token);
    } else {
      setError('Invalid or missing verification token.');
      setIsLoading(false);
    }
  }, [token, isAuthenticated, navigate]);

  const verifyEmail = async (verificationToken: string) => {
    try {
      setIsLoading(true);
      setError('');

      await authService.verify(verificationToken);

      setSuccess(getSuccessMessage('EMAIL_VERIFIED'));

      // Redirect to login after successful verification
      setTimeout(() => {
        navigate('/login', {
          state: {
            message: 'Email verified successfully! You can now log in to your account.',
            verified: true
          }
        });
      }, 3000);
    } catch (err: unknown) {
      const apiError = err as ApiError;
      setError(getErrorMessage(apiError));

      // Provide specific guidance based on error type
      if (apiError.code === 'INVALID_TOKEN') {
        setError('This verification link is invalid or has already been used.');
      } else if (apiError.message?.includes('expired')) {
        setError('This verification link has expired. Please request a new verification email.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = () => {
    navigate('/forgot-password');
  };

  if (isLoading) {
    return (
      <div className="auth-container">
        <div className="auth-header">
          <h1><FaSpinner className="spinning" /> Verifying Email</h1>
          <p>Please wait while we verify your email address...</p>
        </div>

        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
          <FaSpinner className="spinning" style={{ fontSize: '3rem', marginBottom: '1rem' }} />
          <p>Verifying your account...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="auth-container">
        <div className="auth-header">
          <h1><FaExclamationTriangle /> Verification Failed</h1>
          <p>We couldn't verify your email address</p>
        </div>

        <div className="error-message">{error}</div>

        {(error.includes('expired') || error.includes('invalid')) && (
          <button
            onClick={handleResendVerification}
            style={{ marginTop: '1rem' }}
          >
            Request New Verification Link
          </button>
        )}

        <p>
          <Link to="/login">Back to Sign In</Link>
        </p>
        <p>
          Don't have an account?
          <Link to="/register">Create one here</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-header">
        <h1><FaCheckCircle /> Email Verified!</h1>
        <p>Your email has been successfully verified</p>
      </div>

      <div className="success-message">{success}</div>

      <div style={{ textAlign: 'center', padding: '2rem 0' }}>
        <FaCheckCircle style={{ fontSize: '4rem', color: '#28a745', marginBottom: '1rem' }} />
        <h3>Welcome to Matcha! 🎉</h3>
        <p>Your account is now active and ready to use.</p>
      </div>

      <button
        onClick={() => navigate('/login')}
        style={{ marginTop: '1rem' }}
      >
        Continue to Sign In
      </button>

      <p>
        <Link to="/register">Create another account</Link>
      </p>
    </div>
  );
};

export default EmailVerificationPage;
