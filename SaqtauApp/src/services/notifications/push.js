import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { AppState, Linking, Platform } from 'react-native';

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
import { ApiError, getApiToken } from '@/src/services/api/client';
import { createPushRegistrationGate } from '@/src/services/notifications/pushRegistrationGate';
import {
  getJSON,
  removeStorageItem,
  setJSON,
} from '@/src/services/storage/storage';

const SCHEDULE_ID = 'saqtau.checkin.daily';
const PUSH_BINDING_KEY = 'saqtau.notifications.pushBinding';
let registering = Promise.resolve();
const pushRegistrationGate = createPushRegistrationGate();

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

async function performPushRegistration({ requestPermission = false } = {}) {
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

export function registerForPushNotifications({ requestPermission = false, force = false } = {}) {
  // The API uses this bearer session to associate the device with the correct account.
  // Automatic registrations are single-flight and do not hammer a failing backend.
  const job = pushRegistrationGate.run(
    getApiToken(),
    () => performPushRegistration({ requestPermission }),
    { force },
  );
  registering = job.catch(() => {});
  return job;
}

// True only after the server accepted the Expo token for the current session.
export async function isPushRegisteredOnThisDevice() {
  const binding = await getJSON(PUSH_BINDING_KEY);
  return Boolean(binding?.expoToken);
}

const remoteReadyIds = new Set();
const localReadyIds = new Set();

export function noteRemoteMeasurementNotification(measurementId) {
  if (measurementId !== null && measurementId !== undefined) {
    remoteReadyIds.add(String(measurementId));
  }
}

/**
 * OPTIONAL local fallback for guest check-ins while JS is active.
 * Authenticated check-ins must be notified by the backend through APNs/Expo.
 * There is no reliable client-only push when iOS suspends or terminates JS.
 */
export async function notifyMeasurementReady(measurement, { accountId, isCurrent } = {}) {
  if (!measurement?.id || measurement.status !== 'completed') return { status: 'skipped' };
  const id = String(measurement.id);
  if (accountId !== 'guest' || AppState.currentState !== 'active') return { status: 'remote_required' };
  if (isCurrent && !isCurrent()) return { status: 'session_changed' };
  if (remoteReadyIds.has(id) || localReadyIds.has(id)) return { status: 'already_notified' };
  const permission = await getPushPermissionStatus();
  if (!permission.granted) return { status: 'permission_missing' };
  const preferences = await getLocalNotificationPreferences();
  if (!preferences.report_ready) return { status: 'disabled_in_settings' };
  if (typeof Notifications.scheduleNotificationAsync !== 'function') return nativeBuildRequiredResult();
  localReadyIds.add(id);
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'SaqtauAI',
        body: 'Your check-in result is ready.',
        data: { type: 'measurement_ready', measurement_id: id, saqtau_checkin_ready: true },
        sound: 'default',
      },
      trigger: null,
    });
    return { status: 'local_delivered' };
  } catch (error) {
    localReadyIds.delete(id);
    throw error;
  }
}

export function syncPushRegistration() {
  // Called after a deliberate user action; allow retry even during cooldown.
  return registerForPushNotifications({ requestPermission: false, force: true });
}

export async function invalidatePushBinding() {
  pushRegistrationGate.reset();
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
  pushRegistrationGate.reset();
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
