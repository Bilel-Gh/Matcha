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

const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!data.success) {
        // Le serveur retourne maintenant toujours 200, même pour les erreurs d'auth
        throw {
          success: false,
          message: data.message || 'Login failed',
          code: data.error,
          field: data.field
        };
      }

      return data.data!;
    } catch (error: unknown) {
      // Ne traiter par handleApiError que les vraies erreurs de fetch
      if (typeof error === 'object' && error !== null && 'success' in error && error.success === false) {
        throw error; // C'est déjà notre format d'erreur
      }
      throw handleApiError(error);
    }
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!responseData.success) {
        // Le serveur retourne maintenant toujours 200, même pour les erreurs
        throw {
          success: false,
          message: responseData.message || 'Registration failed',
          code: responseData.error,
          field: responseData.field
        };
      }

      return responseData.data!;
    } catch (error: unknown) {
      // Ne traiter par handleApiError que les vraies erreurs de fetch
      if (typeof error === 'object' && error !== null && 'success' in error && error.success === false) {
        throw error; // C'est déjà notre format d'erreur
      }
      throw handleApiError(error);
    }
  },

  async forgotPassword(email: string): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      // Nouveau format : toujours 200, vérifier success
      if (!data.success && data.status !== 'success') {
        // Gérer les erreurs de manière silencieuse (toujours 200 maintenant)
        throw {
          success: false,
          message: data.message || 'Password reset failed',
          code: data.code || data.error,
          field: data.field
        };
      }
    } catch (error: unknown) {
      // Ne traiter par handleApiError que les vraies erreurs de fetch
      if (typeof error === 'object' && error !== null && 'success' in error && error.success === false) {
        throw error; // C'est déjà notre format d'erreur
      }
      throw handleApiError(error);
    }
  },

  async resetPassword(password: string, token: string): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ new_password: password, token }),
      });

      const data = await response.json();

      // Nouveau format : toujours 200, vérifier success
      if (!data.success && data.status !== 'success') {
        // Gérer les erreurs de manière silencieuse (toujours 200 maintenant)
        throw {
          success: false,
          message: data.message || 'Password reset failed',
          code: data.code || data.error,
          field: data.field
        };
      }
    } catch (error: unknown) {
      // Ne traiter par handleApiError que les vraies erreurs de fetch
      if (typeof error === 'object' && error !== null && 'success' in error && error.success === false) {
        throw error; // C'est déjà notre format d'erreur
      }
      throw handleApiError(error);
    }
  },

    async verify(token: string): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/api/auth/verify/${token}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json', // Important : indique au serveur qu'on veut du JSON
        },
      });

      const data = await response.json();

      // Nouveau format : toujours 200, vérifier success
      if (!data.success) {
        // Gérer les erreurs de manière silencieuse (toujours 200 maintenant)
        throw {
          success: false,
          message: data.message || 'Email verification failed',
          code: data.error,
          field: data.field
        };
      }
    } catch (error: unknown) {
      // Ne traiter par handleApiError que les vraies erreurs de fetch
      if (typeof error === 'object' && error !== null && 'success' in error && error.success === false) {
        throw error; // C'est déjà notre format d'erreur
      }
      throw handleApiError(error);
    }
  },
};

export default authService;
