import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { AppError } from '../utils/AppError';
import { LocationService } from '../services/LocationService';
import { v4 as uuidv4 } from 'uuid';

export const register = async (req: Request, res: Response) => {
  try {
    const userIP = LocationService.getUserIP(req);
    const response = await AuthService.registerUser(req.body, userIP);
    res.status(200).json({
      success: true,
      data: response,
      message: 'Registration successful'
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(200).json({
        success: false,
        message: error.message,
        code: error.code || 'REGISTRATION_FAILED',
        error: error.code || 'REGISTRATION_FAILED',
        field: error.field,
        details: error.details
      });
    } else {
      res.status(200).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_ERROR'
      });
    }
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const response = await AuthService.loginUser(req.body);
    res.status(200).json({
      success: true,
      data: response,
      message: 'Login successful'
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(200).json({
        success: false,
        message: error.message,
        error: 'LOGIN_FAILED'
      });
    } else {
      res.status(200).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_ERROR'
      });
    }
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
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
  } catch (error) {
    // Check if request expects JSON (from React app)
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      if (error instanceof AppError) {
        res.status(200).json({
          success: false,
          message: error.message,
          code: error.code || 'EMAIL_VERIFICATION_FAILED',
          error: error.code || 'EMAIL_VERIFICATION_FAILED'
        });
      } else {
        res.status(200).json({
          success: false,
          message: 'Internal server error',
          error: 'INTERNAL_ERROR'
        });
      }
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
              color: #f44336;
              margin-bottom: 1rem;
            }
            p {
              color: #666;
              margin-bottom: 1.5rem;
            }
            a {
              display: inline-block;
              background-color: #f44336;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 4px;
              transition: background-color 0.3s;
            }
            a:hover {
              background-color: #d32f2f;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Verification Failed</h1>
            <p>Sorry, we couldn't verify your email. The link may be invalid or expired.</p>
            <a href="http://localhost:8080/register">Try Again</a>
          </div>
        </body>
      </html>
    `);
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    await AuthService.requestPasswordReset(req.body.email);
    res.status(200).json({
      status: 'success',
      data: {},
      message: 'If an account with this email exists, a password reset link has been sent.'
    });
  } catch (error) {
    res.status(200).json({
      status: 'success',
      data: {},
      message: 'If an account with this email exists, a password reset link has been sent.'
    });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    await AuthService.resetPassword(req.body.token, req.body.new_password);
    res.status(200).json({
      success: true,
      data: {},
      message: 'Password reset successful'
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(200).json({
        success: false,
        message: error.message,
        code: error.code || 'PASSWORD_RESET_FAILED',
        error: error.code || 'PASSWORD_RESET_FAILED'
      });
    } else {
      res.status(200).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_ERROR'
      });
    }
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
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
  } catch (error) {
    // Even if marking offline fails, still allow logout
    res.status(200).json({
      success: true,
      data: {},
      message: 'Logout successful'
    });
  }
};
