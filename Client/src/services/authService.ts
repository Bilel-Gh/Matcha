import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface LoginCredentials {
  username: string;
  password: string;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  birthDate: string;
}

interface User {
  id: string;
  username: string;
  email: string;
}

interface AuthResponse {
  status: string;
  data: {
    token: string;
    user: User;
  };
}

const authService = {
  async login(credentials: LoginCredentials): Promise<{ data: AuthResponse }> {
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, credentials);
      return response;
    } catch (error) {
      console.error('Login service error:', error);
      throw error;
    }
  },

  async register(data: RegisterData): Promise<{ data: AuthResponse }> {
    try {
      const response = await axios.post(`${API_URL}/api/auth/register`, data);
      return response;
    } catch (error) {
      console.error('Register service error:', error);
      throw error;
    }
  },

  async forgotPassword(email: string): Promise<void> {
    try {
      await axios.post(`${API_URL}/api/auth/forgot-password`, { email });
    } catch (error) {
      console.error('Forgot password service error:', error);
      throw error;
    }
  },

  async resetPassword(password: string, token: string): Promise<void> {
    try {
      await axios.post(`${API_URL}/api/auth/reset-password`, { password, token });
    } catch (error) {
      console.error('Reset password service error:', error);
      throw error;
    }
  },
};

export default authService;
