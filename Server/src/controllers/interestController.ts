import { Request, Response } from 'express';
import { InterestService } from '../services/InterestService';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../middlewares/errorHandler';

// ===== GENERAL INTERESTS ENDPOINTS =====

export const getAllInterests = asyncHandler(async (req: Request, res: Response) => {
  const result = await InterestService.getAllInterests();

  res.status(200).json({
    status: 'success',
    data: result,
  });
});

export const searchInterests = asyncHandler(async (req: Request, res: Response) => {
  const { q } = req.query;

  if (!q || typeof q !== 'string') {
    throw new AppError('Search query (q) is required', 400);
  }

  const result = await InterestService.searchInterests(q);

  res.status(200).json({
    status: 'success',
    data: result,
  });
});

export const createInterest = asyncHandler(async (req: Request, res: Response) => {
  const { name, tag } = req.body;

  if (!name || typeof name !== 'string') {
    throw new AppError('Interest name is required', 400);
  }

  const interest = await InterestService.createInterest({ name, tag });

  res.status(201).json({
    status: 'success',
    data: {
      interest,
    },
  });
});

// ===== USER INTERESTS ENDPOINTS =====

export const getUserInterests = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError('User not authenticated', 401);
  }

  const result = await InterestService.getUserInterests(req.user.id);

  res.status(200).json({
    status: 'success',
    data: result,
  });
});

export const addUserInterest = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError('User not authenticated', 401);
  }

  const interestId = parseInt(req.params.id);
  if (isNaN(interestId)) {
    throw new AppError('Invalid interest ID', 400);
  }

  const interest = await InterestService.addUserInterest(req.user.id, interestId);

  res.status(201).json({
    status: 'success',
    data: {
      interest,
      message: 'Interest added successfully',
    },
  });
});

export const removeUserInterest = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError('User not authenticated', 401);
  }

  const interestId = parseInt(req.params.id);
  if (isNaN(interestId)) {
    throw new AppError('Invalid interest ID', 400);
  }

  await InterestService.removeUserInterest(req.user.id, interestId);

  res.status(200).json({
    status: 'success',
    message: 'Interest removed successfully',
  });
});

export const updateUserInterests = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError('User not authenticated', 401);
  }

  const { interest_ids } = req.body;

  if (!interest_ids) {
    throw new AppError('interest_ids array is required', 400);
  }

  const result = await InterestService.updateUserInterests(req.user.id, { interest_ids });

  res.status(200).json({
    status: 'success',
    data: result,
    message: 'User interests updated successfully',
  });
});

export const addUserInterestByName = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError('User not authenticated', 401);
  }

  const { name } = req.body;

  if (!name || typeof name !== 'string') {
    throw new AppError('Interest name is required', 400);
  }

  const interest = await InterestService.addUserInterestByName(req.user.id, name);

  res.status(201).json({
    status: 'success',
    data: {
      interest,
      message: 'Interest added successfully',
    },
  });
});
