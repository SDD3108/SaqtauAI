import * as Notifications from 'expo-notifications';

const DAILY_CHECKIN_REMINDER_ID = 'daily-checkin-reminder';

export async function scheduleDailyCheckinReminder(time) {
  const [hour, minute] = String(time)
    .split(':')
    .map(Number);

  if (
    Number.isNaN(hour) ||
    Number.isNaN(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    throw new Error(`Invalid reminder time: ${time}`);
  }

  const permissions = await Notifications.getPermissionsAsync();

  if (!permissions.granted) {
    throw new Error('Notification permission is not granted.');
  }

  await Notifications.cancelScheduledNotificationAsync(
    DAILY_CHECKIN_REMINDER_ID,
  );

  const identifier = await Notifications.scheduleNotificationAsync({
    identifier: DAILY_CHECKIN_REMINDER_ID,

    content: {
      title: 'Time for your check-in',
      body: 'Take a moment to complete your daily SaqtauAI check-in.',
      sound: 'default',
      data: {
        kind: 'checkin_reminder',
        type: 'checkin_reminder',
      },
    },

    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });

  console.log(
    `✅ Daily reminder scheduled for ${time}`,
    identifier,
  );

  return identifier;
}

export async function cancelDailyCheckinReminder() {
  await Notifications.cancelScheduledNotificationAsync(
    DAILY_CHECKIN_REMINDER_ID,
  );

  console.log('❌ Daily reminder cancelled');
}

export async function getDailyReminderDebugInfo() {
  const scheduled =
    await Notifications.getAllScheduledNotificationsAsync();

  const reminder = scheduled.find(
    (notification) =>
      notification.identifier === DAILY_CHECKIN_REMINDER_ID,
  );

  return reminder || null;
}