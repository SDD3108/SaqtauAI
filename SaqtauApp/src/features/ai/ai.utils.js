import { tNow } from '@/src/features/localization/localization.store';

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
  return messages
    .filter(
      (message) =>
        (message.role === 'user' || message.role === 'assistant') &&
        typeof message.content === 'string' &&
        message.content.trim(),
    )
    .slice(-AI_HISTORY_LIMIT)
    .map((message) => ({
      role: message.role,
      content: message.content.slice(0, 4000),
    }));
}

export function getAiErrorMessage(error) {
  if (error?.status === 429) return tNow('ai.errorBusy');
  if (error?.status === 401 || error?.status === 403) return tNow('ai.errorSession');
  if (
    error?.message === 'Network request failed' ||
    error?.message === 'Request timed out'
  ) {
    return tNow('ai.errorNetwork');
  }
  return error?.message || tNow('ai.errorGeneric');
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
