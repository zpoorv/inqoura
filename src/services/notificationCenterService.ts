import AsyncStorage from '@react-native-async-storage/async-storage/lib/commonjs/index';
import * as Notifications from 'expo-notifications';

import type { AppNotificationItem } from '../models/appNotification';
import { getAuthSession } from '../store';
import {
  getNotificationCenterState,
  setNotificationCenterState,
} from '../store/notificationCenterStore';

const NOTIFICATION_CENTER_STORAGE_PREFIX = 'inqoura/notification-center/v1';
const MAX_NOTIFICATION_ITEMS = 20;

function getNotificationScopeId() {
  const userId = getAuthSession().user?.id;
  return userId ? `user:${userId}` : 'guest';
}

function getNotificationCenterStorageKey(scopeId: string) {
  return `${NOTIFICATION_CENTER_STORAGE_PREFIX}/${scopeId}`;
}

function isHistoryTarget(
  value: unknown
): value is { targetScreen: 'History' } {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'targetScreen' in value &&
      value.targetScreen === 'History'
  );
}

function normalizeItems(items: AppNotificationItem[]) {
  return items
    .slice()
    .sort((left, right) => right.receivedAt.localeCompare(left.receivedAt))
    .slice(0, MAX_NOTIFICATION_ITEMS);
}

async function persistNotificationCenterState(scopeId: string, items: AppNotificationItem[]) {
  await AsyncStorage.setItem(
    getNotificationCenterStorageKey(scopeId),
    JSON.stringify(normalizeItems(items))
  );
}

function toNotificationItem(
  notification: Notifications.Notification,
  existingItem?: AppNotificationItem
): AppNotificationItem | null {
  if (!isHistoryTarget(notification.request.content.data)) {
    return null;
  }

  return {
    body: notification.request.content.body?.trim() || 'Open the app for more details.',
    id: notification.request.identifier,
    presented: true,
    receivedAt: existingItem?.receivedAt ?? new Date().toISOString(),
    targetScreen: 'History',
    title: notification.request.content.title?.trim() || 'History reminder',
    unread: true,
  };
}

export async function hydrateNotificationCenterForCurrentScope() {
  const scopeId = getNotificationScopeId();
  const rawValue = await AsyncStorage.getItem(getNotificationCenterStorageKey(scopeId));
  const items = rawValue ? ((JSON.parse(rawValue) as AppNotificationItem[]) ?? []) : [];

  setNotificationCenterState({
    items: normalizeItems(items),
    unreadCount: 0,
  });
}

export async function syncNotificationCenterFromPresentedNotifications() {
  const scopeId = getNotificationScopeId();
  const currentState = getNotificationCenterState();
  const currentItemsById = new Map(currentState.items.map((item) => [item.id, item]));
  const presentedNotifications = await Notifications.getPresentedNotificationsAsync().catch(
    () => []
  );
  const presentedIds = new Set<string>();

  for (const notification of presentedNotifications) {
    const nextItem = toNotificationItem(
      notification,
      currentItemsById.get(notification.request.identifier)
    );

    if (!nextItem) {
      continue;
    }

    presentedIds.add(nextItem.id);
    currentItemsById.set(nextItem.id, nextItem);
  }

  for (const [itemId, item] of currentItemsById.entries()) {
    if (presentedIds.has(itemId)) {
      continue;
    }

    currentItemsById.set(itemId, {
      ...item,
      presented: false,
      unread: false,
    });
  }

  const nextItems = normalizeItems([...currentItemsById.values()]);
  await persistNotificationCenterState(scopeId, nextItems);
  setNotificationCenterState({ items: nextItems, unreadCount: 0 });
}

export async function recordPresentedNotification(
  notification: Notifications.Notification
) {
  const scopeId = getNotificationScopeId();
  const currentState = getNotificationCenterState();
  const currentItemsById = new Map(currentState.items.map((item) => [item.id, item]));
  const nextItem = toNotificationItem(
    notification,
    currentItemsById.get(notification.request.identifier)
  );

  if (!nextItem) {
    return;
  }

  currentItemsById.set(nextItem.id, nextItem);
  const nextItems = normalizeItems([...currentItemsById.values()]);
  await persistNotificationCenterState(scopeId, nextItems);
  setNotificationCenterState({ items: nextItems, unreadCount: 0 });
}

export async function markNotificationHandled(notificationId: string) {
  const scopeId = getNotificationScopeId();
  const currentState = getNotificationCenterState();
  const nextItems = currentState.items.map((item) =>
    item.id === notificationId
      ? {
          ...item,
          presented: false,
          unread: false,
        }
      : item
  );

  await Notifications.dismissNotificationAsync(notificationId).catch(() => null);
  await persistNotificationCenterState(scopeId, nextItems);
  setNotificationCenterState({ items: nextItems, unreadCount: 0 });
}

export async function markAllNotificationsRead() {
  const scopeId = getNotificationScopeId();
  const currentState = getNotificationCenterState();
  const nextItems = currentState.items.map((item) => ({
    ...item,
    presented: false,
    unread: false,
  }));

  await Notifications.dismissAllNotificationsAsync().catch(() => null);
  await persistNotificationCenterState(scopeId, nextItems);
  setNotificationCenterState({ items: nextItems, unreadCount: 0 });
}
