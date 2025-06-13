import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import authService from '../../services/authService';

const EmailVerificationPage: React.FC = () => {
  const [message, setMessage] = useState('Verifying your email...');
  const [error, setError] = useState(false);
  const { token } = useParams<{ token: string }>();

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setMessage('Invalid verification link.');
        setError(true);
        return;
      }

      try {
        await authService.verify(token);
        setMessage('Email verified successfully! You can now log in.');
        setError(false);
      } catch (err: any) {
        setMessage(err.response?.data?.message || 'Email verification failed.');
        setError(true);
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div>
      <h2>Email Verification</h2>
      <p style={{ color: error ? 'red' : 'green' }}>{message}</p>
      <Link to="/login">Go to Login</Link>
    </div>
  );
};

export default EmailVerificationPage;
