import { useCallback, useEffect, useState } from 'react';

import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from '@/src/features/notifications/notifications.api';

import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  getLocalNotificationPreferences,
  saveLocalNotificationPreferences,
} from '@/src/features/notifications/notification-preferences.storage';

import {
  permissionGranted,
  readPermission,
  requestPermission,
  syncPushRegistration,
} from '@/src/services/notifications/push';

function normalizePermission(permission) {
  return {
    status: permission?.status || 'undetermined',
    granted: permissionGranted(permission),
    canAskAgain: permission?.canAskAgain !== false,
  };
}

export default function useNotificationPreferences() {
  const [preferences, setPreferences] = useState(
    DEFAULT_NOTIFICATION_PREFERENCES,
  );

  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState('');
  const [error, setError] = useState('');

  const [pushStatus, setPushStatus] = useState({
    status: 'undetermined',
    granted: false,
    canAskAgain: true,
  });

  const [registeringPush, setRegisteringPush] = useState(false);
  const [pushMessage, setPushMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [local, server, permission] = await Promise.all([
        getLocalNotificationPreferences(),

        getNotificationPreferences().catch(() => null),

        readPermission().catch(() => null),
      ]);

      const merged = {
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        ...local,
        ...(server || {}),
      };

      setPreferences(merged);

      if (permission) {
        setPushStatus(normalizePermission(permission));
      }

      await saveLocalNotificationPreferences(merged);
    } catch (loadError) {
      setError(
        loadError?.message ||
          'Could not load notification settings.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updatePreference = useCallback(
    async (key, value) => {
      const previous = preferences;

      const next = {
        ...preferences,
        [key]: value,
      };

      setPreferences(next);
      setSavingKey(key);
      setError('');

      try {
        await saveLocalNotificationPreferences(next);

        const server = await updateNotificationPreferences({
          [key]: value,
        });

        if (server) {
          const merged = {
            ...next,
            ...server,
          };

          setPreferences(merged);
          await saveLocalNotificationPreferences(merged);
        }
      } catch (updateError) {
        setPreferences(previous);

        await saveLocalNotificationPreferences(previous);

        setError(
          updateError?.message ||
            'Could not save this setting.',
        );
      } finally {
        setSavingKey('');
      }
    },
    [preferences],
  );

  const enablePush = useCallback(async () => {
    setRegisteringPush(true);
    setPushMessage('');

    try {
      const permission = await requestPermission();

      const normalized = normalizePermission(permission);

      setPushStatus(normalized);

      if (!normalized.granted) {
        if (normalized.status === 'denied') {
          setPushMessage(
            'Notifications are disabled. Enable them in iOS Settings.',
          );
        } else {
          setPushMessage(
            'Notification permission was not granted.',
          );
        }

        return;
      }

      await syncPushRegistration();

      setPushMessage('Push notifications enabled.');

      const latestPermission = await readPermission();

      setPushStatus(
        normalizePermission(latestPermission),
      );
    } catch (pushError) {
      console.log('Enable push error:', pushError);

      setPushMessage(
        pushError?.message ||
          'Could not enable push notifications.',
      );
    } finally {
      setRegisteringPush(false);
    }
  }, []);

  return {
    preferences,
    loading,
    savingKey,
    error,

    retry: load,
    updatePreference,

    pushStatus,
    registeringPush,
    pushMessage,
    enablePush,
  };
}