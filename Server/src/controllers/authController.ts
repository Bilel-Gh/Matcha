import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { AppError } from '../utils/AppError';
import { v4 as uuidv4 } from 'uuid';

export const register = async (req: Request, res: Response) => {
  try {
    const response = await AuthService.registerUser(req.body);
    res.status(201).json({
      status: 'success',
      data: response,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        status: 'error',
        message: error.message,
      });
    } else {
      console.error('Registration error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
      });
    }
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const response = await AuthService.loginUser(req.body);
    res.status(200).json({
      status: 'success',
      data: response,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        status: 'error',
        message: error.message,
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
      });
    }
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    await AuthService.verifyEmail(req.params.token);
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
      message: 'Password reset email sent',
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        status: 'error',
        message: error.message,
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
      });
    }
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    await AuthService.resetPassword(req.body.token, req.body.new_password);
    res.status(200).json({
      status: 'success',
      message: 'Password reset successful',
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        status: 'error',
        message: error.message,
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
      });
    }
  }
};
