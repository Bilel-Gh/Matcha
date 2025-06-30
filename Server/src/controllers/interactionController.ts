import { Request, Response } from 'express';
import { LikeService } from '../services/LikeService';
import { VisitService } from '../services/VisitService';
import { BlockService } from '../services/BlockService';
import { ReportService } from '../services/ReportService';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../middlewares/errorHandler';

// ===== LIKES ENDPOINTS =====

export const likeUser = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError('User not authenticated', 401);
  }

  const likedId = parseInt(req.params.userId);
  if (isNaN(likedId)) {
    throw new AppError('Invalid user ID', 400);
  }

  const result = await LikeService.addLike(req.user.id, likedId);

  res.status(201).json({
    status: 'success',
    data: result,
  });
});

export const unlikeUser = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError('User not authenticated', 401);
  }

  const likedId = parseInt(req.params.userId);
  if (isNaN(likedId)) {
    throw new AppError('Invalid user ID', 400);
  }

  await LikeService.removeLike(req.user.id, likedId);

  res.status(200).json({
    status: 'success',
    message: 'Like removed successfully',
  });
});

export const getLikesReceived = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError('User not authenticated', 401);
  }

  const likes = await LikeService.getLikesReceived(req.user.id);

  res.status(200).json({
    status: 'success',
    data: {
      likes,
      count: likes.length,
    },
  });
});

export const getLikesGiven = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError('User not authenticated', 401);
  }

  const likes = await LikeService.getLikesGiven(req.user.id);

  res.status(200).json({
    status: 'success',
    data: {
      likes,
      count: likes.length,
    },
  });
});

export const getMatches = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError('User not authenticated', 401);
  }

  const matches = await LikeService.getMatches(req.user.id);

  res.status(200).json({
    status: 'success',
    data: {
      matches,
      count: matches.length,
    },
  });
});

export const getLikeStatus = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError('User not authenticated', 401);
  }

  const otherUserId = parseInt(req.params.userId);
  if (isNaN(otherUserId)) {
    throw new AppError('Invalid user ID', 400);
  }

  const status = await LikeService.getLikeStatus(req.user.id, otherUserId);

  res.status(200).json({
    status: 'success',
    data: status,
  });
});

// ===== VISITS ENDPOINTS =====

export const recordVisit = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError('User not authenticated', 401);
  }

  const visitedId = parseInt(req.params.userId);
  if (isNaN(visitedId)) {
    throw new AppError('Invalid user ID', 400);
  }

  const visit = await VisitService.recordVisit(req.user.id, visitedId);

  res.status(201).json({
    status: 'success',
    data: visit,
  });
});

export const getVisitsReceived = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError('User not authenticated', 401);
  }

  const visits = await VisitService.getVisitsReceived(req.user.id);

  res.status(200).json({
    status: 'success',
    data: {
      visits,
      count: visits.length,
    },
  });
});

export const getVisitsGiven = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError('User not authenticated', 401);
  }

  const visits = await VisitService.getVisitsGiven(req.user.id);

  res.status(200).json({
    status: 'success',
    data: {
      visits,
      count: visits.length,
    },
  });
});

// ===== BLOCKS ENDPOINTS =====

export const blockUser = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError('User not authenticated', 401);
  }

  const blockedId = parseInt(req.params.userId);
  if (isNaN(blockedId)) {
    throw new AppError('Invalid user ID', 400);
  }

  const { reason } = req.body;
  const block = await BlockService.blockUser(req.user.id, blockedId, reason);

  res.status(201).json({
    status: 'success',
    data: block,
    message: 'User blocked successfully',
  });
});

export const unblockUser = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError('User not authenticated', 401);
  }

  const blockedId = parseInt(req.params.userId);
  if (isNaN(blockedId)) {
    throw new AppError('Invalid user ID', 400);
  }

  await BlockService.unblockUser(req.user.id, blockedId);

  res.status(200).json({
    status: 'success',
    message: 'User unblocked successfully',
  });
});

export const getBlockedUsers = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError('User not authenticated', 401);
  }

  const blockedUsers = await BlockService.getBlockedUsers(req.user.id);

  res.status(200).json({
    status: 'success',
    data: {
      blocked_users: blockedUsers,
      count: blockedUsers.length,
    },
  });
});

export const getBlockStatus = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError('User not authenticated', 401);
  }

  const otherUserId = parseInt(req.params.userId);
  if (isNaN(otherUserId)) {
    throw new AppError('Invalid user ID', 400);
  }

  const status = await BlockService.getBlockStatus(req.user.id, otherUserId);

  res.status(200).json({
    status: 'success',
    data: status,
  });
});

// ===== REPORTS ENDPOINTS =====

export const reportUser = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError('User not authenticated', 401);
  }

  const reportedId = parseInt(req.params.userId);
  if (isNaN(reportedId)) {
    throw new AppError('Invalid user ID', 400);
  }

  const { reason } = req.body;
  if (!reason) {
    throw new AppError('Report reason is required', 400);
  }

  // Validate reason if needed
  if (!ReportService.validateReportReason(reason) && reason !== 'Other') {
    const validReasons = ReportService.getReportReasons();
    throw new AppError(`Invalid reason. Valid reasons: ${validReasons.join(', ')}`, 400);
  }

  const report = await ReportService.reportUser(req.user.id, reportedId, reason);

  res.status(201).json({
    status: 'success',
    data: report,
    message: 'User reported successfully',
  });
});

export const getMyReports = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError('User not authenticated', 401);
  }

  const reports = await ReportService.getMyReports(req.user.id);

  res.status(200).json({
    status: 'success',
    data: {
      reports,
      count: reports.length,
    },
  });
});

export const getReportReasons = asyncHandler(async (req: Request, res: Response) => {
  const reasons = ReportService.getReportReasons();

  res.status(200).json({
    status: 'success',
    data: {
      reasons,
    },
  });
});

// ===== COMBINED STATUS ENDPOINT =====

export const getInteractionStatus = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError('User not authenticated', 401);
  }

  const otherUserId = parseInt(req.params.userId);
  if (isNaN(otherUserId)) {
    throw new AppError('Invalid user ID', 400);
  }

  // Get all interaction statuses in parallel
  const [likeStatus, blockStatus, hasReported] = await Promise.all([
    LikeService.getLikeStatus(req.user.id, otherUserId),
    BlockService.getBlockStatus(req.user.id, otherUserId),
    ReportService.hasReported(req.user.id, otherUserId),
  ]);

  res.status(200).json({
    success: true,
    data: {
      like_status: likeStatus,
      block_status: blockStatus,
      has_reported: hasReported,
    },
    message: 'Interaction status retrieved successfully'
  });
});

// ===== INTERACTION SUMMARY =====

export const getInteractionSummary = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError('User not authenticated', 401);
  }

  // Get counts for dashboard/summary
  const [
    likesReceived,
    likesGiven,
    matches,
    visitsReceived,
    visitsGiven,
    blockedUsers,
    myReports
  ] = await Promise.all([
    LikeService.getLikesReceived(req.user.id),
    LikeService.getLikesGiven(req.user.id),
    LikeService.getMatches(req.user.id),
    VisitService.getVisitsReceived(req.user.id),
    VisitService.getVisitsGiven(req.user.id),
    BlockService.getBlockedUsers(req.user.id),
    ReportService.getMyReports(req.user.id),
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      summary: {
        likes_received: likesReceived.length,
        likes_given: likesGiven.length,
        matches: matches.length,
        visits_received: visitsReceived.length,
        visits_given: visitsGiven.length,
        blocked_users: blockedUsers.length,
        reports_made: myReports.length,
      },
      recent_activity: {
        recent_likes: likesReceived.slice(0, 5),
        recent_visits: visitsReceived.slice(0, 5),
        latest_matches: matches.slice(0, 3),
      },
    },
  });
});
