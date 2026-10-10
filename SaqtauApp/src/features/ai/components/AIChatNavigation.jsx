import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import HomeIcon from '@/assets/images/home.svg';
import HistoryIcon from '@/assets/images/history.svg';
import FamilyIcon from '@/assets/images/family.svg';
import AiIcon from '@/assets/images/ai_active.svg';
import SettingsIcon from '@/assets/images/settings.svg';
import { useAuthStore } from '@/src/features/auth/auth.store';
import useI18n from '@/src/features/localization/hooks/useI18n';

const tabs = [
  { key: 'home', route: '/(app)/(tabs)', icon: HomeIcon },
  { key: 'history', route: '/(app)/(tabs)/history', icon: HistoryIcon },
  { key: 'family', route: '/(app)/(tabs)/family', icon: FamilyIcon, account: true },
  { key: 'ai', route: '/(app)/(tabs)/ai', icon: AiIcon, account: true },
  { key: 'settings', route: '/(app)/(tabs)/settings', icon: SettingsIcon },
];

export default function AIChatNavigation({ disabled = false, onNavigate, onNavigationError }) {
  const { t } = useI18n();
  const isGuest = useAuthStore((state) => state.isGuest);
  const [navigating, setNavigating] = useState(false);
  const blocked = disabled || navigating;
  const navigate = async (route, account) => {
    if (blocked) return;
    setNavigating(true);
    try {
      if (onNavigate && await onNavigate() === false) return;
      if (account && isGuest) router.push('/(auth)/sign-in');
      else router.replace(route);
    } catch (error) {
      onNavigationError?.(error);
    } finally {
      setNavigating(false);
    }
  };
  return (
    <View className="border-t border-[#AAA4B1] bg-[#ECECEC]">
      <View className="w-full max-w-[620px] flex-row self-center pt-2">
        {tabs.map(({ key, route, icon: Icon, account }) => (
          <Pressable key={key} accessibilityRole="tab" accessibilityLabel={t(`tabs.${key}`)} accessibilityState={{ selected: key === 'ai', disabled: blocked }} disabled={blocked} onPress={() => navigate(route, account)} className={`min-h-[58px] flex-1 items-center justify-center gap-1 px-1 pb-2 active:opacity-60 ${blocked ? 'opacity-50' : ''}`}>
            <Icon width={24} height={24} />
            <Text className="text-center font-inter-medium text-[11px] leading-[15px] text-[#181027]">{t(`tabs.${key}`)}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
