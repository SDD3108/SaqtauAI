import useI18n from '@/src/features/localization/hooks/useI18n';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, RotateCcw, Trash2 } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AIChatNavigation from '@/src/features/ai/components/AIChatNavigation';
import ChatBubble from '@/src/features/ai/components/ChatBubble';
import MessageComposer from '@/src/features/ai/components/MessageComposer';
import useAiChat from '@/src/features/ai/hooks/useAiChat';
import {
  isCheckInIntent,
  isTrendsIntent,
} from '@/src/features/ai/ai.utils';

function dateKey(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function DateSeparator({ value, locale, t }) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const label = dateKey(value) === dateKey(new Date()) ? t('ai.today')
    : dateKey(value) === dateKey(yesterday) ? t('ai.yesterday')
    : date.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
  return (
    <View className="mb-5 flex-row items-center gap-3">
      <View className="h-[1.5px] flex-1 rounded-full bg-[#807B89]" />
      <Text className="font-inter-medium text-[13px] leading-[19px] text-[#807B89]">{label}</Text>
      <View className="h-[1.5px] flex-1 rounded-full bg-[#807B89]" />
    </View>
  );
}

export default function AIChatScreen() {
  const { t, locale } = useI18n();
  const { prompt, autoSend } = useLocalSearchParams();
  const initialPrompt = Array.isArray(prompt) ? prompt[0] : prompt || '';
  const shouldAutoSend =
    (Array.isArray(autoSend) ? autoSend[0] : autoSend) === '1';

  const {
    messages,
    isSending,
    error,
    send,
    retry,
    clearConversation,
  } = useAiChat();

  const [draft, setDraft] = useState(
    shouldAutoSend ? '' : String(initialPrompt || ''),
  );
  const didAutoSend = useRef(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!shouldAutoSend || !initialPrompt || didAutoSend.current) {
      return;
    }

    didAutoSend.current = true;
    send(initialPrompt);
  }, [initialPrompt, send, shouldAutoSend]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 80);

    return () => clearTimeout(timeout);
  }, [messages.length, isSending, error]);

  const handleSend = async () => {
    const message = draft.trim();

    if (!message || isSending) {
      return;
    }

    setDraft('');
    const result = await send(message);

    if (isCheckInIntent(result?.intent)) {
      Alert.alert(
        t('ai.startPromptTitle'),
        t('ai.startPromptBody'),
        [
          { text: t('ai.notNow'), style: 'cancel' },
          {
            text: t('ai.start'),
            onPress: () => router.push('/(check-in)/permissions'),
          },
        ],
      );
    } else if (isTrendsIntent(result?.intent)) {
      Alert.alert(
        t('ai.openTrendsTitle'),
        t('ai.openTrendsBody'),
        [
          { text: t('ai.stayHere'), style: 'cancel' },
          {
            text: t('ai.openHistory'),
            onPress: () => router.push('/(app)/(tabs)/history'),
          },
        ],
      );
    }
  };

  const handleClear = () => {
    if (!messages.length) {
      return;
    }

    Alert.alert(
      t('ai.clearTitle'),
      t('ai.clearBody'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('ai.clear'),
          style: 'destructive',
          onPress: clearConversation,
        },
      ],
    );
  };

  const latestAssistantIndex = messages.reduce((last, message, index) => message.role === 'assistant' ? index : last, -1);

  return (
    <SafeAreaView className="flex-1 bg-[#ECECEC]" edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View className="w-full max-w-[620px] flex-row items-center self-center px-3 pb-0.5 pt-5">
          <Pressable accessibilityRole="button" accessibilityLabel={t('ai.goBack')} onPress={() => router.back()} className="h-11 w-11 items-center justify-center rounded-full active:opacity-60">
            <ChevronLeft size={28} strokeWidth={2.5} color="#8E879B" />
          </Pressable>
          <Text accessibilityRole="header" className="flex-1 px-1 text-center font-inter-semibold text-[26px] leading-[33px] tracking-[-0.7px] text-[#181027]">{t('ai.homeTitle')}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={t('ai.clearA11y')} onPress={handleClear} className="h-11 w-11 items-center justify-center rounded-full active:opacity-60">
            <Trash2 size={18} color="#8D8793" />
          </Pressable>
        </View>

        <ScrollView ref={scrollRef} className="flex-1" contentContainerStyle={{ alignItems: 'center', paddingHorizontal: 18, paddingTop: 0, paddingBottom: 18 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>
          <View className="w-full max-w-[584px]">
            {!messages.length && !isSending ? (
              <>
                <DateSeparator value={new Date()} locale={locale} t={t} />
                <View className="items-center rounded-[22px] bg-[#F7F7F8] px-5 py-10">
                  <Text className="text-center font-inter-semibold text-[26px] leading-[33px] text-[#181027]">{t('ai.emptyTitle')}</Text>
                  <Text className="mt-3 max-w-[310px] text-center font-inter text-[15px] leading-[22px] text-[#807B89]">{t('ai.emptyBody')}</Text>
                </View>
              </>
            ) : null}

            {messages.map((message, index) => (
              <View key={message.id}>
                {dateKey(message.createdAt) && (index === 0 || dateKey(message.createdAt) !== dateKey(messages[index - 1].createdAt)) ? <DateSeparator value={message.createdAt} locale={locale} t={t} /> : null}
                <ChatBubble
                  role={message.role}
                  content={message.content}
                  createdAt={message.createdAt}
                  answered={message.role === 'user' && messages[index + 1]?.role === 'assistant'}
                  showActions={message.role === 'assistant' && index === latestAssistantIndex}
                  onBreathing={() => send(t('ai.breathing'))}
                  onTrends={() => router.push('/(app)/(tabs)/history')}
                  disabled={isSending}
                />
              </View>
            ))}

            {isSending ? (
              <View className="mb-4 items-start" accessibilityLiveRegion="polite">
                <View className="flex-row items-center rounded-[22px] bg-[#F7F7F8] px-4 py-3">
                  <ActivityIndicator size="small" color="#181027" />
                  <Text className="ml-2 flex-shrink font-inter text-[14px] text-[#807B89]">{t('ai.thinking')}</Text>
                </View>
              </View>
            ) : null}

            {error ? (
              <View accessibilityLiveRegion="polite" className="mb-4 rounded-[20px] border border-[#F1CECE] bg-[#FFF7F7] p-4">
                <Text className="font-inter text-[14px] leading-5 text-[#8B3E3E]">{error}</Text>
                <Pressable accessibilityRole="button" onPress={retry} disabled={isSending} className="mt-3 min-h-11 flex-row items-center self-start rounded-full bg-white px-3 py-2 active:opacity-70">
                  <RotateCcw size={15} color="#181027" />
                  <Text className="ml-2 font-inter-semibold text-[13px] text-[#181027]">{t('common.retry')}</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        </ScrollView>

        <View className="w-full max-w-[620px] self-center bg-[#ECECEC] px-4 pb-2 pt-2">
          <MessageComposer value={draft} onChangeText={setDraft} onSend={handleSend} disabled={isSending} />
          <Text className="mt-2 px-3 text-center font-inter text-[10px] leading-[14px] text-[#9A949F]">{t('ai.sessionPrivacy')}</Text>
        </View>
        <AIChatNavigation />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
