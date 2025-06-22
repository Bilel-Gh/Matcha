export interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  is_read: boolean;
  sent_at: Date;
}

export interface PublicUser {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  profile_picture_url?: string;
  is_online: boolean;
  last_connection?: Date;
}

export interface Conversation {
  user: PublicUser;
  last_message: Message | null;
  unread_count: number;
}

export interface ChatMessage extends Message {
  sender: PublicUser;
  receiver: PublicUser;
}

export interface ConversationSummary {
  conversations: Conversation[];
  total_conversations: number;
  total_unread: number;
}

// Socket.IO Event Types
export interface SocketEvents {
  // Client to Server
  'join-conversation': { receiverId: number };
  'send-message': { receiverId: number; content: string };
  'message-read': { messageId: number };
  'typing-start': { receiverId: number };
  'typing-stop': { receiverId: number };

  // Server to Client
  'new-message': ChatMessage;
  'message-sent': { message: ChatMessage; tempId?: string };
  'message-read-update': { messageId: number; readBy: number };
  'user-online': { userId: number };
  'user-offline': { userId: number };
  'typing-indicator': { userId: number; isTyping: boolean };
  'error': { message: string; code?: string };
}

export interface SocketUser {
  id: number;
  username: string;
  socketId: string;
}

export interface SendMessageRequest {
  receiverId: number;
  content: string;
  tempId?: string; // For client-side optimistic updates
}

export interface SendMessageResponse {
  success: boolean;
  message: ChatMessage;
  tempId?: string;
}

export interface MessagesResponse {
  messages: ChatMessage[];
  total: number;
  has_more: boolean;
}

export interface UnreadCountResponse {
  total_unread: number;
  conversations_with_unread: number;
}
