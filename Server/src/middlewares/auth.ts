import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/UserRepository';
import { AppError } from '../utils/AppError';
import { asyncHandler } from './errorHandler';
import config from '../config/config';

interface JwtPayload {
  id: number;
}

export const protect = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const bearer = req.headers.authorization;

  if (!bearer || !bearer.startsWith('Bearer ')) {
    throw new AppError('Access token required', 401);
  }

  const token = bearer.split(' ')[1];
  if (!token) {
    throw new AppError('Access token required', 401);
  }

  const decoded = jwt.verify(token, config.JWT_SECRET) as JwtPayload;
  const user = await UserRepository.findById(decoded.id);

  if (!user) {
    throw new AppError('User not found', 401);
  }

  if (!user.email_verified) {
    throw new AppError('Email not verified', 403);
  }

  req.user = user;
  next();
});

// Alias for backward compatibility
export const authenticateToken = protect;
