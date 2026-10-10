import { Pressable, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

import NotificationIcon from '@/src/features/notifications/components/NotificationIcon';
import { formatNotificationTime } from '@/src/features/notifications/notifications.utils';

export default function NotificationItem({ notification, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${notification.title}. ${notification.body}`}
      onPress={() => onPress(notification)}
      className="flex-row items-center rounded-[18px] bg-white px-4 py-4 active:opacity-80"
    >
      <NotificationIcon notification={notification} />

      <View className="ml-3 flex-1">
        <View className="flex-row items-center">
          <Text
            className="flex-1 font-inter-semibold text-[15px] leading-[20px] text-[#181027]"
            numberOfLines={1}
          >
            {notification.title}
          </Text>

          <Text className="ml-2 font-inter-medium text-[12px] text-[#99959F]">
            {formatNotificationTime(notification.created_at)}
          </Text>
        </View>

        <Text
          className="mt-1 font-inter text-[13px] leading-[18px] text-[#807B89]"
          numberOfLines={2}
        >
          {notification.body}
        </Text>
      </View>

      {!notification.read ? (
        <View className="ml-2 h-2.5 w-2.5 rounded-full bg-[#181027]" />
      ) : (
        <ChevronRight size={17} color="#B7B2BD" strokeWidth={1.8} />
      )}
    </Pressable>
  );
}
