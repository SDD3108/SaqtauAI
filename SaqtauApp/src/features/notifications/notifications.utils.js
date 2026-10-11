import { getCurrentLocale, tNow } from '@/src/features/localization/localization.store';

function normalizeKind(value) {
  return String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
}

export function getNotificationKind(notification) {
  return normalizeKind(notification?.kind || notification?.type || notification?.data?.type || notification?.data?.kind);
}

function familyInviteToken(notification) {
  const data = notification?.data || {};
  return data.invite_token || data.family_invite_token || data.token || notification?.invite_token || '';
}

export function getNotificationDestination(notification) {
  const kind = getNotificationKind(notification);
  if (kind === 'measurement_ready' || kind === 'checkin_ready' || kind === 'check_in_ready') return '/(check-in)/result';
  if (kind.includes('result') || kind.includes('measurement')) return '/(app)/(tabs)/history';
  if (kind.includes('family') || kind.includes('invite')) {
    const token = familyInviteToken(notification);
    return token ? `/family/invite/${encodeURIComponent(String(token))}` : '/(app)/(tabs)/family';
  }
  if (kind.includes('reminder') || kind.includes('checkin') || kind.includes('check_in')) return '/(check-in)/permissions';
  return null;
}

export function notificationType(notification) { return getNotificationKind(notification); }

export function localDateKey(value) {
  const date = value instanceof Date ? value : new Date(value || Date.now());
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function isToday(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return false;
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
}

export function formatNotificationTime(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return '';
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const days = Math.floor((todayStart - dateStart) / 86400000);
  const locale = getCurrentLocale();

  if (days <= 0) return new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(date);
  if (days === 1) return tNow('common.yesterday');
  if (days < 7) return new Intl.RelativeTimeFormat(locale, { numeric: 'always' }).format(-days, 'day');
  return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(date);
}
