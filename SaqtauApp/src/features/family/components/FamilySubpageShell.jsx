import useI18n from '@/src/features/localization/hooks/useI18n';
import { router } from 'expo-router';
import { ChevronLeft, RefreshCw } from 'lucide-react-native';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function FamilySubpageShell({
  title,
  subtitle,
  loading,
  error,
  onRetry,
  children,
  footer,
}) {
  const { t } = useI18n();
  return (
    <SafeAreaView className="flex-1 bg-[#ECECEC]" edges={['top']}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center px-5 pt-2">
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
            className="h-11 w-11 items-center justify-center rounded-full bg-white active:opacity-80"
          >
            <ChevronLeft size={23} color="#181027" />
          </Pressable>
          <View className="ml-4 flex-1 pr-2">
            <Text className="font-inter-extrabold text-[24px] tracking-[-0.6px] text-[#181027]">
              {title}
            </Text>
            {subtitle ? (
              <Text className="mt-1 font-inter-medium text-[13px] leading-[18px] text-[#807B89]">
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>

        {loading ? (
          <View className="min-h-[420px] items-center justify-center px-6">
            <ActivityIndicator color="#181027" />
          </View>
        ) : (
          <View className="px-5 pt-7">
            {error ? (
              <View className="mb-4 rounded-[20px] bg-[#F8ECEE] px-4 py-4">
                <Text className="font-inter-medium text-[13px] leading-[19px] text-[#8F4250]">
                  {error}
                </Text>
                {onRetry ? (
                  <Pressable
                    onPress={onRetry}
                    className="mt-3 flex-row items-center self-start rounded-full bg-white px-4 py-2.5 active:opacity-80"
                  >
                    <RefreshCw size={16} color="#181027" />
                    <Text className="ml-2 font-inter-semibold text-[13px] text-[#181027]">
                      {t('common.retry')}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
            {children}
            {footer || null}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
