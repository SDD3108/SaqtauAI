import { Text, View } from 'react-native';

import { useAuthStore } from '@/features/auth/auth.store';

export default function HomeScreen() {
  const account = useAuthStore((state) => state.account);
  const isGuest = useAuthStore((state) => state.isGuest);

  const name = isGuest ? null : account?.display_name?.trim();
  const greeting = name ? `Good morning, ${name}` : 'Good morning';

  return (
    <View className="flex-1 bg-[#ECECEC] px-8 pt-24">
      <Text className="text-4xl font-extrabold text-[#181027]">{greeting}</Text>
      <Text className="mt-4 text-lg text-[#807B89]">
        Bootstrap is working. Dashboard design comes next.
      </Text>
    </View>
  );
}
