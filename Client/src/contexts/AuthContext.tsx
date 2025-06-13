import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

interface User {
  id: string;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, firstName: string, lastName: string, birthDate: string) => Promise<void>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

  useEffect(() => {
    console.log('Current token:', token);
    if (token) {
      localStorage.setItem('token', token);
      console.log('Token saved to localStorage');
    } else {
      localStorage.removeItem('token');
      console.log('Token removed from localStorage');
    }
  }, [token]);

  const login = async (username: string, password: string) => {
    try {
      console.log('Attempting login...');
      const response = await authService.login({ username, password });
      console.log('Login response received:', response.data);

      const { token: newToken, user: userData } = response.data.data;
      console.log('New token:', newToken);
      console.log('User data:', userData);

      setToken(newToken);
      setUser(userData);

      // Vérification immédiate
      console.log('Token after set:', newToken);
      console.log('localStorage token:', localStorage.getItem('token'));
    } catch (error) {
      console.error('Login error in context:', error);
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
  ) => {
    try {
      const response = await authService.register({
        username,
        email,
        password,
        firstName,
        lastName,
        birthDate,
      });
      return response;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = () => {
    console.log('Logging out...');
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    console.log('Logout complete, localStorage token:', localStorage.getItem('token'));
  };

  const forgotPassword = async (email: string) => {
    try {
      await authService.forgotPassword(email);
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  };

  const resetPassword = async (token: string, password: string) => {
    try {
      await authService.resetPassword(password, token);
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  };

  const isAuthenticated = !!token;
  console.log('isAuthenticated:', isAuthenticated);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        login,
        register,
        logout,
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
