import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import logger from '../utils/logger';

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
  let status: 'error' | 'fail' = 'error';
  let responseMessage: any = err.message;

  // If it's an AppError, use its properties
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    status = err.statusCode < 500 ? 'fail' : 'error';
    if (err.details) {
      responseMessage = err.details;
    }
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
    message: responseMessage || 'Something went wrong',
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
