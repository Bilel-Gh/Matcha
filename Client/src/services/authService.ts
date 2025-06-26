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
    const response = await axios.post(`${API_URL}/api/auth/login`, credentials);
    return response;
  },

  async register(data: RegisterData): Promise<{ data: AuthResponse }> {
    const response = await axios.post(`${API_URL}/api/auth/register`, data);
    return response;
  },

  async forgotPassword(email: string): Promise<void> {
    await axios.post(`${API_URL}/api/auth/forgot-password`, { email });
  },

  async resetPassword(password: string, token: string): Promise<void> {
    await axios.post(`${API_URL}/api/auth/reset-password`, { new_password: password, token });
  },

  async verify(token: string): Promise<void> {
    await axios.get(`${API_URL}/api/auth/verify/${token}`);
  },
};

export default authService;
