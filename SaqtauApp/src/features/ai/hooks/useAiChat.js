import { useCallback } from 'react';

import { useAuthStore } from '@/src/features/auth/auth.store';
import { getCurrentLanguage } from '@/src/features/localization/localization.store';
import {
  classifyAiIntent,
  sendAiMessage,
} from '@/src/features/ai/ai.api';
import { getAiWellnessContext } from '@/src/features/ai/ai.context';
import { useAiStore } from '@/src/features/ai/ai.store';
import {
  AI_MESSAGE_LIMIT,
  getAiErrorMessage,
  toApiHistory,
} from '@/src/features/ai/ai.utils';

export default function useAiChat() {
  const accountId = useAuthStore((state) => state.account?.id);
  const messages = useAiStore((state) => state.messages);
  const isSending = useAiStore((state) => state.isSending);
  const error = useAiStore((state) => state.error);
  const lastFailedMessage = useAiStore((state) => state.lastFailedMessage);
  const addUserMessage = useAiStore((state) => state.addUserMessage);
  const addAssistantMessage = useAiStore((state) => state.addAssistantMessage);
  const setSending = useAiStore((state) => state.setSending);
  const setError = useAiStore((state) => state.setError);
  const setLastFailedMessage = useAiStore((state) => state.setLastFailedMessage);
  const clearConversation = useAiStore((state) => state.clearConversation);

  const send = useCallback(
    async (rawMessage, { addUser = true } = {}) => {
      const message = String(rawMessage || '').trim().slice(0, AI_MESSAGE_LIMIT);

      if (!message || isSending) {
        return null;
      }

      const historyBeforeSend = useAiStore.getState().messages;

      if (addUser) {
        addUserMessage(message);
      }

      setSending(true);
      setError('');
      setLastFailedMessage('');

      try {
        const context = await getAiWellnessContext(accountId).catch(() => null);
        const history = toApiHistory(historyBeforeSend);

        const [chatResult, intentResult] = await Promise.all([
          sendAiMessage({
            message,
            lang: getCurrentLanguage(),
            context,
            history,
          }),
          classifyAiIntent(message, getCurrentLanguage()).catch(() => null),
        ]);

        addAssistantMessage(chatResult.text, {
          intent: intentResult?.intent || '',
        });

        return {
          text: chatResult.text,
          intent: intentResult?.intent || '',
        };
      } catch (sendError) {
        setError(getAiErrorMessage(sendError));
        setLastFailedMessage(message);
        return null;
      } finally {
        setSending(false);
      }
    },
    [
      accountId,
      addAssistantMessage,
      addUserMessage,
      isSending,
      setError,
      setLastFailedMessage,
      setSending,
    ],
  );

  const retry = useCallback(() => {
    if (!lastFailedMessage || isSending) {
      return;
    }

    send(lastFailedMessage, { addUser: false });
  }, [isSending, lastFailedMessage, send]);

  return {
    messages,
    isSending,
    error,
    lastFailedMessage,
    send,
    retry,
    clearConversation,
  };
}
