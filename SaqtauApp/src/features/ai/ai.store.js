import { create } from 'zustand';

import { useAuthStore } from '@/src/features/auth/auth.store';
import { getCurrentLanguage } from '@/src/features/localization/localization.store';
import { getApiToken } from '@/src/services/api/client';
import { sendAiMessage } from './ai.api';
import { AI_MESSAGE_LIMIT, getChatError, makeChatMessage, toApiHistory } from './ai.utils';

const fresh = () => ({
  messages: [], mode: null, pending: null, failed: null, errorKey: '',
});

export const useAiStore = create((set, get) => ({
  ...fresh(),
  clearConversation: () => set(fresh()),
  chooseMode: (mode) => {
    if (get().mode === null && (mode === 'chat' || mode === 'checkins')) set({ mode });
  },
}));

// Keep the home screen, chat, and any in-flight replies isolated across sessions.
useAuthStore.subscribe((next, prev) => {
  if (next.token !== prev.token || next.account?.id !== prev.account?.id) {
    useAiStore.getState().clearConversation();
  }
});

async function runTurn(turn) {
  const token = getApiToken();
  const accountId = useAuthStore.getState().account?.id;
  if (!token || token !== useAuthStore.getState().token) {
    useAiStore.setState({ errorKey: 'ai.errorSession', failed: null });
    return null;
  }
  const current = () => useAiStore.getState().pending === turn
    && getApiToken() === token && useAuthStore.getState().account?.id === accountId;
  useAiStore.setState({ pending: turn, errorKey: '', failed: null });
  try {
    const reply = await sendAiMessage(turn);
    if (!current()) return null;
    useAiStore.setState((s) => ({
      pending: null,
      messages: [...s.messages, makeChatMessage('assistant', reply.text, {
        intent: reply.intent, replyTo: turn.request_id,
      })],
    }));
    return reply;
  } catch (error) {
    if (current()) {
      const issue = getChatError(error);
      useAiStore.setState({ pending: null, errorKey: issue.key, failed: issue.retry ? turn : null });
    }
    return null;
  }
}

export function sendChat(rawText) {
  const state = useAiStore.getState();
  const text = String(rawText ?? '').trim().slice(0, AI_MESSAGE_LIMIT);
  if (!text || !state.mode || state.pending) return null;
  const message = makeChatMessage('user', text);
  const turn = {
    request_id: message.id, message: text, lang: getCurrentLanguage(),
    include_checkins: state.mode === 'checkins',
    history: toApiHistory(state.messages),
  };
  useAiStore.setState({ messages: [...state.messages, message] });
  return runTurn(turn);
}

export function retryChat() {
  const { failed, pending } = useAiStore.getState();
  return failed && !pending ? runTurn(failed) : null;
}
