import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';

import { useAuthStore } from '@/src/features/auth/auth.store';
import { useNotificationsStore } from '@/src/features/notifications/notifications.store';
import { getNotificationDestination, getNotificationKind } from '@/src/features/notifications/notifications.utils';
import { saveLastMeasurementId } from '@/src/features/check-in/check-in.storage';
import { useCheckInStore } from '@/src/features/check-in/check-in.store';
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
  const kind = getNotificationKind(notification);
  const measurementId = notification.data?.measurement_id;
  if ((kind === 'measurement_ready' || kind === 'checkin_ready' || kind === 'check_in_ready') && measurementId) {
    // A notification can be opened after the app was terminated. Hydrate the
    // exact completed measurement before entering the result screen.
    await saveLastMeasurementId(String(measurementId));
    useCheckInStore.setState({ measurement: null, measurementId: String(measurementId) });
  }
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

    // Intentionally no addPushTokenListener -> getExpoPushTokenAsync cycle.
    // Expo's native token registration can itself fire that listener. Register
    // once when the authentication session starts (and on the next app launch).

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
    };
  }, [incrementUnread]);

  return null;
}
