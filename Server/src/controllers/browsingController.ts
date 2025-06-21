import { Request, Response } from 'express';
import { BrowsingService, BrowseFilters } from '../services/BrowsingService';
import { VisitService } from '../services/VisitService';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../middlewares/errorHandler';

export const browseUsers = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError('User not authenticated', 401);
  }

  // Parse filters from query parameters
  const filters: BrowseFilters = {};

  if (req.query.age_min) {
    filters.age_min = parseInt(req.query.age_min as string);
  }
  if (req.query.age_max) {
    filters.age_max = parseInt(req.query.age_max as string);
  }
  if (req.query.max_distance) {
    filters.max_distance = parseInt(req.query.max_distance as string);
  }
  if (req.query.fame_min) {
    filters.fame_min = parseInt(req.query.fame_min as string);
  }
  if (req.query.fame_max) {
    filters.fame_max = parseInt(req.query.fame_max as string);
  }
  if (req.query.min_common_interests) {
    filters.min_common_interests = parseInt(req.query.min_common_interests as string);
  }
  if (req.query.location) {
    filters.location = req.query.location as string;
  }

  const sortBy = (req.query.sort as string) || 'distance';

  // Validate sort parameter
  const validSortOptions = ['distance', 'age', 'fame_rating', 'common_interests'];
  if (!validSortOptions.includes(sortBy)) {
    throw new AppError('Invalid sort parameter. Valid options: distance, age, fame_rating, common_interests', 400);
  }

  const result = await BrowsingService.getBrowseResults(req.user.id, filters, sortBy);

  res.status(200).json({
    status: 'success',
    data: result,
  });
});

export const searchUsers = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError('User not authenticated', 401);
  }

  // Parse filters from query parameters (same as browse)
  const filters: BrowseFilters = {};

  if (req.query.age_min) {
    filters.age_min = parseInt(req.query.age_min as string);
  }
  if (req.query.age_max) {
    filters.age_max = parseInt(req.query.age_max as string);
  }
  if (req.query.max_distance) {
    filters.max_distance = parseInt(req.query.max_distance as string);
  }
  if (req.query.fame_min) {
    filters.fame_min = parseInt(req.query.fame_min as string);
  }
  if (req.query.fame_max) {
    filters.fame_max = parseInt(req.query.fame_max as string);
  }
  if (req.query.min_common_interests) {
    filters.min_common_interests = parseInt(req.query.min_common_interests as string);
  }
  if (req.query.location) {
    filters.location = req.query.location as string;
  }

  const sortBy = (req.query.sort as string) || 'distance';

  // Validate sort parameter
  const validSortOptions = ['distance', 'age', 'fame_rating', 'common_interests'];
  if (!validSortOptions.includes(sortBy)) {
    throw new AppError('Invalid sort parameter. Valid options: distance, age, fame_rating, common_interests', 400);
  }

  const result = await BrowsingService.getSearchResults(req.user.id, filters, sortBy);

  res.status(200).json({
    status: 'success',
    data: result,
  });
});

export const getUserProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError('User not authenticated', 401);
  }

  const profileId = parseInt(req.params.id);
  if (isNaN(profileId)) {
    throw new AppError('Invalid user ID', 400);
  }

  const profile = await BrowsingService.getUserProfile(req.user.id, profileId);

  if (!profile) {
    throw new AppError('User not found', 404);
  }

  // Auto-record visit (but don't let errors block the response)
  try {
    if (req.user.id !== profileId) {
      const hasRecentlyVisited = await VisitService.hasRecentlyVisited(req.user.id, profileId);
      if (!hasRecentlyVisited) {
        await VisitService.recordVisit(req.user.id, profileId);
      }
    }
  } catch (error) {
    // Log error but don't fail the request
    console.error('Failed to record visit:', error);
  }

  res.status(200).json({
    status: 'success',
    data: profile,
  });
});
