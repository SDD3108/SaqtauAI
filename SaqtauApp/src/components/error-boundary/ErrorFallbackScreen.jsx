import { RotateCcw, TriangleAlert } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import useI18n from '@/src/features/localization/hooks/useI18n';

export default function ErrorFallbackScreen({ onRetry }) {
  const { t } = useI18n();

  return (
    <SafeAreaView className="flex-1 bg-[#ECECEC] px-7" edges={['top', 'bottom']}>
      <View className="flex-1 items-center justify-center">
        <View className="h-20 w-20 items-center justify-center rounded-[26px] bg-white">
          <TriangleAlert size={34} color="#9A3C49" strokeWidth={1.8} />
        </View>
        <Text accessibilityRole="header" className="mt-7 text-center font-inter-extrabold text-[29px] text-[#181027]">
          {t('errorBoundary.title')}
        </Text>
        <Text className="mt-3 max-w-[330px] text-center font-inter-medium text-[15px] leading-[22px] text-[#807B89]">
          {t('errorBoundary.body')}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={onRetry}
        className="mb-4 h-[58px] flex-row items-center justify-center rounded-[18px] bg-[#181027] active:opacity-85"
      >
        <RotateCcw size={19} color="#FFFFFF" />
        <Text className="ml-2 font-inter-semibold text-[16px] text-white">
          {t('errorBoundary.retry')}
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}
