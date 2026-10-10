import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

import { getNotifications } from '@/src/features/notifications/notifications.api';
import { useNotificationsStore } from '@/src/features/notifications/notifications.store';

export default function useNotificationBadge() {
  const unreadCount = useNotificationsStore((state) => state.unreadCount);
  const setUnreadCount = useNotificationsStore((state) => state.setUnreadCount);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      getNotifications()
        .then((result) => {
          if (active) {
            setUnreadCount(result.unreadCount);
          }
        })
        .catch(() => {});

      return () => {
        active = false;
      };
    }, [setUnreadCount]),
  );

  return unreadCount;
}
