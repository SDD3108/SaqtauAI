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
import {
  AccurateReadingCard,
  PrivacyCard,
} from '@/src/features/dashboard/components/DashboardTipCard';
import WellnessScoreCard from '@/src/features/dashboard/components/WellnessScoreCard';
import {
  formatCheckInDuration,
  formatLastCheckIn,
} from '@/src/features/dashboard/dashboard.utils';
import useDashboard from '@/src/features/dashboard/hooks/useDashboard';

export default function DashboardScreen() {
  const account = useAuthStore((state) => state.account);
  const isGuest = useAuthStore((state) => state.isGuest);

  const {
    latest,
    wellnessScore,
    statusLabel,
    message,
    loading,
    refreshing,
    error,
    refresh,
    retry,
  } = useDashboard();

  const displayName = isGuest
    ? ''
    : String(account?.display_name || '').trim();

  const greeting = displayName
    ? `Good morning, ${displayName}`
    : 'Good morning';

  return (
    <SafeAreaView
      className="flex-1 bg-[#ECECEC]"
      edges={['top']}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 18,
          paddingBottom: 28,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor="#181027"
          />
        }
      >
        <View className="w-full max-w-[520px] self-center">
          <View className="flex-1 flex-row items-center gap-3">
            <Logo width={50} height={50} />
            <Text className="text-start font-inter-extrabold text-[32px] leading-[36px] tracking-[-1.25px] text-[#181027]">Saqtau AI</Text>
          </View>

          <View className="mt-8 items-start">
            <Text
              className="text-start font-inter-extrabold text-[30px] leading-[36px] tracking-[-1.25px] text-[#181027]"
              numberOfLines={2}
            >
              {greeting}
            </Text>
            <Text className="mt-1 text-center font-inter-medium text-[15px] leading-[20px] tracking-[-0.25px] text-[#807B89]">
              Ready for your 60-second wellness check-in?
            </Text>
          </View>

          {loading ? (
            <View className="mt-10 h-[235px] items-center justify-center rounded-[15px] border border-[#B7B2BD]">
              <ActivityIndicator color="#181027" />
            </View>
          ) : (
            <View className="mt-10">
              <WellnessScoreCard
                score={wellnessScore}
                statusLabel={statusLabel}
                message={message}
              />
            </View>
          )}

          {error ? (
            <View className="mt-3 rounded-[15px] border border-[#B7B2BD] px-4 py-3">
              <Text className="font-inter-medium text-[13px] leading-[19px] text-[#807B89]">
                {error}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={retry}
                className="mt-2 self-start"
              >
                <Text className="font-inter-semibold text-[13px] text-[#181027]">
                  Try again
                </Text>
              </Pressable>
            </View>
          ) : null}

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/(check-in)/permissions')}
            className="mt-3 h-[54px] items-center justify-center rounded-[14px] bg-[#181027] active:opacity-90"
          >
            <Text className="font-inter-medium text-[17px] text-white">
              Start check-in
            </Text>
          </Pressable>

          <CheckInInfoStrip
            lastCheckIn={formatLastCheckIn(latest)}
            duration={formatCheckInDuration(latest)}
          />

          <AccurateReadingCard />
          <PrivacyCard />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
