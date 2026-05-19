import { AppState } from 'react-native';
import * as Notifications from 'expo-notifications';

import { subscribeAuthSession } from '../store';
import { trackAnalyticsEvent } from './analyticsService';
import { recordNonFatalError } from './appMonitoringService';
import {
  hydrateNotificationCenterForCurrentScope,
  markNotificationHandled,
  recordPresentedNotification,
  syncNotificationCenterFromPresentedNotifications,
} from './notificationCenterService';

export function startNotificationCenterRuntime() {
  void hydrateNotificationCenterForCurrentScope()
    .then(() => syncNotificationCenterFromPresentedNotifications())
    .catch((error) => {
      recordNonFatalError('notifications.bootstrap', error);
    });

  void Notifications.getLastNotificationResponseAsync()
    .then((response) => {
      if (!response) {
        return;
      }

      trackAnalyticsEvent('notification_opened', {
        identifier: response.notification.request.identifier,
        source: 'last-response',
      });
      return recordPresentedNotification(response.notification).then(() =>
        markNotificationHandled(response.notification.request.identifier)
      );
    })
    .catch((error) => {
      recordNonFatalError('notifications.last_response', error);
    });

  const receivedSubscription = Notifications.addNotificationReceivedListener(
    (notification) => {
      void recordPresentedNotification(notification).catch((error) => {
        recordNonFatalError('notifications.received', error, {
          identifier: notification.request.identifier,
        });
      });
    }
  );

  const responseSubscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      trackAnalyticsEvent('notification_opened', {
        identifier: response.notification.request.identifier,
        source: 'notification-response',
      });
      void recordPresentedNotification(response.notification)
        .then(() => markNotificationHandled(response.notification.request.identifier))
        .catch((error) => {
          recordNonFatalError('notifications.response', error, {
            identifier: response.notification.request.identifier,
          });
        });
    }
  );

  const authCleanup = subscribeAuthSession(() => {
    void hydrateNotificationCenterForCurrentScope()
      .then(() => syncNotificationCenterFromPresentedNotifications())
      .catch((error) => {
        recordNonFatalError('notifications.auth_sync', error);
      });
  });

  const appStateSubscription = AppState.addEventListener('change', (nextState) => {
    if (nextState === 'active') {
      void syncNotificationCenterFromPresentedNotifications().catch((error) => {
        recordNonFatalError('notifications.foreground_sync', error);
      });
    }
  });

  return () => {
    receivedSubscription.remove();
    responseSubscription.remove();
    authCleanup();
    appStateSubscription.remove();
  };
}
