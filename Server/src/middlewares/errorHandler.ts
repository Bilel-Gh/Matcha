import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import logger from '../utils/logger';

interface StandardErrorResponse {
  success: false;
  message: string;
  code?: string;
  field?: string;
  details?: string[];
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = { ...err } as AppError;
  error.message = err.message;

  const errorResponse: StandardErrorResponse = {
    success: false,
    message: 'An unexpected error occurred',
  };

  // Handle AppError instances with specific details
  if (err instanceof AppError) {
    errorResponse.message = err.message;

    if (err.statusCode === 400) {
      errorResponse.code = 'VALIDATION_ERROR';
    } else if (err.statusCode === 401) {
      errorResponse.code = 'AUTHENTICATION_ERROR';
    } else if (err.statusCode === 403) {
      errorResponse.code = 'AUTHORIZATION_ERROR';
    } else if (err.statusCode === 404) {
      errorResponse.code = 'NOT_FOUND';
    } else if (err.statusCode === 409) {
      errorResponse.code = 'CONFLICT_ERROR';
    }

    // Include validation details if available
    if (err.details && Array.isArray(err.details)) {
      errorResponse.details = err.details;
    }
  }

  // Database constraint errors
  if (err.message.includes('duplicate key') || err.message.includes('already exists')) {
    if (err.message.includes('email')) {
      errorResponse.message = 'Email already exists';
      errorResponse.code = 'EMAIL_EXISTS';
      errorResponse.field = 'email';
    } else if (err.message.includes('username')) {
      errorResponse.message = 'Username already taken';
      errorResponse.code = 'USERNAME_TAKEN';
      errorResponse.field = 'username';
    } else {
      errorResponse.message = 'This information already exists';
      errorResponse.code = 'DUPLICATE_ERROR';
    }
  }

  // JWT errors - return 401 instead of 500
  let statusCode = err instanceof AppError ? err.statusCode : 500;

  if (err.name === 'JsonWebTokenError') {
    errorResponse.message = 'Invalid authentication token';
    errorResponse.code = 'INVALID_TOKEN';
    statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    errorResponse.message = 'Authentication token expired';
    errorResponse.code = 'TOKEN_EXPIRED';
    statusCode = 401;
  }

  const originalStatusCode = statusCode;

  // Log les erreurs 500+ pour le debug serveur
  if (originalStatusCode >= 500) {
    logger.error(`Error ${originalStatusCode} on ${req.method} ${req.url}`, {
      message: err.message,
      stack: err.stack,
      body: req.body,
      user: (req as any).user?.id || 'Anonymous'
    });
  }

  if (originalStatusCode < 500) {
    res.status(200).json(errorResponse);
  } else {
    res.status(originalStatusCode).json(errorResponse);
  }
};

// Async error handler wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
