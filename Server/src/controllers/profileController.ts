import { Request, Response } from 'express';
import { ProfileService } from '../services/ProfileService';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../middlewares/errorHandler';

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError('User not authenticated', 401);
  }

  const profile = await ProfileService.getProfile(req.user.id);

  res.status(200).json({
    status: 'success',
    data: profile,
  });
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError('User not authenticated', 401);
  }

  const updatedProfile = await ProfileService.updateProfile(req.user.id, req.body);

  res.status(200).json({
    status: 'success',
    data: updatedProfile,
  });
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError('User not authenticated', 401);
  }

  const { current_password, new_password } = req.body;

  await ProfileService.changePassword(req.user.id, current_password, new_password);

  res.status(200).json({
    status: 'success',
    message: 'Password updated successfully',
  });
});

export const getUserProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError('User not authenticated', 401);
  }

  const { userId } = req.params;
  const targetUserId = parseInt(userId);

  if (isNaN(targetUserId)) {
    throw new AppError('Invalid user ID', 400);
  }

  // Prevent users from viewing their own profile through this endpoint
  if (targetUserId === req.user.id) {
    throw new AppError('Use /profile endpoint for your own profile', 400);
  }

  const userProfile = await ProfileService.getUserProfile(req.user.id, targetUserId);

  res.status(200).json({
    status: 'success',
    data: userProfile,
  });
});
