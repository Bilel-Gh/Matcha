import axios from 'axios';
import { handleApiError } from '../utils/errorMessages';

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
  token: string;
  user: User;
}

// Interface pour les erreurs du serveur (format différent de nos types clients)
interface ServerErrorResponse {
  success: false;
  message: string;
  error?: string;
  field?: string;
}

const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await axios.post<any>(`${API_URL}/api/auth/login`, credentials);

      if (!response.data.success) {
        // Retourner directement l'erreur du serveur sans double traitement
        const errorData = response.data as ServerErrorResponse;
        throw {
          success: false,
          message: errorData.message || 'Login failed',
          code: errorData.error,
          field: errorData.field
        };
      }

      return response.data.data!;
    } catch (error: unknown) {
      // Ne traiter par handleApiError que les vraies erreurs d'axios
      if (typeof error === 'object' && error !== null && 'success' in error && error.success === false) {
        throw error; // C'est déjà notre format d'erreur
      }
      throw handleApiError(error);
    }
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await axios.post<any>(`${API_URL}/api/auth/register`, data);

      if (!response.data.success) {
        // Retourner directement l'erreur du serveur sans double traitement
        const errorData = response.data as ServerErrorResponse;
        throw {
          success: false,
          message: errorData.message || 'Registration failed',
          code: errorData.error,
          field: errorData.field
        };
      }

      return response.data.data!;
    } catch (error: unknown) {
      // Ne traiter par handleApiError que les vraies erreurs d'axios
      if (typeof error === 'object' && error !== null && 'success' in error && error.success === false) {
        throw error; // C'est déjà notre format d'erreur
      }
      throw handleApiError(error);
    }
  },

  async forgotPassword(email: string): Promise<void> {
    try {
      const response = await axios.post<any>(`${API_URL}/api/auth/forgot-password`, { email });

      if (response.data.status !== 'success') {
        // Retourner directement l'erreur du serveur sans double traitement
        const errorData = response.data;
        throw {
          success: false,
          message: errorData.message || 'Password reset failed',
          code: errorData.code || errorData.error,
          field: errorData.field
        };
      }
    } catch (error: unknown) {
      // Ne traiter par handleApiError que les vraies erreurs d'axios
      if (typeof error === 'object' && error !== null && 'success' in error && error.success === false) {
        throw error; // C'est déjà notre format d'erreur
      }
      throw handleApiError(error);
    }
  },

  async resetPassword(password: string, token: string): Promise<void> {
    try {
      const response = await axios.post<any>(`${API_URL}/api/auth/reset-password`, { new_password: password, token });

      if (response.data.status !== 'success') {
        // Retourner directement l'erreur du serveur sans double traitement
        const errorData = response.data;
        throw {
          success: false,
          message: errorData.message || 'Password reset failed',
          code: errorData.code || errorData.error,
          field: errorData.field
        };
      }
    } catch (error: unknown) {
      // Ne traiter par handleApiError que les vraies erreurs d'axios
      if (typeof error === 'object' && error !== null && 'success' in error && error.success === false) {
        throw error; // C'est déjà notre format d'erreur
      }
      throw handleApiError(error);
    }
  },

    async verify(token: string): Promise<void> {
    try {
      const response = await axios.get<any>(`${API_URL}/api/auth/verify/${token}`);

      if (!response.data.success) {
        // Retourner directement l'erreur du serveur sans double traitement
        const errorData = response.data as ServerErrorResponse;
        throw {
          success: false,
          message: errorData.message || 'Email verification failed',
          code: errorData.error,
          field: errorData.field
        };
      }
    } catch (error: unknown) {
      // Ne traiter par handleApiError que les vraies erreurs d'axios
      if (typeof error === 'object' && error !== null && 'success' in error && error.success === false) {
        throw error; // C'est déjà notre format d'erreur
      }
      throw handleApiError(error);
    }
  },
};

export default authService;
