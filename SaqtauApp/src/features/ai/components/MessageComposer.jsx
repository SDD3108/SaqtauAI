import useI18n from '@/src/features/localization/hooks/useI18n';
import { router } from 'expo-router';
import { Pressable, TextInput, View } from 'react-native';

import RecordVoiceIcon from '@/assets/images/record voice.svg';
import SendIcon from '@/assets/images/send.svg';
import { AI_MESSAGE_LIMIT } from '@/src/features/ai/ai.utils';

export default function MessageComposer({
  value,
  onChangeText,
  onSend,
  disabled,
}) {
  const { t } = useI18n();
  const canSend = value.trim().length > 0 && !disabled;

  return (
    <View className="flex-row items-end rounded-[24px] border border-[#E2DFE4] bg-white px-3 py-2">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('ai.recordVoice')}
        disabled={disabled}
        onPress={() => router.push('/(app)/ai/voice')}
        className="mb-1 h-10 w-10 items-center justify-center rounded-full active:opacity-60"
      >
        <RecordVoiceIcon width={22} height={22} />
      </Pressable>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        editable={!disabled}
        multiline
        maxLength={AI_MESSAGE_LIMIT}
        placeholder={t('ai.messagePlaceholder')}
        placeholderTextColor="#9B96A0"
        returnKeyType="default"
        className="max-h-[120px] min-h-10 flex-1 px-2 py-[9px] font-inter text-[16px] leading-[22px] text-[#181027]"
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('ai.sendMessage')}
        disabled={!canSend}
        onPress={onSend}
        className={`mb-1 h-10 w-10 items-center justify-center rounded-full ${
          canSend ? 'bg-[#208AEF]' : 'bg-[#D8D4DB]'
        }`}
      >
        <SendIcon width={19} height={19} />
      </Pressable>
    </View>
  );
}
