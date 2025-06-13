import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { asyncHandler } from '../middlewares/errorHandler';

export const register = asyncHandler(async (req: Request, res: Response) => {
    const { email, username, firstName, lastName, password, birthDate } = req.body;

    await AuthService.registerUser({
        email,
        username,
        firstName,
        lastName,
        password,
        birthDate,
    });

    res.status(201).json({
        status: 'success',
        message: 'User registered successfully. Please check your email to verify your account.',
    });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
    const { username, password } = req.body;

    const authData = await AuthService.loginUser({ username, password });

    res.json({
        status: 'success',
        data: authData,
    });
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.params;

    await AuthService.verifyEmail(token);

    res.json({
        status: 'success',
        message: 'Email verified successfully. You can now log in.',
    });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    await AuthService.requestPasswordReset(email);

    res.json({
        status: 'success',
        message: 'If a user with that email exists, a password reset link has been sent.',
    });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { token, new_password } = req.body;

    await AuthService.resetPassword(token, new_password);

    res.json({
        status: 'success',
        message: 'Password has been reset successfully.',
    });
});
