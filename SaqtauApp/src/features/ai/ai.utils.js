export const AI_HISTORY_LIMIT = 12;
export const AI_MESSAGE_LIMIT = 2000;

export function makeChatMessage(role, content, extra = {}) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    role,
    content: String(content || '').trim(),
    createdAt: new Date().toISOString(),
    ...extra,
  };
}

export function toApiHistory(messages) {
  // Only complete pairs: a failed/unanswered turn must not enter another prompt.
  const pairs = [];
  for (let i = 1; i < messages.length; i += 1) {
    const user = messages[i - 1];
    const answer = messages[i];
    if (user.role === 'user' && answer.role === 'assistant' && answer.replyTo === user.id) {
      pairs.push({ role: 'user', content: user.content.slice(0, AI_MESSAGE_LIMIT) },
        { role: 'assistant', content: answer.content.slice(0, 4000) });
    }
  }
  return pairs.slice(-AI_HISTORY_LIMIT);
}

export function getChatError(error) {
  const status = error?.status ?? 0;
  if (status === 401) return { key: 'ai.errorSession', retry: false };
  if (status === 403) return { key: 'ai.chatUnavailable', retry: false };
  if (status === 429) return { key: 'ai.errorBusy', retry: true };
  if (status === 0) return { key: 'ai.errorNetwork', retry: true };
  return { key: 'ai.errorGeneric', retry: status >= 500 || status === 408 };
}

export function isCheckInIntent(intent) {
  return [
    'checkin',
    'check_in',
    'start_checkin',
    'start_check_in',
    'measurement',
    'start_measurement',
  ].includes(intent);
}

export function isTrendsIntent(intent) {
  return ['trends', 'view_trends', 'history', 'view_history'].includes(intent);
}
