import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { useOnboardingStore } from '@/features/onboarding/onboarding.store';

export default function CheckInEntryScreen() {
  const saveProfile = useOnboardingStore((state) => state.saveProfile);
  const completeFirstCheckIn = useOnboardingStore(
    (state) => state.completeFirstCheckIn,
  );

  const handleTemporaryFinish = async () => {
    await saveProfile({
      dateOfBirth: '2000-01-01',
      height: 170,
      weight: 65,
      units: 'metric',
    });
    await completeFirstCheckIn();
    router.replace('/(app)/(tabs)');
  };

  return (
    <View className="flex-1 items-center justify-center bg-[#ECECEC] px-8">
      <Text className="text-3xl font-bold text-[#181027]">Check-in setup</Text>
      <Text className="mt-3 text-center text-base text-[#807B89]">
        Temporary screen for testing the bootstrap flow.
      </Text>
      <Pressable
        className="mt-8 rounded-xl bg-[#181027] px-8 py-4"
        onPress={handleTemporaryFinish}
      >
        <Text className="font-semibold text-white">Temporary finish</Text>
      </Pressable>
    </View>
  );
}
