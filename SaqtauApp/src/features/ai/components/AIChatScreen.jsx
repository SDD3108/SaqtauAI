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

import ChatBubble from '@/src/features/ai/components/ChatBubble';
import MessageComposer from '@/src/features/ai/components/MessageComposer';
import useAiChat from '@/src/features/ai/hooks/useAiChat';
import {
  isCheckInIntent,
  isTrendsIntent,
} from '@/src/features/ai/ai.utils';

export default function AIChatScreen() {
  const { t } = useI18n();
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

  return (
    <SafeAreaView className="flex-1 bg-[#ECECEC]" edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View className="flex-row items-center px-4 pb-3 pt-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('ai.goBack')}
            onPress={() => router.back()}
            className="h-11 w-11 items-center justify-center rounded-full bg-white active:opacity-70"
          >
            <ChevronLeft size={24} color="#181027" />
          </Pressable>

          <View className="flex-1 px-3">
            <Text className="font-inter-extrabold text-[20px] text-[#181027]">
              SaqtauAI
            </Text>
            <Text className="mt-0.5 font-inter text-[12px] text-[#8D8793]">
              {t('ai.chatSubtitle')}
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('ai.clearA11y')}
            onPress={handleClear}
            className="h-11 w-11 items-center justify-center rounded-full active:opacity-60"
          >
            <Trash2 size={20} color="#8D8793" />
          </Pressable>
        </View>

        <ScrollView
          ref={scrollRef}
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: 18,
            paddingTop: 14,
            paddingBottom: 18,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {!messages.length && !isSending ? (
            <View className="items-center px-5 pt-12">
              <Text className="text-center font-inter-extrabold text-[28px] leading-[34px] text-[#181027]">
                {t('ai.emptyTitle')}
              </Text>
              <Text className="mt-3 max-w-[310px] text-center font-inter text-[15px] leading-[22px] text-[#817B87]">
                {t('ai.emptyBody')}
              </Text>
            </View>
          ) : null}

          {messages.map((message) => (
            <ChatBubble
              key={message.id}
              role={message.role}
              content={message.content}
            />
          ))}

          {isSending ? (
            <View className="mb-4 items-start">
              <View className="flex-row items-center rounded-[22px] rounded-bl-[7px] bg-white px-4 py-3">
                <ActivityIndicator size="small" color="#208AEF" />
                <Text className="ml-2 font-inter text-[14px] text-[#77717F]">
                  {t('ai.thinking')}
                </Text>
              </View>
            </View>
          ) : null}

          {error ? (
            <View className="mb-4 rounded-[20px] border border-[#F1CECE] bg-[#FFF7F7] p-4">
              <Text className="font-inter text-[14px] leading-5 text-[#8B3E3E]">
                {error}
              </Text>
              <Pressable
                onPress={retry}
                disabled={isSending}
                className="mt-3 flex-row items-center self-start rounded-full bg-white px-3 py-2 active:opacity-70"
              >
                <RotateCcw size={15} color="#208AEF" />
                <Text className="ml-2 font-inter-semibold text-[13px] text-[#208AEF]">
                  {t('common.retry')}
                </Text>
              </Pressable>
            </View>
          ) : null}
        </ScrollView>

        <View className="border-t border-[#DFDCE1] bg-[#ECECEC] px-4 pb-2 pt-3">
          <MessageComposer
            value={draft}
            onChangeText={setDraft}
            onSend={handleSend}
            disabled={isSending}
          />
          <Text className="mt-2 px-3 text-center font-inter text-[11px] leading-4 text-[#9A949F]">
            {t('ai.sessionPrivacy')}
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
