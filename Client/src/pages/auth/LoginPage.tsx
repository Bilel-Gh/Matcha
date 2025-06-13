import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FaUser, FaLock, FaSignInAlt } from 'react-icons/fa';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(username, password);
      navigate('/profile');
    } catch (err) {
      setError('Invalid username or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>Welcome Back</h2>
      {error && <div className="error-message">{error}</div>}

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
