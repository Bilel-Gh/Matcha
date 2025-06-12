import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import * as UserModel from '../models/User';

export const register = async (req: Request, res: Response) => {
    const { email, username, firstName, lastName, password, birthDate } = req.body;

    try {
        const existingUser = await UserModel.findUserByEmail(email) || await UserModel.findUserByUsername(username);
        if (existingUser) {
            return res.status(409).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = uuidv4();

        const user = await UserModel.createUser({
            email,
            username,
            firstname: firstName,
            lastname: lastName,
            password: hashedPassword,
            verification_token: verificationToken,
            birth_date: new Date(birthDate),
        });

        // In a real app, you would send an email with the verification link
        console.log(`Verification token for ${email}: ${verificationToken}`);

        res.status(201).json({ message: 'User registered successfully. Please check your email to verify your account.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const login = async (req: Request, res: Response) => {
    const { username, password } = req.body;

    try {
        const user = await UserModel.findUserByUsername(username);
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (!user.email_verified) {
            return res.status(403).json({ message: 'Please verify your email before logging in.' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET as string, {
            expiresIn: '1d',
        });

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                first_name: user.firstname,
                last_name: user.lastname,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const verifyEmail = async (req: Request, res: Response) => {
    const { token } = req.params;

    try {
        const user = await UserModel.findUserByVerificationToken(token);
        if (!user) {
            return res.status(404).json({ message: 'Invalid verification token' });
        }

        await UserModel.setUserVerified(user.id);

        res.json({ message: 'Email verified successfully. You can now log in.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const forgotPassword = async (req: Request, res: Response) => {
    const { email } = req.body;

    try {
        const user = await UserModel.findUserByEmail(email);
        if (user) {
            const resetToken = uuidv4();
            const expires = new Date(Date.now() + 3600000); // 1 hour
            await UserModel.updatePasswordResetToken(user.id, resetToken, expires);

            // In a real app, you would send an email with the reset link
            console.log(`Password reset token for ${email}: ${resetToken}`);
        }

        res.json({ message: 'If a user with that email exists, a password reset link has been sent.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const resetPassword = async (req: Request, res: Response) => {
    const { token, new_password } = req.body;

    try {
        const user = await UserModel.findUserByPasswordResetToken(token);

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired password reset token.' });
        }

        const hashedPassword = await bcrypt.hash(new_password, 10);
        await UserModel.resetPassword(user.id, hashedPassword);

        res.json({ message: 'Password has been reset successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
