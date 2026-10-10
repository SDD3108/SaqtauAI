import { router } from 'expo-router';
import { CheckCircle2, HeartPulse } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import AuthShell from '@/src/features/auth/components/AuthShell';
import { useAuthStore } from '@/src/features/auth/auth.store';
import useI18n from '@/src/features/localization/hooks/useI18n';
import { useOnboardingStore } from '@/src/features/onboarding/onboarding.store';

export default function FirstCheckInScreen() {
  const { t } = useI18n();
  const firstCheckInCompleted = useOnboardingStore(
    (state) => state.firstCheckInCompleted,
  );
  const warning = useAuthStore((state) => state.migrationWarning);
  const clearWarning = useAuthStore((state) => state.clearMigrationWarning);

  const goHome = () => {
    clearWarning();
    router.replace('/(app)/(tabs)');
  };

  return (
    <AuthShell
      step={t('auth.step3')}
      title={firstCheckInCompleted ? t('auth.checkinHere') : t('auth.firstCheckinTitle')}
      subtitle={
        firstCheckInCompleted
          ? t('auth.firstCheckinDoneSubtitle')
          : t('auth.firstCheckinSubtitle')
      }
      onBack={goHome}
    >
      <View className="mt-7 items-center rounded-[28px] bg-[#F7F7F8] px-6 py-9">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-[#181027]">
          {firstCheckInCompleted ? (
            <CheckCircle2 size={31} color="#ECECEC" strokeWidth={2} />
          ) : (
            <HeartPulse size={31} color="#ECECEC" strokeWidth={2} />
          )}
        </View>

        <Text className="mt-5 text-center font-inter-bold text-[21px] leading-[27px] text-[#181027]">
          {firstCheckInCompleted
            ? t('auth.nothingLost')
            : t('auth.baselineMinute')}
        </Text>

        <Text className="mt-2 text-center font-inter text-[14px] leading-[21px] text-[#807B89]">
          {firstCheckInCompleted
            ? t('auth.guestResultPreserved')
            : t('auth.firstCheckinBody')}
        </Text>
      </View>

      {warning ? (
        <View className="mt-5 rounded-2xl bg-[#F6EFE4] px-4 py-3">
          <Text className="font-inter text-[13px] leading-[19px] text-[#735E3C]">
            {warning}
          </Text>
        </View>
      ) : null}

      <Pressable
        accessibilityRole="button"
        className="mt-8 h-14 items-center justify-center rounded-2xl bg-[#181027] active:opacity-90"
        onPress={
          firstCheckInCompleted
            ? goHome
            : () => {
                clearWarning();
                router.replace('/(check-in)');
              }
        }
      >
        <Text className="font-inter-semibold text-[16px] text-[#ECECEC]">
          {firstCheckInCompleted ? t('auth.goHome') : t('onboarding.startCheckIn')}
        </Text>
      </Pressable>

      {!firstCheckInCompleted ? (
        <Pressable
          accessibilityRole="button"
          className="mt-3 h-12 items-center justify-center"
          onPress={goHome}
        >
          <Text className="font-inter-medium text-[14px] text-[#807B89]">
            {t('auth.doLater')}
          </Text>
        </Pressable>
      ) : null}
    </AuthShell>
  );
}
