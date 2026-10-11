import useI18n from '@/src/features/localization/hooks/useI18n';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Logo from '@/assets/images/Logo2.svg';
import { useOnboardingStore } from '@/src/features/onboarding/onboarding.store';

export default function WelcomeScreen() {
  const { t } = useI18n();
  const completeWelcome = useOnboardingStore((state) => state.completeWelcome);

  const handleStartCheckIn = async () => {
    await completeWelcome();
    router.push('/(check-in)');
  };

  return (
    <SafeAreaView
      className="flex-1 bg-[#ECECEC]"
      edges={['top', 'bottom']}
    >
      <View className="flex-1 px-6">
        <View className="flex-1 items-center justify-center">
          <Logo width={250} height={96} />

          <Text className="font-inter-extrabold mt-28 max-w-[320px] text-center text-[40px] leading-[40px] tracking-[-1.3px] text-[#181027]">
            {t('onboarding.welcomeTitle')}
          </Text>
          <Text className="font-inter-medium mt-4 max-w-[300px] text-center text-[24px] leading-8 text-[#807B89]">
            {t('onboarding.welcomeSubtitle')}
          </Text>
        </View>

        <View className="pb-4">
          <Pressable
            accessibilityRole="button"
            className="h-14 items-center justify-center rounded-2xl bg-[#181027] active:opacity-90"
            onPress={handleStartCheckIn}
          >
            <Text className="font-inter-medium text-[16px] text-[#ECECEC]">
              {t('onboarding.startCheckIn')}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            className="mt-3 h-12 items-center justify-center"
            onPress={() => router.push('/(auth)/sign-in')}
          >
            <Text className="font-inter-medium text-[16px] text-[#181027]">
              {t('onboarding.signIn')}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
