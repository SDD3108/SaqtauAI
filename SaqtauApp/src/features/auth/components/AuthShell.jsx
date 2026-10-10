import { ChevronLeft } from 'lucide-react-native';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Logo from '@/assets/images/Logo.svg';
import useI18n from '@/src/features/localization/hooks/useI18n';

export default function AuthShell({
  title,
  subtitle,
  step,
  onBack,
  children,
  footer,
}) {
  const { t } = useI18n();

  return (
    <SafeAreaView className="flex-1 bg-[#ECECEC]" edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="w-full max-w-[560px] flex-1 self-center px-6 pb-6 pt-3">
            <View className="h-12 flex-row items-center justify-between">
              {onBack ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('common.back')}
                  className="h-11 w-11 items-center justify-center rounded-full active:bg-black/5"
                  onPress={onBack}
                >
                  <ChevronLeft size={29} color="#807B89" />
                </Pressable>
              ) : (
                <View className="h-11 w-11" />
              )}

              <View className="flex-row items-center gap-2">
                <Logo width={29} height={29} />
                <Text className="font-inter-bold text-[16px] text-[#181027]">
                  SaqtauAI
                </Text>
              </View>

              <View className="h-11 w-11" />
            </View>

            {step ? (
              <Text className="mt-8 font-inter-semibold text-[13px] uppercase tracking-[1.4px] text-[#918B9D]">
                {step}
              </Text>
            ) : null}

            <Text
              accessibilityRole="header"
              className={`${step ? 'mt-3' : 'mt-10'} font-inter-extrabold text-[36px] leading-[42px] tracking-[-1.15px] text-[#181027]`}
            >
              {title}
            </Text>

            {subtitle ? (
              <Text className="mt-3 max-w-[390px] font-inter text-[16px] leading-6 text-[#807B89]">
                {subtitle}
              </Text>
            ) : null}

            <View className="mt-5">{children}</View>
            <View className="flex-1" />
            {footer ? <View className="mt-8">{footer}</View> : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
