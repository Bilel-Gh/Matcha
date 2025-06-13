import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

interface ErrorResponse {
  message: string;
  status: 'error' | 'fail';
  stack?: string;
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = { ...err } as AppError;
  error.message = err.message;

  // Default error values
  let statusCode = 500;
  let status = 'error';

  // If it's an AppError, use its properties
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    status = err.statusCode < 500 ? 'fail' : 'error';
  }

  // Database errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    status = 'fail';
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    status = 'fail';
    error.message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    status = 'fail';
    error.message = 'Token expired';
  }

  const errorResponse: ErrorResponse = {
    message: error.message || 'Something went wrong',
    status,
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
    console.error('Error:', err);
  }

  res.status(statusCode).json(errorResponse);
};

// Async error handler wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
