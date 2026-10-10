import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Linking, Platform } from 'react-native';

import {
  registerPushToken,
  unregisterPushToken,
} from '@/src/features/notifications/notifications.api';
import {
  getDailyReminderId,
  getLocalNotificationPreferences,
  saveDailyReminderId,
} from '@/src/features/notifications/notification-preferences.storage';
import {
  localDateKey,
  notificationType,
} from '@/src/features/notifications/notifications.utils';
import { ApiError } from '@/src/services/api/client';
import {
  getJSON,
  removeStorageItem,
  setJSON,
} from '@/src/services/storage/storage';

const SCHEDULE_ID = 'saqtau.checkin.daily';
const PUSH_BINDING_KEY = 'saqtau.notifications.pushBinding';
let registering = Promise.resolve();

function hasNotificationsNativeModule() {
  return Boolean(
    Notifications &&
      typeof Notifications.getPermissionsAsync === 'function' &&
      typeof Notifications.requestPermissionsAsync === 'function',
  );
}

function nativeBuildRequiredResult() {
  return {
    ok: false,
    available: false,
    granted: false,
    status: 'native_build_required',
    canAskAgain: false,
    message: 'Rebuild the iOS app after adding the notification native module.',
  };
}

function getProjectId() {
  return (
    Constants?.expoConfig?.extra?.eas?.projectId ||
    Constants?.easConfig?.projectId ||
    null
  );
}

export function notificationModuleAvailable() {
  return hasNotificationsNativeModule();
}

export function permissionGranted(permission) {
  return Boolean(
    permission?.granted ||
      permission?.ios?.status === Notifications.IosAuthorizationStatus?.PROVISIONAL ||
      permission?.ios?.status === Notifications.IosAuthorizationStatus?.EPHEMERAL,
  );
}

export async function readPermission() {
  if (!hasNotificationsNativeModule()) return null;
  return Notifications.getPermissionsAsync();
}

export async function getPushPermissionStatus() {
  if (!hasNotificationsNativeModule()) return nativeBuildRequiredResult();

  try {
    const permission = await Notifications.getPermissionsAsync();
    return {
      ok: true,
      available: true,
      granted: permissionGranted(permission),
      status: permission.status || 'undetermined',
      canAskAgain: permission.canAskAgain !== false,
      raw: permission,
    };
  } catch (error) {
    return {
      ok: false,
      available: true,
      granted: false,
      status: 'error',
      canAskAgain: true,
      message: error?.message || 'Could not read notification permission.',
    };
  }
}

export async function requestNotificationPermission() {
  if (!hasNotificationsNativeModule()) return nativeBuildRequiredResult();

  const current = await getPushPermissionStatus();
  if (current.granted) return current;

  if (current.status === 'denied' && !current.canAskAgain) {
    return { ...current, message: 'Notifications are disabled in iOS Settings.' };
  }

  const permission = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });

  return {
    ok: true,
    available: true,
    granted: permissionGranted(permission),
    status: permission.status || 'undetermined',
    canAskAgain: permission.canAskAgain !== false,
    raw: permission,
  };
}

export async function requestPermission() {
  const result = await requestNotificationPermission();
  return result.raw || result;
}

export function openNotificationSettings() {
  return Linking.openSettings();
}

export async function registerForPushNotifications({ requestPermission = false } = {}) {
  if (!Device.isDevice) {
    return {
      ok: false,
      status: 'physical_device_required',
      message: 'Remote push notifications require a physical device.',
    };
  }

  let permission = await getPushPermissionStatus();
  if (requestPermission && !permission.granted) {
    permission = await requestNotificationPermission();
  }

  if (!permission.granted) {
    return {
      ok: false,
      status: permission.status,
      canAskAgain: permission.canAskAgain,
      message: permission.message || 'Notification permission is not enabled.',
    };
  }

  if (typeof Notifications.getExpoPushTokenAsync !== 'function') {
    return nativeBuildRequiredResult();
  }

  const projectId = getProjectId();
  if (!projectId) {
    return {
      ok: false,
      status: 'missing_project_id',
      message: 'Expo EAS projectId is missing. Run npx eas-cli@latest init once.',
    };
  }

  const token = await Notifications.getExpoPushTokenAsync({ projectId });

  try {
    await registerPushToken(token.data, Platform.OS);
    await setJSON(PUSH_BINDING_KEY, { expoToken: token.data });
  } catch (error) {
    return {
      ok: false,
      status: 'backend_registration_failed',
      token: token.data,
      message: error?.message || 'Push token was created but could not be saved on the server.',
    };
  }

  return {
    ok: true,
    status: 'registered',
    token: token.data,
    message: 'Push notifications are enabled.',
  };
}

export function syncPushRegistration() {
  const job = registering.then(() =>
    registerForPushNotifications({ requestPermission: false }),
  );
  registering = job.catch(() => {});
  return job;
}

export async function invalidatePushBinding() {
  await removeStorageItem(PUSH_BINDING_KEY);
  return syncPushRegistration();
}

export async function cancelDailyCheckInReminder() {
  const existingId = await getDailyReminderId();
  const ids = new Set([existingId, SCHEDULE_ID].filter(Boolean));

  if (hasNotificationsNativeModule()) {
    for (const identifier of ids) {
      try {
        await Notifications.cancelScheduledNotificationAsync(identifier);
      } catch {
        // Idempotent from the product perspective.
      }
    }
  }

  await saveDailyReminderId(null);
}

export async function scheduleDailyCheckInReminder(time) {
  const permission = await requestNotificationPermission();
  if (!permission.granted) return permission;

  if (
    typeof Notifications.scheduleNotificationAsync !== 'function' ||
    !Notifications.SchedulableTriggerInputTypes?.DAILY
  ) {
    return nativeBuildRequiredResult();
  }

  await cancelDailyCheckInReminder();

  const [hour = 19, minute = 0] = String(time || '19:00')
    .split(':')
    .map((value) => Number(value));

  const identifier = await Notifications.scheduleNotificationAsync({
    identifier: SCHEDULE_ID,
    content: {
      title: 'Time for a check-in',
      body: 'Take a moment for yourself with a SaqtauAI check-in.',
      data: { type: 'reminder', saqtau_reminder: true },
      sound: false,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      ...(Platform.OS === 'android' ? { channelId: 'check-ins' } : {}),
    },
  });

  await saveDailyReminderId(identifier);
  return { ok: true, status: 'scheduled', identifier };
}

export async function syncReminderSchedule() {
  const permission = await getPushPermissionStatus();
  const preferences = await getLocalNotificationPreferences();

  if (!preferences.checkin_reminders || !permission.granted) {
    await cancelDailyCheckInReminder();
    return { ok: true, status: 'not_scheduled' };
  }

  return scheduleDailyCheckInReminder(preferences.reminder_time);
}

export async function scheduleTestNotification(seconds = 3) {
  const permission = await requestNotificationPermission();
  if (!permission.granted) return permission;

  if (typeof Notifications.scheduleNotificationAsync !== 'function') {
    return nativeBuildRequiredResult();
  }

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'SaqtauAI',
      body: 'Test notification works successfully.',
      data: { type: 'reminder', test: true },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: Math.max(1, Number(seconds) || 3),
    },
  });

  return { ok: true, status: 'scheduled', identifier };
}

export function installNotificationHandler() {
  if (!hasNotificationsNativeModule()) return;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export function nativeNotificationItem(notification, session) {
  const content = notification?.request?.content;
  if (!content) return null;

  const data = content.data || {};
  const date = new Date(notification.date || Date.now());
  const local = data.saqtau_reminder === true;
  const id = local ? `reminder:${localDateKey(date)}` : data.notification_id;

  if (!id) return null;

  return {
    id: String(id),
    type: notificationType({ ...data, data }),
    title: content.title || 'Notification',
    text: content.body || '',
    data,
    created_at: date.toISOString(),
    server: !local,
    session,
  };
}

export async function detachNotificationDevice(authToken, accountId) {
  await registering.catch(() => {});
  const binding = await getJSON(PUSH_BINDING_KEY);

  if (binding?.expoToken) {
    try {
      await unregisterPushToken(authToken, binding.expoToken);
    } catch (error) {
      // Keep auth/account switching usable while older deployments have only
      // /kids/push/register/. The next sign-in will re-bind the token.
      if (!(error instanceof ApiError) || ![404, 405].includes(error.status)) {
        throw error;
      }
    }
    await removeStorageItem(PUSH_BINDING_KEY);
  }

  await cancelDailyCheckInReminder();

  if (hasNotificationsNativeModule()) {
    await Notifications.dismissAllNotificationsAsync().catch(() => {});
    await Notifications.setBadgeCountAsync(0).catch(() => {});
  }

  return { accountId };
}
