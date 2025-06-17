import { Request, Response } from 'express';
import { FameRatingService } from '../services/FameRatingService';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../middlewares/errorHandler';

export const updateFameRating = asyncHandler(async (req: Request, res: Response) => {
  const userId = parseInt(req.params.userId);

  if (isNaN(userId)) {
    throw new AppError('Invalid user ID', 400);
  }

  const result = await FameRatingService.updateUserFameRating(userId);

  res.status(200).json({
    status: 'success',
    data: result,
    message: 'Fame rating updated successfully',
  });
});
