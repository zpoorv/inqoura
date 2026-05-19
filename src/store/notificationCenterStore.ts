import type { NotificationCenterState } from '../models/appNotification';

const EMPTY_STATE: NotificationCenterState = {
  items: [],
  unreadCount: 0,
};

let notificationCenterState = EMPTY_STATE;
const listeners = new Set<(state: NotificationCenterState) => void>();

function computeUnreadCount(state: NotificationCenterState) {
  return state.items.filter((item) => item.presented && item.unread).length;
}

export function getNotificationCenterState() {
  return notificationCenterState;
}

export function setNotificationCenterState(nextState: NotificationCenterState) {
  notificationCenterState = {
    ...nextState,
    unreadCount: computeUnreadCount(nextState),
  };

  listeners.forEach((listener) => listener(notificationCenterState));
}

export function subscribeNotificationCenter(
  listener: (state: NotificationCenterState) => void
) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
