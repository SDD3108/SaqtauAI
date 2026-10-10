import { router, Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AiIcon from '@/assets/images/ai.svg';
import AiActiveIcon from '@/assets/images/ai_active.svg';
import FamilyIcon from '@/assets/images/family.svg';
import FamilyActiveIcon from '@/assets/images/family_active.svg';
import HistoryIcon from '@/assets/images/history.svg';
import HistoryActiveIcon from '@/assets/images/history_active.svg';
import HomeIcon from '@/assets/images/home.svg';
import HomeActiveIcon from '@/assets/images/home_active.svg';
import SettingsIcon from '@/assets/images/settings.svg';
import { useAuthStore } from '@/src/features/auth/auth.store';
import useI18n from '@/src/features/localization/hooks/useI18n';

const ICON_SIZE = 24;

function TabIcon({ focused, Icon, ActiveIcon }) {
  const Component = focused ? ActiveIcon || Icon : Icon;
  return <Component width={ICON_SIZE} height={ICON_SIZE} />;
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const isGuest = useAuthStore((state) => state.isGuest);
  const { t } = useI18n();

  const requireAccount = {
    tabPress: (event) => {
      if (!isGuest) {
        return;
      }

      event.preventDefault();
      router.push('/(auth)/sign-in');
    },
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#181027',
        tabBarInactiveTintColor: '#8D8793',
        tabBarLabelStyle: {
          fontFamily: 'Inter_500Medium',
          fontSize: 11,
          marginTop: 3,
        },
        tabBarStyle: {
          height: 58 + insets.bottom,
          paddingTop: 7,
          paddingBottom: Math.max(insets.bottom, 7),
          backgroundColor: '#ECECEC',
          borderTopWidth: 0,
          elevation: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} Icon={HomeIcon} ActiveIcon={HomeActiveIcon} />
          ),
        }}
      />

      <Tabs.Screen
        name="history"
        options={{
          title: t('tabs.history'),
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              Icon={HistoryIcon}
              ActiveIcon={HistoryActiveIcon}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="family"
        listeners={requireAccount}
        options={{
          title: t('tabs.family'),
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              Icon={FamilyIcon}
              ActiveIcon={FamilyActiveIcon}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="ai"
        listeners={requireAccount}
        options={{
          title: t('tabs.ai'),
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} Icon={AiIcon} ActiveIcon={AiActiveIcon} />
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: t('tabs.settings'),
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} Icon={SettingsIcon} ActiveIcon={SettingsIcon} />
          ),
        }}
      />

      <Tabs.Screen name="activity" options={{ href: null }} />
      <Tabs.Screen name="account" options={{ href: null }} />
    </Tabs>
  );
}
