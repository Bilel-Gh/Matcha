export interface NotificationUser {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  profile_picture_url?: string;
}

export interface Notification {
  id: number;
  user_id: number;
  type: 'like' | 'match' | 'visit' | 'message';
  content: string;
  is_read: boolean;
  created_at: string;
  data?: {
    from_user?: NotificationUser;
    match_user?: NotificationUser;
    visitor?: NotificationUser;
    message_id?: number;
    conversation_id?: string;
  };
}

export interface NotificationSummary {
  notifications: Notification[];
  total: number;
  unread_count: number;
}

export interface NotificationSocketEvents {
  'new-like': (data: { fromUser: NotificationUser; timestamp: string }) => void;
  'new-match': (data: { matchedUser: NotificationUser; timestamp: string }) => void;
  'profile-visit': (data: { visitor: NotificationUser; timestamp: string }) => void;
  'notification-read': (data: { notificationId: number; unreadCount: number }) => void;
  'unread-count-update': (data: { unreadCount: number }) => void;
}
