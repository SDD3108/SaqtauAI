import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';

import { useAuthStore } from '@/src/features/auth/auth.store';
import { useNotificationsStore } from '@/src/features/notifications/notifications.store';
import { getNotificationDestination } from '@/src/features/notifications/notifications.utils';
import {
  notificationModuleAvailable,
  registerForPushNotifications,
} from '@/src/services/notifications/push';

if (notificationModuleAvailable() && typeof Notifications.setNotificationHandler === 'function') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: true,
    }),
  });
}

function normalizeResponse(response) {
  const content = response?.notification?.request?.content || {};
  return {
    kind: content.data?.kind || content.data?.type || 'notification',
    title: content.title || 'SaqtauAI',
    body: content.body || '',
    data: content.data || {},
  };
}

async function openResponse(response) {
  if (!response) return;

  const notification = normalizeResponse(response);
  const destination = getNotificationDestination(notification);
  router.push(destination || '/(app)/notifications');

  if (typeof Notifications.clearLastNotificationResponseAsync === 'function') {
    await Notifications.clearLastNotificationResponseAsync().catch(() => {});
  }
}

export default function NotificationRuntime() {
  const token = useAuthStore((state) => state.token);
  const incrementUnread = useNotificationsStore((state) => state.incrementUnread);

  useEffect(() => {
    if (!token || !notificationModuleAvailable()) return;
    registerForPushNotifications({ requestPermission: false }).catch(() => {});
  }, [token]);

  useEffect(() => {
    if (!notificationModuleAvailable()) return undefined;

    let receiveSubscription;
    let responseSubscription;
    let pushTokenSubscription;
    let active = true;

    if (typeof Notifications.addNotificationReceivedListener === 'function') {
      receiveSubscription = Notifications.addNotificationReceivedListener(() => {
        incrementUnread();
      });
    }

    if (typeof Notifications.addNotificationResponseReceivedListener === 'function') {
      responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
        openResponse(response);
      });
    }

    if (typeof Notifications.addPushTokenListener === 'function') {
      pushTokenSubscription = Notifications.addPushTokenListener(() => {
        registerForPushNotifications({ requestPermission: false }).catch(() => {});
      });
    }

    if (typeof Notifications.getLastNotificationResponseAsync === 'function') {
      Notifications.getLastNotificationResponseAsync()
        .then((response) => {
          if (active && response) return openResponse(response);
          return null;
        })
        .catch(() => {});
    }

    return () => {
      active = false;
      receiveSubscription?.remove?.();
      responseSubscription?.remove?.();
      pushTokenSubscription?.remove?.();
    };
  }, [incrementUnread]);

  return null;
}
