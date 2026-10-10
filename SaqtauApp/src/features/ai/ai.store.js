import { create } from 'zustand';

import { makeChatMessage } from '@/src/features/ai/ai.utils';

export const useAiStore = create((set, get) => ({
  messages: [],
  isSending: false,
  error: '',
  lastFailedMessage: '',

  addUserMessage: (content) => {
    const message = makeChatMessage('user', content);
    set((state) => ({ messages: [...state.messages, message] }));
    return message;
  },

  addAssistantMessage: (content, extra = {}) => {
    const message = makeChatMessage('assistant', content, extra);
    set((state) => ({ messages: [...state.messages, message] }));
    return message;
  },

  setSending: (isSending) => set({ isSending }),
  setError: (error) => set({ error }),
  setLastFailedMessage: (lastFailedMessage) => set({ lastFailedMessage }),

  clearConversation: () =>
    set({
      messages: [],
      isSending: false,
      error: '',
      lastFailedMessage: '',
    }),

  getMessages: () => get().messages,
}));
