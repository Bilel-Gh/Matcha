export interface Notification {
  id: number;
  user_id: number;
  type: 'like' | 'match' | 'visit' | 'message';
  content: string;
  is_read: boolean;
  created_at: Date;
  data?: {
    from_user?: {
      id: number;
      username: string;
      firstname: string;
      lastname: string;
      profile_picture_url?: string;
    };
    match_user?: {
      id: number;
      username: string;
      firstname: string;
      lastname: string;
      profile_picture_url?: string;
    };
    visitor?: {
      id: number;
      username: string;
      firstname: string;
      lastname: string;
      profile_picture_url?: string;
    };
    message_id?: number;
    conversation_id?: string;
  };
}

export interface NotificationSummary {
  notifications: Notification[];
  total: number;
  unread_count: number;
}

export interface CreateNotificationRequest {
  user_id: number;
  type: 'like' | 'match' | 'visit' | 'message';
  content: string;
  data?: any;
}

export interface NotificationSocketEvents {
  // Server to Client
  'new-notification': Notification;
  'notification-read': { notificationId: number };
  'unread-count-update': { count: number };

  // Client to Server
  'mark-notification-read': { notificationId: number };
  'mark-all-notifications-read': {};
}

export interface NotificationPreferences {
  likes: boolean;
  matches: boolean;
  visits: boolean;
  messages: boolean;
  sounds: boolean;
}
