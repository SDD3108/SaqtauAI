import { STORAGE_KEYS } from '@/src/services/storage/keys';
import { getJSON, getString, removeStorageItem, setJSON, setString } from '@/src/services/storage/storage';

export const DEFAULT_NOTIFICATION_PREFERENCES = {
  checkin_reminders: true,
  reminder_time: '08:30',
  in_app_notifications: true,
  email_notifications: false,
  report_ready: true,
  family_activity: true,
};

export async function getLocalNotificationPreferences() {
  const stored = await getJSON(STORAGE_KEYS.NOTIFICATION_PREFERENCES, {});

  return {
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    ...(stored || {}),
  };
}

export async function saveLocalNotificationPreferences(preferences) {
  await setJSON(STORAGE_KEYS.NOTIFICATION_PREFERENCES, preferences);
  return preferences;
}

const DAILY_REMINDER_KEY = 'saqtau.notifications.dailyReminderId';

export function getDailyReminderId() {
  return getString(DAILY_REMINDER_KEY);
}

export function saveDailyReminderId(identifier) {
  return identifier
    ? setString(DAILY_REMINDER_KEY, identifier)
    : removeStorageItem(DAILY_REMINDER_KEY);
}
