import { router } from 'expo-router';
import { Bell } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import useI18n from '@/src/features/localization/hooks/useI18n';
import useNotificationBadge from '@/src/features/notifications/hooks/useNotificationBadge';

export default function NotificationBell() {
  const unreadCount = useNotificationBadge();
  const { t } = useI18n();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        unreadCount
          ? t('notifications.a11yUnread', { count: unreadCount })
          : t('notifications.title')
      }
      hitSlop={8}
      onPress={() => router.push('/(app)/notifications')}
      className="h-11 w-11 items-center justify-center rounded-full bg-white active:opacity-75"
    >
      <Bell size={22} color="#181027" strokeWidth={2} />
      {unreadCount > 0 ? (
        <View className="absolute -right-1 -top-1 min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#181027] px-1">
          <Text className="font-inter-bold text-[10px] text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}
