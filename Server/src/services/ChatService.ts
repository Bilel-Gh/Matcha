import { MessageRepository } from '../repositories/MessageRepository';
import { LikeService } from './LikeService';
import { FameRatingService } from './FameRatingService';
import { UserRepository } from '../repositories/UserRepository';
import { AppError } from '../utils/AppError';
import {
  Message,
  ChatMessage,
  Conversation,
  ConversationSummary,
  MessagesResponse,
  UnreadCountResponse,
  SendMessageRequest,
  SendMessageResponse
} from '../types/chat';

export class ChatService {
  private static readonly MAX_MESSAGE_LENGTH = 1000;
  private static readonly MIN_MESSAGE_LENGTH = 1;
  private static readonly DEFAULT_MESSAGES_LIMIT = 50;

  /**
   * Send a message between matched users
   */
  static async sendMessage(
    senderId: number,
    request: SendMessageRequest
  ): Promise<SendMessageResponse> {
    const { receiverId, content, tempId } = request;

    // Validate message content
    this.validateMessageContent(content);

    // Check if users are matched (can chat)
    const canChat = await this.checkUsersCanChat(senderId, receiverId);
    if (!canChat) {
      throw new AppError('You can only message users you have matched with', 403);
    }

    // Check if users are blocked
    const areBlocked = await UserRepository.isBlocked(senderId, receiverId);
    if (areBlocked) {
      throw new AppError('Cannot send message to this user', 403);
    }

    // Create the message
    const message = await MessageRepository.createMessage(senderId, receiverId, content.trim());

    // Get full message with user details
    const chatMessage = await MessageRepository.getMessageWithUsers(message.id);
    if (!chatMessage) {
      throw new AppError('Failed to retrieve sent message', 500);
    }

    // Update fame rating for both users (messaging activity)
    try {
      await Promise.all([
        FameRatingService.updateUserFameRating(senderId),
        FameRatingService.updateUserFameRating(receiverId)
      ]);
    } catch (error) {
      // Log error but don't fail the message sending
      console.error('Failed to update fame ratings after message:', error);
    }

    return {
      success: true,
      message: chatMessage,
      tempId
    };
  }

  /**
   * Get messages between two users
   */
  static async getMessages(
    userId: number,
    otherUserId: number,
    limit: number = this.DEFAULT_MESSAGES_LIMIT,
    offset: number = 0
  ): Promise<MessagesResponse> {
    // Check if users can chat
    const canChat = await this.checkUsersCanChat(userId, otherUserId);
    if (!canChat) {
      throw new AppError('You can only view messages with users you have matched with', 403);
    }

    // Check if users are blocked
    const areBlocked = await UserRepository.isBlocked(userId, otherUserId);
    if (areBlocked) {
      throw new AppError('Cannot view messages with this user', 403);
    }

    const result = await MessageRepository.getMessages(userId, otherUserId, limit, offset);

    return {
      messages: result.messages,
      total: result.total,
      has_more: result.has_more
    };
  }

  /**
   * Get all conversations for a user
   */
  static async getConversations(userId: number): Promise<ConversationSummary> {
    const conversations = await MessageRepository.getConversations(userId);

    // Filter conversations to only include matched users
    const validConversations: Conversation[] = [];

    for (const conversation of conversations) {
      const canChat = await this.checkUsersCanChat(userId, conversation.user.id);
      if (canChat) {
        validConversations.push(conversation);
      }
    }

    const totalUnread = validConversations.reduce(
      (sum, conv) => sum + conv.unread_count,
      0
    );

    return {
      conversations: validConversations,
      total_conversations: validConversations.length,
      total_unread: totalUnread
    };
  }

  /**
   * Mark a message as read
   */
  static async markMessageAsRead(messageId: number, userId: number): Promise<Message | null> {
    // Verify the message exists and user is the receiver
    const message = await MessageRepository.findMessageById(messageId, userId);
    if (!message) {
      throw new AppError('Message not found', 404);
    }

    if (message.receiver_id !== userId) {
      throw new AppError('You can only mark your own received messages as read', 403);
    }

    if (message.is_read) {
      return message; // Already read
    }

    return await MessageRepository.markAsRead(messageId, userId);
  }

  /**
   * Mark all messages from a sender as read
   */
  static async markAllMessagesAsRead(receiverId: number, senderId: number): Promise<number> {
    // Check if users can chat
    const canChat = await this.checkUsersCanChat(receiverId, senderId);
    if (!canChat) {
      throw new AppError('Cannot mark messages as read for non-matched users', 403);
    }

    return await MessageRepository.markAllAsRead(receiverId, senderId);
  }

  /**
   * Get unread message count for a user
   */
  static async getUnreadCount(userId: number): Promise<UnreadCountResponse> {
    const totalUnread = await MessageRepository.getUnreadCount(userId);
    const unreadBySender = await MessageRepository.getUnreadCountBySender(userId);

    // Filter to only count unread messages from matched users
    let validUnreadCount = 0;
    let conversationsWithUnread = 0;

    for (const { sender_id, count } of unreadBySender) {
      const canChat = await this.checkUsersCanChat(userId, sender_id);
      if (canChat) {
        validUnreadCount += count;
        conversationsWithUnread++;
      }
    }

    return {
      total_unread: validUnreadCount,
      conversations_with_unread: conversationsWithUnread
    };
  }

  /**
   * Check if two users can chat (are matched)
   */
  static async checkUsersCanChat(userId1: number, userId2: number): Promise<boolean> {
    if (userId1 === userId2) {
      return false; // Cannot chat with yourself
    }

    // Check if users are matched (both liked each other)
    const likeStatus = await LikeService.getLikeStatus(userId1, userId2);
    return likeStatus.is_match;
  }

  /**
   * Validate message content
   */
  private static validateMessageContent(content: string): void {
    if (!content || typeof content !== 'string') {
      throw new AppError('Message content is required', 400);
    }

    const trimmedContent = content.trim();

    if (trimmedContent.length < this.MIN_MESSAGE_LENGTH) {
      throw new AppError('Message cannot be empty', 400);
    }

    if (trimmedContent.length > this.MAX_MESSAGE_LENGTH) {
      throw new AppError(`Message cannot exceed ${this.MAX_MESSAGE_LENGTH} characters`, 400);
    }

    // Basic content validation (you can extend this)
    if (this.containsInappropriateContent(trimmedContent)) {
      throw new AppError('Message contains inappropriate content', 400);
    }
  }

  /**
   * Basic inappropriate content detection (extend as needed)
   */
  private static containsInappropriateContent(content: string): boolean {
    // This is a basic implementation - you might want to use a more sophisticated
    // content moderation service in production
    const inappropriatePatterns = [
      // Add patterns for spam, inappropriate content, etc.
      /^(.)\1{20,}$/, // Repeated characters (spam)
      /^\s*$/, // Only whitespace
    ];

    return inappropriatePatterns.some(pattern => pattern.test(content));
  }

  /**
   * Get conversation partner info
   */
  static async getConversationPartner(userId: number, partnerId: number): Promise<any> {
    // Check if users can chat
    const canChat = await this.checkUsersCanChat(userId, partnerId);
    if (!canChat) {
      throw new AppError('Cannot access conversation with this user', 403);
    }

    const partner = await UserRepository.findById(partnerId);
    if (!partner) {
      throw new AppError('User not found', 404);
    }

    // Return public user info
    return {
      id: partner.id,
      username: partner.username,
      firstname: partner.firstname,
      lastname: partner.lastname,
      profile_picture_url: partner.profile_picture_url,
      is_online: partner.is_online,
      last_connection: partner.last_connection
    };
  }

  /**
   * Search conversations by user name
   */
  static async searchConversations(userId: number, searchQuery: string): Promise<Conversation[]> {
    const conversations = await this.getConversations(userId);

    if (!searchQuery || searchQuery.trim().length < 2) {
      return conversations.conversations;
    }

    const query = searchQuery.toLowerCase().trim();

    return conversations.conversations.filter(conversation => {
      const user = conversation.user;
      return (
        user.firstname.toLowerCase().includes(query) ||
        user.lastname.toLowerCase().includes(query) ||
        user.username.toLowerCase().includes(query) ||
        `${user.firstname} ${user.lastname}`.toLowerCase().includes(query)
      );
    });
  }

  /**
   * Get conversation statistics
   */
  static async getConversationStats(userId: number, partnerId: number): Promise<{
    total_messages: number;
    messages_sent: number;
    messages_received: number;
    first_message_date?: Date;
    last_message_date?: Date;
  }> {
    const canChat = await this.checkUsersCanChat(userId, partnerId);
    if (!canChat) {
      throw new AppError('Cannot access conversation statistics with this user', 403);
    }

    // This would require additional repository methods - basic implementation
    const result = await MessageRepository.getMessages(userId, partnerId, 1000, 0);
    const messages = result.messages;

    const messagesSent = messages.filter(m => m.sender_id === userId).length;
    const messagesReceived = messages.filter(m => m.receiver_id === userId).length;

    return {
      total_messages: messages.length,
      messages_sent: messagesSent,
      messages_received: messagesReceived,
      first_message_date: messages.length > 0 ? messages[0].sent_at : undefined,
      last_message_date: messages.length > 0 ? messages[messages.length - 1].sent_at : undefined
    };
  }
}
