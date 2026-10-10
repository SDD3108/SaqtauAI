import { useFocusEffect } from 'expo-router';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';

import {
  getNotifications,
  markNotificationRead,
} from '@/src/features/notifications/notifications.api';
import { useNotificationsStore } from '@/src/features/notifications/notifications.store';
import { getNotificationDestination } from '@/src/features/notifications/notifications.utils';

export default function useNotifications() {
  const setUnreadCount = useNotificationsStore((state) => state.setUnreadCount);
  const decrementUnread = useNotificationsStore((state) => state.decrementUnread);

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(
    async ({ refresh = false } = {}) => {
      refresh ? setRefreshing(true) : setLoading(true);
      setError('');

      try {
        const result = await getNotifications();
        setNotifications(result.notifications);
        setUnreadCount(result.unreadCount);
      } catch (loadError) {
        setError(loadError?.message || 'Could not load notifications.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [setUnreadCount],
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const openNotification = useCallback(
    async (notification) => {
      const wasUnread = !notification.read;

      if (wasUnread) {
        setNotifications((current) =>
          current.map((item) =>
            item.id === notification.id ? { ...item, read: true } : item,
          ),
        );
        decrementUnread();

        try {
          await markNotificationRead(notification.id);
        } catch {
          // The destination is still useful even if read-state sync failed.
        }
      }

      const destination = getNotificationDestination(notification);

      if (destination) {
        router.push(destination);
      }
    },
    [decrementUnread],
  );

  return {
    notifications,
    loading,
    refreshing,
    error,
    refresh: () => load({ refresh: true }),
    retry: () => load(),
    openNotification,
  };
}
