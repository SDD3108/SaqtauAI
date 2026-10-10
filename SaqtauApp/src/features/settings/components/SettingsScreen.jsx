import { router } from 'expo-router';
import { ChevronLeft, ChevronRight, Info, Languages } from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import NotificationsIcon from '@/assets/images/notifications.svg';
import PrivacyIcon from '@/assets/images/privacy.svg';
import ProfileIcon from '@/assets/images/profile.svg';
import SupportIcon from '@/assets/images/support.svg';
import YourChoiceIcon from '@/assets/images/your choice.svg';
import { useAuthStore } from '@/src/features/auth/auth.store';
import useI18n from '@/src/features/localization/hooks/useI18n';
import {
  unreadCount,
  useNotificationsStore,
} from '@/src/features/notifications/notifications.store';

export default function SettingsScreen() {
  const isGuest = useAuthStore((state) => state.isGuest);
  const count = useNotificationsStore(unreadCount);
  const { language, t } = useI18n();

  const languageLabel =
    language === 'ru' ? 'Русский' : language === 'kk' ? 'Қазақша' : 'English';

  const rows = [
    isGuest
      ? {
          title: t('settings.signIn'),
          subtitle: t('settings.signInSubtitle'),
          Icon: ProfileIcon,
          route: '/(auth)/sign-in',
        }
      : {
          title: t('settings.account'),
          subtitle: t('settings.accountSubtitle'),
          Icon: ProfileIcon,
          route: '/(app)/settings/account',
        },
    {
      title: t('settings.profile'),
      subtitle: isGuest
        ? t('settings.profileGuestSubtitle')
        : t('settings.profileSubtitle'),
      Icon: ProfileIcon,
      route: '/(app)/settings/profile',
    },
    {
      title: t('settings.privacy'),
      subtitle: t('settings.privacySubtitle'),
      Icon: PrivacyIcon,
      route: '/(app)/settings/privacy',
    },
    {
      title: t('settings.notifications'),
      subtitle: t('settings.notificationsSubtitle'),
      Icon: NotificationsIcon,
      route: '/(app)/notifications',
      count,
    },
    {
      title: t('settings.permissions'),
      subtitle: t('settings.permissionsSubtitle'),
      Icon: YourChoiceIcon,
      route: '/(app)/settings/permissions',
    },
    {
      title: t('settings.language'),
      subtitle: languageLabel,
      LucideIcon: Languages,
      route: '/(app)/settings/language',
    },
    ...(!isGuest
      ? [
          {
            title: t('settings.family'),
            subtitle: t('settings.familySubtitle'),
            Icon: ProfileIcon,
            route: '/(app)/(tabs)/family',
          },
        ]
      : []),
    {
      title: t('settings.about'),
      subtitle: t('settings.aboutSubtitle'),
      LucideIcon: Info,
      route: '/(app)/settings/about',
    },
    {
      title: t('settings.help'),
      subtitle: t('settings.helpSubtitle'),
      Icon: SupportIcon,
      route: '/(app)/settings/about',
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-[#ECECEC]" edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 16,
          paddingBottom: 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full max-w-[560px] flex-1 self-center">
          <View className="mb-5 mt-7 flex-row items-center">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('settings.backHome')}
              hitSlop={8}
              className="h-11 w-11 items-center justify-center"
              onPress={() => router.replace('/(app)/(tabs)')}
            >
              <ChevronLeft size={30} color="#9A95A5" />
            </Pressable>
            <Text
              accessibilityRole="header"
              className="flex-1 text-center font-inter-extrabold text-[36px] text-[#181027]"
            >
              {t('settings.title')}
            </Text>
            <View className="w-11" />
          </View>

          <Text className="mb-6 text-center font-inter-medium text-[15px] leading-[22px] text-[#87828F]">
            {isGuest ? t('settings.subtitleGuest') : t('settings.subtitleAccount')}
          </Text>

          <View className="rounded-[18px] bg-[#F7F7F8] px-3 py-2">
            {rows.map(({ title, subtitle, Icon, LucideIcon, route, count: badge }) => (
              <Pressable
                key={`${route}-${title}`}
                accessibilityRole="button"
                accessibilityLabel={`${title}${badge ? `, ${t('settings.unread', { count: badge })}` : ''}`}
                onPress={route ? () => router.push(route) : undefined}
                className="min-h-[76px] flex-row items-center gap-4 py-3 active:opacity-70"
              >
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#181027]">
                  {Icon ? <Icon width={21} height={24} /> : <LucideIcon size={21} color="#FFFFFF" />}
                </View>
                <View className="min-w-0 flex-1">
                  <Text className="font-inter-semibold text-[17px] leading-[23px] text-[#181027]">
                    {title}
                  </Text>
                  <Text className="mt-1 font-inter-medium text-[12px] leading-[18px] text-[#918B9D]">
                    {subtitle}
                  </Text>
                </View>
                {badge > 0 ? (
                  <View className="min-w-6 items-center rounded-full bg-[#181027] px-1.5 py-1">
                    <Text className="font-inter-semibold text-[10px] text-white">
                      {badge > 99 ? '99+' : badge}
                    </Text>
                  </View>
                ) : null}
                <ChevronRight size={24} color="#9A95A5" />
              </Pressable>
            ))}
          </View>

          <Text className="mt-auto px-6 pt-16 text-center font-inter-medium text-[14px] leading-[21px] text-[#918B9D]">
            {t('settings.footer')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
