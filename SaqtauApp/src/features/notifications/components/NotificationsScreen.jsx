import { router } from 'expo-router';
import { ArrowLeft, Bell } from 'lucide-react-native';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import useI18n from '@/src/features/localization/hooks/useI18n';
import NotificationItem from '@/src/features/notifications/components/NotificationItem';
import useNotifications from '@/src/features/notifications/hooks/useNotifications';
import { isToday } from '@/src/features/notifications/notifications.utils';

function NotificationGroup({ title, items, onPress }) {
  if (!items.length) return null;
  return (
    <View className="mt-7">
      <Text className="mb-2 ml-4 font-inter-medium text-[16px] text-[#181027]">{title}</Text>
      <View className="rounded-[22px] bg-white px-4 shadow-sm">
        {items.map((item) => (
          <NotificationItem key={item.id} notification={item} onPress={onPress} compact={items.length > 1} />
        ))}
      </View>
    </View>
  );
}

export default function NotificationsScreen() {
  const { t } = useI18n();
  const { notifications, loading, refreshing, error, refresh, retry, openNotification } = useNotifications();
  const newItems = notifications.filter((item) => !item.read || isToday(item.created_at));
  const newIds = new Set(newItems.map((item) => item.id));
  const earlierItems = notifications.filter((item) => !newIds.has(item.id));

  return (
    <SafeAreaView className="flex-1 bg-[#ECECEC]" edges={['top']}>
      <View className="relative h-16 justify-center px-6">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          hitSlop={8}
          onPress={() => router.back()}
          className="absolute left-6 z-10 h-12 w-12 items-start justify-center active:opacity-60"
        >
          <ArrowLeft size={31} color="#111111" strokeWidth={2.1} />
        </Pressable>
        <Text accessibilityRole="header" className="text-center font-inter-semibold text-[26px] tracking-[-0.8px] text-[#181027]">
          {t('notifications.title')}
        </Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#181027" accessibilityLabel={t('common.loading')} />
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 34 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#181027" />}
        >
          {error ? (
            <View accessibilityLiveRegion="polite" className="mt-5 rounded-[20px] bg-white px-5 py-5">
              <Text className="font-inter-medium text-[14px] leading-[20px] text-[#5F5B75]">{error}</Text>
              <Pressable accessibilityRole="button" onPress={retry} className="mt-3 self-start" hitSlop={8}>
                <Text className="font-inter-semibold text-[14px] text-[#181027]">{t('notifications.retry')}</Text>
              </Pressable>
            </View>
          ) : null}

          {!error && notifications.length === 0 ? (
            <View className="mt-36 items-center px-8">
              <View className="h-20 w-20 items-center justify-center rounded-full bg-[#E5E4E7]">
                <Bell size={34} color="#5F5B75" />
              </View>
              <Text className="mt-6 font-inter-semibold text-[20px] text-[#181027]">{t('notifications.emptyTitle')}</Text>
              <Text className="mt-2 text-center font-inter-medium text-[14px] leading-[20px] text-[#807B89]">{t('notifications.emptyBody')}</Text>
            </View>
          ) : (
            <>
              <NotificationGroup title={t('notifications.new')} items={newItems} onPress={openNotification} />
              <NotificationGroup title={t('notifications.earlier')} items={earlierItems} onPress={openNotification} />
              {!!notifications.length && (
                <View className="mt-14 flex-row items-center justify-center gap-4 pb-4">
                  <Bell size={24} color="#5F5B75" fill="#5F5B75" />
                  <Text className="font-inter-medium text-[16px] text-[#5F5B75]">{t('notifications.caughtUp')}</Text>
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
