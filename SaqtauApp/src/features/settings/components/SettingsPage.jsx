import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import useI18n from '@/src/features/localization/hooks/useI18n';

export default function SettingsPage({
  title,
  subtitle,
  children,
  footer,
  keyboardShouldPersistTaps = 'handled',
}) {
  const { t } = useI18n();

  return (
    <SafeAreaView className="flex-1 bg-[#ECECEC]" edges={['top', 'left', 'right']}>
      <ScrollView
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 18,
          paddingBottom: 28,
        }}
      >
        <View className="w-full max-w-[560px] flex-1 self-center">
          <View className="mb-2 mt-5 flex-row items-center">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('common.back')}
              onPress={() => router.back()}
              className="h-11 w-11 items-center justify-center active:opacity-60"
            >
              <ChevronLeft size={31} strokeWidth={2.4} color="#181027" />
            </Pressable>
            <Text
              accessibilityRole="header"
              className="flex-1 text-center font-inter-bold text-[28px] tracking-[-0.8px] text-[#181027]"
            >
              {title}
            </Text>
            <View className="w-11" />
          </View>

          {subtitle ? (
            <Text className="mb-7 px-5 text-center font-inter-medium text-[15px] leading-[22px] text-[#918B9D]">
              {subtitle}
            </Text>
          ) : (
            <View className="mb-5" />
          )}

          {children}

          {footer ? <View className="mt-auto pt-10">{footer}</View> : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
