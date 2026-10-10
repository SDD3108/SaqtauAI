import useI18n from '@/src/features/localization/hooks/useI18n';
import { router } from 'expo-router';
import { ArrowUp } from 'lucide-react-native';
import { Pressable, TextInput, View } from 'react-native';
import RecordVoiceIcon from '@/assets/images/record voice.svg';
import ChatArtwork from '@/src/features/ai/components/ChatArtwork';
import { AI_MESSAGE_LIMIT } from '@/src/features/ai/ai.utils';

export default function MessageComposer({ value, onChangeText, onSend, disabled }) {
  const { t } = useI18n();
  const hasDraft = value.trim().length > 0;
  const canSend = hasDraft && !disabled;
  return (
    <View className="min-h-[62px] flex-row items-end rounded-[19px] border border-[#B1B1B1] bg-[#ECECEC] py-2 pl-3 pr-2">
      {hasDraft ? (
        <Pressable accessibilityRole="button" accessibilityLabel={t('ai.recordVoice')} accessibilityState={{ disabled }} disabled={disabled} onPress={() => router.push('/(app)/ai/voice')} className="h-11 w-9 items-center justify-center active:opacity-60">
          <ChatArtwork asset={RecordVoiceIcon} nativeWidth={43} nativeHeight={54} width={14} />
        </Pressable>
      ) : null}
      <TextInput
        accessibilityLabel={t('ai.messagePlaceholder')}
        value={value}
        onChangeText={onChangeText}
        editable={!disabled}
        multiline
        maxLength={AI_MESSAGE_LIMIT}
        placeholder={t('ai.messagePlaceholder')}
        placeholderTextColor="#807B89"
        returnKeyType="default"
        className="max-h-[120px] min-h-11 flex-1 px-1 py-[11px] font-inter-medium text-[16px] leading-[22px] text-[#181027]"
        style={{ textAlignVertical: 'top' }}
      />
      {hasDraft ? (
        <Pressable accessibilityRole="button" accessibilityLabel={t('ai.sendMessage')} accessibilityState={{ disabled: !canSend }} disabled={!canSend} onPress={onSend} className={`ml-2 h-11 w-11 items-center justify-center rounded-[18px] bg-[#181027] active:opacity-70 ${canSend ? '' : 'opacity-50'}`}>
          <ArrowUp size={25} strokeWidth={2.5} color="white" />
        </Pressable>
      ) : (
        <Pressable accessibilityRole="button" accessibilityLabel={t('ai.recordVoice')} accessibilityState={{ disabled }} disabled={disabled} onPress={() => router.push('/(app)/ai/voice')} className={`ml-2 h-11 w-11 items-center justify-center rounded-[18px] bg-[#D9D9D9] active:opacity-60 ${disabled ? 'opacity-50' : ''}`}>
          <ChatArtwork asset={RecordVoiceIcon} nativeWidth={43} nativeHeight={54} width={16} />
        </Pressable>
      )}
    </View>
  );
}
