import { router } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Logo from '@/assets/images/Logo.svg';
import { useAuthStore } from '@/src/features/auth/auth.store';
import CheckInInfoStrip from '@/src/features/dashboard/components/CheckInInfoStrip';
import { AccurateReadingCard, PrivacyCard } from '@/src/features/dashboard/components/DashboardTipCard';
import WellnessScoreCard from '@/src/features/dashboard/components/WellnessScoreCard';
import { formatCheckInDuration, formatLastCheckIn } from '@/src/features/dashboard/dashboard.utils';
import useDashboard from '@/src/features/dashboard/hooks/useDashboard';
import useI18n from '@/src/features/localization/hooks/useI18n';
import NotificationBell from '@/src/features/notifications/components/NotificationBell';

export default function DashboardScreen() {
  const account = useAuthStore((state) => state.account);
  const isGuest = useAuthStore((state) => state.isGuest);
  const { t } = useI18n();

  const { latest, wellnessScore, statusLabel, message, loading, refreshing, error, refresh, retry } = useDashboard();
  const displayName = isGuest ? '' : String(account?.display_name || '').trim();
  const greeting = displayName ? t('dashboard.greetingName', { name: displayName }) : t('dashboard.greeting');

  return (
    <SafeAreaView className="flex-1 bg-[#ECECEC]" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 18, paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#181027" />}
      >
        <View className="w-full max-w-[520px] self-center">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <Logo width={50} height={50} />
              <Text className="font-inter-extrabold text-[32px] leading-[36px] tracking-[-1.25px] text-[#181027]">Saqtau AI</Text>
            </View>
            <NotificationBell />
          </View>

          <View className="mt-8 items-start">
            <Text accessibilityRole="header" className="font-inter-extrabold text-[30px] leading-[36px] tracking-[-1.25px] text-[#181027]" numberOfLines={2}>{greeting}</Text>
            <Text className="mt-1 font-inter-medium text-[15px] leading-[20px] tracking-[-0.25px] text-[#807B89]">{t('dashboard.ready')}</Text>
          </View>

          {loading ? (
            <View className="mt-10 h-[235px] items-center justify-center rounded-[15px] border border-[#B7B2BD]">
              <ActivityIndicator color="#181027" accessibilityLabel={t('common.loading')} />
            </View>
          ) : (
            <View className="mt-10">
              <WellnessScoreCard score={wellnessScore} statusLabel={statusLabel} message={message} />
            </View>
          )}

          {error ? (
            <View accessibilityLiveRegion="polite" className="mt-3 rounded-[15px] border border-[#B7B2BD] px-4 py-3">
              <Text className="font-inter-medium text-[13px] leading-[19px] text-[#807B89]">{error}</Text>
              <Pressable accessibilityRole="button" onPress={retry} className="mt-2 self-start" hitSlop={8}>
                <Text className="font-inter-semibold text-[13px] text-[#181027]">{t('dashboard.tryAgain')}</Text>
              </Pressable>
            </View>
          ) : null}

          <Pressable accessibilityRole="button" onPress={() => router.push('/(check-in)/permissions')} className="mt-3 h-[54px] items-center justify-center rounded-[14px] bg-[#181027] active:opacity-90">
            <Text className="font-inter-medium text-[17px] text-white">{t('dashboard.start')}</Text>
          </Pressable>

          <CheckInInfoStrip lastCheckIn={formatLastCheckIn(latest)} duration={formatCheckInDuration(latest)} />
          <AccurateReadingCard />
          <PrivacyCard />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
