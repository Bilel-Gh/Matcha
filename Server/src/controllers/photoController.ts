import { Request, Response } from 'express';
import { PhotoService } from '../services/PhotoService';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../middlewares/errorHandler';

export const getPhotos = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError('User not authenticated', 401);
  }

  const photos = await PhotoService.getUserPhotos(req.user.id);

  res.status(200).json({
    status: 'success',
    data: photos,
  });
});

export const uploadPhoto = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError('User not authenticated', 401);
  }

  if (!req.file) {
    throw new AppError('No file uploaded', 400);
  }

  const result = await PhotoService.uploadPhoto(req.user.id, req.file);

  res.status(201).json({
    status: 'success',
    data: result,
  });
});

export const setProfilePhoto = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError('User not authenticated', 401);
  }

  const photoId = parseInt(req.params.id);
  if (isNaN(photoId)) {
    throw new AppError('Invalid photo ID', 400);
  }

  const photo = await PhotoService.setProfilePhoto(req.user.id, photoId);

  res.status(200).json({
    status: 'success',
    data: {
      photo,
      message: 'Profile photo updated successfully',
    },
  });
});

export const deletePhoto = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError('User not authenticated', 401);
  }

  const photoId = parseInt(req.params.id);
  if (isNaN(photoId)) {
    throw new AppError('Invalid photo ID', 400);
  }

  await PhotoService.deletePhoto(req.user.id, photoId);

  res.status(200).json({
    status: 'success',
    message: 'Photo deleted successfully',
  });
});
