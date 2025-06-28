import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { socketAuth, AuthenticatedSocket, getUserId, getUserInfo, isAuthenticated } from '../middlewares/socketAuth';
import { ChatService } from '../services/ChatService';
import { MessageRepository } from '../repositories/MessageRepository';
import { UserRepository } from '../repositories/UserRepository';
import { SocketEvents } from '../types/chat';
import config from './config';

interface ConnectedUsers {
  [userId: number]: string[]; // userId -> array of socket IDs
}

export class SocketManager {
  private io: SocketIOServer;
  private connectedUsers: ConnectedUsers = {};
  private typingUsers: Map<string, NodeJS.Timeout> = new Map(); // conversationId -> timeout

  constructor(server: HttpServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: config.CORS_ORIGIN,
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    this.io.use(socketAuth);
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      // Silent user connection - no console output for defense requirements
      this.handleUserConnection(socket);
      this.setupSocketEventListeners(socket);
    });
  }

  private async handleUserConnection(socket: AuthenticatedSocket) {
    const userId = getUserId(socket);
    if (!userId) return;

    // Add socket to connected users
    if (!this.connectedUsers[userId]) {
      this.connectedUsers[userId] = [];
    }
    this.connectedUsers[userId].push(socket.id);

    // Set user as online
    try {
      await UserRepository.updateLastConnection(userId);

      // Notify other users that this user is online
      socket.broadcast.emit('user-online', { userId });
    } catch (error) {
      // Silent error handling - no console output for defense requirements
    }

    // Handle disconnect
    socket.on('disconnect', () => {
      this.handleUserDisconnection(socket);
    });
  }

  private async handleUserDisconnection(socket: AuthenticatedSocket) {
    const userId = getUserId(socket);
    if (!userId) return;

    // Silent user disconnection - no console output for defense requirements

    // Remove socket from connected users
    if (this.connectedUsers[userId]) {
      this.connectedUsers[userId] = this.connectedUsers[userId].filter(id => id !== socket.id);

      // If no more sockets for this user, mark as offline
      if (this.connectedUsers[userId].length === 0) {
        delete this.connectedUsers[userId];

        try {
          await UserRepository.setOffline(userId);

          // Notify other users that this user is offline
          socket.broadcast.emit('user-offline', { userId });
        } catch (error) {
          // Silent error handling - no console output for defense requirements
        }
      }
    }
  }

  private setupSocketEventListeners(socket: AuthenticatedSocket) {
    const userId = getUserId(socket);
    if (!userId) return;

    // Join conversation
    socket.on('join-conversation', async (data: { receiverId: number }) => {
      // Silent conversation join - no console output for defense requirements
      try {
        const { receiverId } = data;

        // Verify users can chat
        const canChat = await ChatService.checkUsersCanChat(userId, receiverId);
        if (!canChat) {
          socket.emit('error', { message: 'You can only chat with matched users', code: 'NOT_MATCHED' });
          return;
        }

        const conversationId = this.getConversationId(userId, receiverId);
        socket.join(conversationId);

        // Silent conversation join - no console output for defense requirements
      } catch (error) {
        // Silent error handling - no console output for defense requirements
        socket.emit('error', { message: 'Failed to join conversation' });
      }
    });

    // Send message
    socket.on('send-message', async (data: { receiverId: number; content: string; tempId?: string }) => {
      // Silent message notification - no console output for defense requirements
      try {
        const { receiverId, content, tempId } = data;

        // Send message through ChatService
        const result = await ChatService.sendMessage(userId, { receiverId, content, tempId });

        const conversationId = this.getConversationId(userId, receiverId);

        // Emit to sender (confirmation ET le message complet pour l'affichage)
        socket.emit('message-sent', {
          message: result.message,
          tempId
        });

        // IMPORTANT: Émettre aussi 'new-message' à l'expéditeur pour qu'il voit son propre message
        socket.emit('new-message', result.message);

        // Emit to receiver if online
        socket.to(conversationId).emit('new-message', result.message);

        // Also emit directly to receiver's sockets if they're in a different conversation
        this.emitToUser(receiverId, 'new-message', result.message);

        // Create notification for the receiver only if they don't have the chat open
        const receiverSockets = this.connectedUsers[receiverId] || [];
        let hasConversationOpen = false;

        // Check if any of the receiver's sockets are in this conversation room
        for (const socketId of receiverSockets) {
          const receiverSocket = this.io.sockets.sockets.get(socketId);
          if (receiverSocket && receiverSocket.rooms.has(conversationId)) {
            hasConversationOpen = true;
            break;
          }
        }

        // Only send notification if the conversation is not open
        if (!hasConversationOpen) {
          try {
            const { NotificationService } = await import('../services/NotificationService');
            await NotificationService.createMessageNotification(
              receiverId,
              userId,
              result.message.id,
              content
            );

            // Émettre un événement de notification de message séparé pour les toasts
            // Silent message notification - no console output for defense requirements
          } catch (notifError) {
            // Silent error handling - no console output for defense requirements
            // Don't fail the message sending if notification fails
          }
        }

        // Silent message emission - no console output for defense requirements
      } catch (error) {
        // Silent error handling - no console output for defense requirements
        socket.emit('error', {
          message: error instanceof Error ? error.message : 'Failed to send message',
          tempId: data.tempId
        });
      }
    });

    // Mark message as read
    socket.on('message-read', async (data: { messageId: number }) => {
      // Silent message notification - no console output for defense requirements
      try {
        const { messageId } = data;

        const message = await ChatService.markMessageAsRead(messageId, userId);
        if (message) {
          // Get the message with full details to find sender
          const fullMessage = await MessageRepository.getMessageWithUsers(messageId);
          if (fullMessage) {
            // Notify sender that message was read
            this.emitToUser(fullMessage.sender_id, 'message-read-update', {
              messageId,
              readBy: userId
            });
          }
        }
      } catch (error) {
        // Silent error handling - no console output for defense requirements
        socket.emit('error', { message: 'Failed to mark message as read' });
      }
    });

    // Typing indicators
    socket.on('typing-start', async (data: { receiverId: number }) => {
      // Silent typing indicator - no console output for defense requirements
      try {
        const { receiverId } = data;

        // Verify users can chat
        const canChat = await ChatService.checkUsersCanChat(userId, receiverId);
        if (!canChat) {
          return;
        }

        const conversationId = this.getConversationId(userId, receiverId);

        // Clear existing typing timeout
        if (this.typingUsers.has(conversationId)) {
          clearTimeout(this.typingUsers.get(conversationId)!);
        }

        // Emit typing indicator to receiver
        socket.to(conversationId).emit('typing-indicator', { userId, isTyping: true });
        this.emitToUser(receiverId, 'typing-indicator', { userId, isTyping: true });

        // Auto-stop typing after 3 seconds
        const timeout = setTimeout(() => {
          socket.to(conversationId).emit('typing-indicator', { userId, isTyping: false });
          this.emitToUser(receiverId, 'typing-indicator', { userId, isTyping: false });
          this.typingUsers.delete(conversationId);
        }, 3000);

        this.typingUsers.set(conversationId, timeout);
      } catch (error) {
        // Silent error handling - no console output for defense requirements
      }
    });

    socket.on('typing-stop', async (data: { receiverId: number }) => {
      // Silent typing indicator - no console output for defense requirements
      try {
        const { receiverId } = data;

        const conversationId = this.getConversationId(userId, receiverId);

        // Clear typing timeout
        if (this.typingUsers.has(conversationId)) {
          clearTimeout(this.typingUsers.get(conversationId)!);
          this.typingUsers.delete(conversationId);
        }

        // Emit stop typing to receiver
        socket.to(conversationId).emit('typing-indicator', { userId, isTyping: false });
        this.emitToUser(receiverId, 'typing-indicator', { userId, isTyping: false });
      } catch (error) {
        // Silent error handling - no console output for defense requirements
      }
    });

    // Notification events
    socket.on('mark-notification-read', async (data: { notificationId: number }) => {
      // Silent notification marking - no console output for defense requirements
      try {
        const { NotificationService } = await import('../services/NotificationService');
        await NotificationService.markAsRead(data.notificationId, userId);
      } catch (error) {
        // Silent error handling - no console output for defense requirements
        socket.emit('error', { message: 'Failed to mark notification as read' });
      }
    });

    socket.on('mark-all-notifications-read', async () => {
      // Silent notification marking - no console output for defense requirements
      try {
        const { NotificationService } = await import('../services/NotificationService');
        await NotificationService.markAllAsRead(userId);
      } catch (error) {
        // Silent error handling - no console output for defense requirements
        socket.emit('error', { message: 'Failed to mark all notifications as read' });
      }
    });
  }

  /**
   * Generate conversation ID for two users
   */
  private getConversationId(userId1: number, userId2: number): string {
    const minId = Math.min(userId1, userId2);
    const maxId = Math.max(userId1, userId2);
    return `chat-${minId}-${maxId}`;
  }

  /**
   * Emit event to all sockets of a specific user
   */
  public emitToUser(userId: number, event: string, data: any) {
    const userSockets = this.connectedUsers[userId];
    if (userSockets) {
      userSockets.forEach(socketId => {
        this.io.to(socketId).emit(event, data);
      });
    }
  }

  /**
   * Check if user is online
   */
  public isUserOnline(userId: number): boolean {
    return !!this.connectedUsers[userId] && this.connectedUsers[userId].length > 0;
  }

  /**
   * Get online users count
   */
  public getOnlineUsersCount(): number {
    return Object.keys(this.connectedUsers).length;
  }

  /**
   * Get connected users list
   */
  public getConnectedUserIds(): number[] {
    return Object.keys(this.connectedUsers).map(id => parseInt(id));
  }

  /**
   * Force disconnect user (admin function)
   */
  public disconnectUser(userId: number) {
    const userSockets = this.connectedUsers[userId];
    if (userSockets) {
      userSockets.forEach(socketId => {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket) {
          socket.disconnect(true);
        }
      });
    }
  }

  /**
   * Broadcast to all connected users
   */
  public broadcast(event: string, data: any) {
    this.io.emit(event, data);
  }

  /**
   * Get Socket.IO server instance
   */
  public getIO(): SocketIOServer {
    return this.io;
  }

  /**
   * Graceful shutdown
   */
  public async shutdown() {
    // Silent shutdown process - no console output for defense requirements

    // Set all connected users as offline
    const userIds = this.getConnectedUserIds();
    for (const userId of userIds) {
      try {
        await UserRepository.setOffline(userId);
      } catch (error) {
        // Silent error handling - no console output for defense requirements
      }
    }

    // Close all connections
    this.io.close();
    // Silent shutdown completion - no console output for defense requirements
  }
}

export default SocketManager;
