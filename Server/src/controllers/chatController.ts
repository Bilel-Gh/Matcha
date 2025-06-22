import { Request, Response } from 'express';
import { ChatService } from '../services/ChatService';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../middlewares/errorHandler';

/**
 * Get all conversations for the authenticated user
 */
export const getConversations = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError('User not authenticated', 401);
  }

  const conversations = await ChatService.getConversations(req.user.id);

  res.status(200).json({
    status: 'success',
    data: conversations,
  });
});

/**
 * Get messages with a specific user
 */
export const getMessages = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError('User not authenticated', 401);
  }

  const otherUserId = parseInt(req.params.userId);
  if (isNaN(otherUserId)) {
    throw new AppError('Invalid user ID', 400);
  }

  // Parse pagination parameters
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = parseInt(req.query.offset as string) || 0;

  if (limit > 100) {
    throw new AppError('Limit cannot exceed 100 messages', 400);
  }

  if (limit < 1 || offset < 0) {
    throw new AppError('Invalid pagination parameters', 400);
  }

  const result = await ChatService.getMessages(req.user.id, otherUserId, limit, offset);

  res.status(200).json({
    status: 'success',
    data: result,
  });
});

/**
 * Send a message to another user
 */
export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError('User not authenticated', 401);
  }

  const { receiverId, content, tempId } = req.body;

  if (!receiverId || !content) {
    throw new AppError('Receiver ID and message content are required', 400);
  }

  if (typeof receiverId !== 'number' || receiverId === req.user.id) {
    throw new AppError('Invalid receiver ID', 400);
  }

  const result = await ChatService.sendMessage(req.user.id, {
    receiverId,
    content,
    tempId
  });

  res.status(201).json({
    status: 'success',
    data: result,
  });
});

/**
 * Mark a specific message as read
 */
export const markMessageAsRead = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError('User not authenticated', 401);
  }

  const messageId = parseInt(req.params.messageId);
  if (isNaN(messageId)) {
    throw new AppError('Invalid message ID', 400);
  }

  const message = await ChatService.markMessageAsRead(messageId, req.user.id);

  res.status(200).json({
    status: 'success',
    data: {
      message,
    },
    message: 'Message marked as read',
  });
});

/**
 * Mark all messages from a specific user as read
 */
export const markAllMessagesAsRead = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError('User not authenticated', 401);
  }

  const senderId = parseInt(req.params.senderId);
  if (isNaN(senderId)) {
    throw new AppError('Invalid sender ID', 400);
  }

  const markedCount = await ChatService.markAllMessagesAsRead(req.user.id, senderId);

  res.status(200).json({
    status: 'success',
    data: {
      marked_count: markedCount,
    },
    message: `${markedCount} messages marked as read`,
  });
});

/**
 * Get unread message count for the authenticated user
 */
export const getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError('User not authenticated', 401);
  }

  const unreadCount = await ChatService.getUnreadCount(req.user.id);

  res.status(200).json({
    status: 'success',
    data: unreadCount,
  });
});

/**
 * Get conversation partner information
 */
export const getConversationPartner = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError('User not authenticated', 401);
  }

  const partnerId = parseInt(req.params.partnerId);
  if (isNaN(partnerId)) {
    throw new AppError('Invalid partner ID', 400);
  }

  const partner = await ChatService.getConversationPartner(req.user.id, partnerId);

  res.status(200).json({
    status: 'success',
    data: partner,
  });
});

/**
 * Search conversations by user name
 */
export const searchConversations = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError('User not authenticated', 401);
  }

  const query = req.query.q as string;
  if (!query || query.trim().length < 2) {
    throw new AppError('Search query must be at least 2 characters long', 400);
  }

  const conversations = await ChatService.searchConversations(req.user.id, query);

  res.status(200).json({
    status: 'success',
    data: {
      conversations,
      query: query.trim(),
    },
  });
});

/**
 * Get conversation statistics
 */
export const getConversationStats = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError('User not authenticated', 401);
  }

  const partnerId = parseInt(req.params.partnerId);
  if (isNaN(partnerId)) {
    throw new AppError('Invalid partner ID', 400);
  }

  const stats = await ChatService.getConversationStats(req.user.id, partnerId);

  res.status(200).json({
    status: 'success',
    data: stats,
  });
});

/**
 * Check if current user can chat with another user
 */
export const checkChatPermission = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError('User not authenticated', 401);
  }

  const otherUserId = parseInt(req.params.userId);
  if (isNaN(otherUserId)) {
    throw new AppError('Invalid user ID', 400);
  }

  const canChat = await ChatService.checkUsersCanChat(req.user.id, otherUserId);

  res.status(200).json({
    status: 'success',
    data: {
      can_chat: canChat,
      user_id: otherUserId,
    },
  });
});
