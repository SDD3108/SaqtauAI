import { Accessibility, ChevronRight, ShieldCheck } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import useI18n from '@/src/features/localization/hooks/useI18n';

export function AccurateReadingCard() {
  const { t } = useI18n();
  return (
    <View className="mt-3 min-h-[116px] flex-row items-center rounded-[15px] border border-[#B7B2BD] px-4 py-3">
      <View className="h-[82px] w-[82px] items-center justify-center rounded-[14px] bg-[#E6E5E6]">
        <Accessibility size={46} strokeWidth={1.8} color="#181027" />
      </View>
      <View className="ml-4 flex-1">
        <Text className="font-inter-medium text-[17px] text-[#181027]">{t('dashboard.tipsTitle')}</Text>
        <Text className="mt-1 font-inter-medium text-[13px] leading-[18px] text-[#8E879B]">{t('dashboard.tipsBody')}</Text>
        <View className="mt-2 flex-row items-center">
          <Text className="font-inter-medium text-[13px] text-[#181027]">{t('dashboard.learnHow')}</Text>
          <ChevronRight size={15} strokeWidth={2} color="#181027" />
        </View>
      </View>
    </View>
  );
}

export function PrivacyCard() {
  const { t } = useI18n();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('dashboard.privacyTitle')}
      className="mt-3 min-h-[82px] flex-row items-center rounded-[15px] border border-[#B7B2BD] px-4 py-3 active:opacity-80"
      onPress={() => {}}
    >
      <View className="h-[54px] w-[54px] items-center justify-center rounded-full bg-[#E1E0E2]">
        <ShieldCheck size={28} strokeWidth={1.7} color="#181027" />
      </View>
      <View className="ml-4 flex-1">
        <Text className="font-inter-medium text-[17px] text-[#181027]">{t('dashboard.privacyTitle')}</Text>
        <Text className="mt-1 font-inter-medium text-[13px] leading-[18px] text-[#8E879B]">{t('dashboard.privacyBody')}</Text>
      </View>
      <ChevronRight size={22} strokeWidth={2} color="#181027" />
    </Pressable>
  );
}
