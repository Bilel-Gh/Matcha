import React, { useState } from 'react';
import authService from '../../services/authService';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    firstName: '',
    lastName: '',
    password: '',
    birthDate: '',
  });
  const [error, setError] = useState<string | string[]>('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      await authService.register(formData);
      setSuccess('Registration successful! Please check your email to verify your account.');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const errorData = err.response.data;
        if (Array.isArray(errorData.message)) {
          setError(errorData.message);
        } else {
          setError(errorData.message || 'Registration failed');
        }
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        {error && (
            <div className="error-message">
                {Array.isArray(error) ? (
                    <ul>
                        {error.map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
                ) : (
                    error
                )}
            </div>
        )}
        {success && <p className="success-message">{success}</p>}
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" name="email" placeholder="Email" onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input id="username" type="text" name="username" placeholder="Username" onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="firstName">First Name</label>
          <input id="firstName" type="text" name="firstName" placeholder="First Name" onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="lastName">Last Name</label>
          <input id="lastName" type="text" name="lastName" placeholder="Last Name" onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" name="password" placeholder="Password" onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="birthDate">Birth Date</label>
          <input id="birthDate" type="date" name="birthDate" onChange={handleChange} required />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
      <p>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
};

export default RegisterPage;
