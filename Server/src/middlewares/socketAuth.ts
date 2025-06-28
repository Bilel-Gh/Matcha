import jwt from 'jsonwebtoken';
import { Socket } from 'socket.io';
import { UserRepository } from '../repositories/UserRepository';
import { User } from '../types/user';
import config from '../config/config';

interface JwtPayload {
  id: number;
}

interface AuthenticatedSocket extends Socket {
  user?: User;
}

/**
 * Socket.IO authentication middleware
 * Verifies JWT token and attaches user to socket
 */
export const socketAuth = async (socket: AuthenticatedSocket, next: Function) => {
  try {
    // Get token from handshake auth or query
    const token = socket.handshake.auth?.token || socket.handshake.query?.token as string;

    if (!token) {
      return next(new Error('Authentication token required'));
    }

    // Verify JWT token
    const decoded = jwt.verify(token, config.JWT_SECRET) as JwtPayload;

    if (!decoded.id) {
      return next(new Error('Invalid token payload'));
    }

    // Get user from database
    const user = await UserRepository.findById(decoded.id);

    if (!user) {
      return next(new Error('User not found'));
    }

    if (!user.email_verified) {
      return next(new Error('Email not verified'));
    }

    // Attach user to socket
    socket.user = user;

    // Update user online status and last connection
    await UserRepository.updateLastConnection(user.id);

    next();
  } catch (error) {
    // Silent error handling - no console output for defense requirements

    if (error instanceof jwt.JsonWebTokenError) {
      return next(new Error('Invalid token'));
    }

    if (error instanceof jwt.TokenExpiredError) {
      return next(new Error('Token expired'));
    }

    return next(new Error('Authentication failed'));
  }
};

/**
 * Extract user ID from socket for easy access
 */
export const getUserId = (socket: AuthenticatedSocket): number | null => {
  return socket.user?.id || null;
};

/**
 * Get user info from socket
 */
export const getUserInfo = (socket: AuthenticatedSocket): User | null => {
  return socket.user || null;
};

/**
 * Check if socket has valid user
 */
export const isAuthenticated = (socket: AuthenticatedSocket): boolean => {
  return !!socket.user;
};

export { AuthenticatedSocket };
