export type AppNotificationTargetScreen = 'History';

export type AppNotificationItem = {
  body: string;
  id: string;
  presented: boolean;
  receivedAt: string;
  title: string;
  unread: boolean;
  targetScreen: AppNotificationTargetScreen;
};

export type NotificationCenterState = {
  items: AppNotificationItem[];
  unreadCount: number;
};
