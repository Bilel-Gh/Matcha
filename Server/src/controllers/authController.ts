import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { AppError } from '../utils/AppError';
import { LocationService } from '../services/LocationService';
import { asyncHandler } from '../middlewares/errorHandler';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const userIP = LocationService.getUserIP(req);
  const response = await AuthService.registerUser(req.body, userIP);
  res.status(200).json({
    success: true,
    data: response,
    message: 'Registration successful'
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  // // LIGNE DE TEST POUR ERREUR 500 - À SUPPRIMER APRÈS TEST
  // throw new Error('Test erreur 500 intentionnelle');
  const response = await AuthService.loginUser(req.body);
  res.status(200).json({
    success: true,
    data: response,
    message: 'Login successful'
  });
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  await AuthService.verifyEmail(req.params.token);

  // Check if request expects JSON (from React app)
  if (req.headers.accept && req.headers.accept.includes('application/json')) {
    res.status(200).json({
      success: true,
      data: {},
      message: 'Email verified successfully'
    });
    return;
  }

  // Otherwise return HTML page (for direct browser access)
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Email Verification</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background-color: #f5f5f5;
          }
          .container {
            text-align: center;
            padding: 2rem;
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            max-width: 400px;
          }
          h1 {
            color: #4CAF50;
            margin-bottom: 1rem;
          }
          p {
            color: #666;
            margin-bottom: 1.5rem;
          }
          a {
            display: inline-block;
            background-color: #4CAF50;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 4px;
            transition: background-color 0.3s;
          }
          a:hover {
            background-color: #45a049;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Email Verified!</h1>
          <p>Your email has been successfully verified. You can now log in to your account.</p>
          <a href="http://localhost:8080/login">Go to Login</a>
        </div>
      </body>
    </html>
  `);
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  await AuthService.requestPasswordReset(req.body.email);
  res.status(200).json({
    status: 'success',
    data: {},
    message: 'If an account with this email exists, a password reset link has been sent.'
  });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  await AuthService.resetPassword(req.body.token, req.body.new_password);
  res.status(200).json({
    success: true,
    data: {},
    message: 'Password reset successful'
  });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  // Get user ID from token
  const userId = (req as any).user?.id;

  if (userId) {
    // Mark user as offline using SocketManager
    const { SocketManager } = await import('../config/socket');
    const socketManager = SocketManager.getInstance();
    if (socketManager) {
      await socketManager.forceUserOffline(userId);
    } else {
      // Fallback to direct database update
      const { UserRepository } = await import('../repositories/UserRepository');
      await UserRepository.setOffline(userId);
    }
  }

  res.status(200).json({
    success: true,
    data: {},
    message: 'Logout successful'
  });
});
