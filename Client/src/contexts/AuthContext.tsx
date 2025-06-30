import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';
import profileService from '../services/profileService';

interface User {
  id: string;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  profile_picture_url?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, firstName: string, lastName: string, birthDate: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  refreshUser: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const savedToken = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');

        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
        }
      } catch (error) {
        // Clear corrupted data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  const login = async (username: string, password: string) => {
    try {
      const response = await authService.login({ username, password });
      const { token: newToken, user: userData } = response;

      setToken(newToken);
      setUser(userData);
    } catch (error) {
      throw error;
    }
  };

  const register = async (
    username: string,
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    birthDate: string
  ): Promise<void> => {
    try {
      await authService.register({
        username,
        email,
        password,
        firstName,
        lastName,
        birthDate,
      });
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    // Mark user as offline before clearing auth state
    if (token) {
      try {
        // Also emit socket event to force offline status first
        const socket = (window as any).socket;
        if (socket && socket.connected) {
          socket.emit('user-offline-force');
          // Wait a bit for the event to be processed
          await new Promise(resolve => setTimeout(resolve, 100));
          socket.disconnect();
        }

        // Send offline status to server
        await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      } catch (error) {
        // Silent error handling - don't block logout
      }
    }

    // Clear auth state
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
    }
  };

  const refreshUser = async () => {
    if (!token) return;

    try {
      const userInfo = await profileService.getUserInfo(token);
      setUser({
        id: user?.id || '',
        ...userInfo,
      });
    } catch (error) {
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      await authService.forgotPassword(email);
    } catch (error) {
      throw error;
    }
  };

  const resetPassword = async (token: string, password: string) => {
    try {
      await authService.resetPassword(password, token);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'An unexpected error occurred.';
      // Handle cases where server returns an array of error messages
      const finalMessage = Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage;
      throw new Error(finalMessage);
    }
  };

  const isAuthenticated = !!token && !!user;

      return (
      <AuthContext.Provider
        value={{
          user,
          token,
          isAuthenticated,
          isLoading,
          login,
          register,
          logout,
          updateUser,
          refreshUser,
          forgotPassword,
          resetPassword,
        }}
      >
        {children}
      </AuthContext.Provider>
    );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
