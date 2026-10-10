import { CheckCheck, ChevronRight } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import AirIcon from '@/assets/images/air.svg';
import StatsIcon from '@/assets/images/stats.svg';
import ChatArtwork from '@/src/features/ai/components/ChatArtwork';
import useI18n from '@/src/features/localization/hooks/useI18n';

function ResponseAction({ icon, nativeWidth, nativeHeight, label, onPress, disabled }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} className={`min-h-[51px] flex-row items-center rounded-[11px] border border-[#B6B6B6] px-4 py-3 active:opacity-60 ${disabled ? 'opacity-50' : ''}`}>
      <ChatArtwork asset={icon} nativeWidth={nativeWidth} nativeHeight={nativeHeight} width={24} />
      <Text className="mx-3 flex-1 font-inter-medium text-[14px] leading-[20px] text-[#181027]">{label}</Text>
      <ChevronRight size={18} strokeWidth={2.5} color="#807B89" />
    </Pressable>
  );
}

export default function ChatBubble({ role, content, createdAt, answered = false, showActions = false, onBreathing, onTrends, disabled = false }) {
  const { t, locale } = useI18n();
  const isUser = role === 'user';
  const date = createdAt ? new Date(createdAt) : null;
  const time = date && !Number.isNaN(date.getTime()) ? date.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' }) : '';

  return (
    <View className={`mb-5 ${isUser ? 'items-end' : 'items-start'}`}>
      <View
        className={isUser ? 'rounded-[20px] rounded-br-[5px] bg-[#DCDCDC] px-5 py-4' : 'rounded-[22px] bg-[#F7F7F8] px-4 py-5'}
        style={{ maxWidth: isUser ? '66%' : '92%', ...(showActions ? { width: '92%' } : {}) }}
      >
        <Text className={`font-inter-medium text-[#181027] ${isUser ? 'text-[17px] leading-[23px]' : 'px-4 text-[16px] leading-[23px]'}`} selectable>
          {content}
        </Text>
        {!isUser && showActions ? (
          <View className="mt-7 gap-2">
            <ResponseAction icon={AirIcon} nativeWidth={69} nativeHeight={55} label={t('ai.breathing')} onPress={onBreathing} disabled={disabled} />
            <ResponseAction icon={StatsIcon} nativeWidth={65} nativeHeight={62} label={t('ai.trends')} onPress={onTrends} disabled={disabled} />
          </View>
        ) : null}
      </View>
      {time ? (
        <View className={`mt-2 flex-row items-center gap-2 ${isUser ? 'pr-1' : 'pl-2'}`}>
          <Text className="font-inter-medium text-[12px] leading-[18px] text-[#807B89]">{time}</Text>
          {isUser && answered ? <CheckCheck size={16} strokeWidth={2} color="#807B89" accessibilityElementsHidden /> : null}
        </View>
      ) : null}
    </View>
  );
}
