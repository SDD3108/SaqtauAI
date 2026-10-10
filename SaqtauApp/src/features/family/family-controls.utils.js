import { getCurrentLocale, tNow } from '@/src/features/localization/localization.store';

export const DEFAULT_PERMISSIONS = {
  voice_conversations: false,
  content_safety: false,
};

export const DEFAULT_SCREEN_TIME = {
  daily_limit_minutes: null,
  quiet_hours: {
    enabled: false,
    from: '22:00',
    to: '07:00',
  },
};

export const DEFAULT_PRIVACY = {
  share_results: false,
  share_activity: false,
  allow_voice: false,
};

function objectOrEmpty(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function asBoolean(value, fallback = false) {
  return typeof value === 'boolean' ? value : fallback;
}

function normalizeTime(value, fallback) {
  const text = String(value || '').trim();
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(text) ? text : fallback;
}

export function normalizePermissionsResponse(payload) {
  const root = objectOrEmpty(payload);
  const source = objectOrEmpty(root.permissions || root.data || root);

  return {
    permissions: {
      voice_conversations: asBoolean(
        source.voice_conversations,
        DEFAULT_PERMISSIONS.voice_conversations,
      ),
      content_safety: asBoolean(
        source.content_safety,
        DEFAULT_PERMISSIONS.content_safety,
      ),
    },
    updatedAt: root.updated_at || source.updated_at || null,
  };
}

export function normalizeScreenTimeResponse(payload) {
  const root = objectOrEmpty(payload);
  const source = objectOrEmpty(root.screen_time || root.data || root);
  const quiet = objectOrEmpty(source.quiet_hours);
  const rawLimit = source.daily_limit_minutes;
  const numericLimit = Number(rawLimit);

  return {
    screenTime: {
      daily_limit_minutes:
        rawLimit === null || rawLimit === undefined || rawLimit === ''
          ? null
          : Number.isFinite(numericLimit)
            ? Math.max(0, Math.round(numericLimit))
            : null,
      quiet_hours: {
        enabled: asBoolean(quiet.enabled, false),
        from: normalizeTime(quiet.from, DEFAULT_SCREEN_TIME.quiet_hours.from),
        to: normalizeTime(quiet.to, DEFAULT_SCREEN_TIME.quiet_hours.to),
      },
    },
    updatedAt: root.updated_at || source.updated_at || null,
  };
}

export function normalizePrivacyResponse(payload) {
  const root = objectOrEmpty(payload);
  const source = objectOrEmpty(root.privacy || root.data || root);

  return {
    privacy: {
      share_results: asBoolean(source.share_results, DEFAULT_PRIVACY.share_results),
      share_activity: asBoolean(source.share_activity, DEFAULT_PRIVACY.share_activity),
      allow_voice: asBoolean(source.allow_voice, DEFAULT_PRIVACY.allow_voice),
    },
    updatedAt: root.updated_at || source.updated_at || null,
  };
}

export function normalizeActivityResponse(payload, range = '7d') {
  const root = objectOrEmpty(payload);
  const rawEvents = Array.isArray(root.events)
    ? root.events
    : Array.isArray(payload)
      ? payload
      : [];

  return {
    range: root.range || range,
    events: rawEvents.map(normalizeActivityEvent).filter(Boolean),
  };
}

export function normalizeActivityEvent(event, index = 0) {
  if (!event || typeof event !== 'object') {
    return null;
  }

  const occurredAt =
    event.occurred_at || event.created_at || event.timestamp || event.at || null;

  return {
    id: String(event.id || event.uuid || `${occurredAt || 'event'}-${index}`),
    kind: String(event.kind || event.type || 'activity'),
    title: String(event.title || event.name || 'Family activity'),
    detail: String(event.detail || event.body || event.message || ''),
    occurredAt,
    metadata: objectOrEmpty(event.metadata),
  };
}

export function familyControlsErrorMessage(error, fallback) {
  if (error?.status === 403) {
    return tNow('family.onlyGuardian');
  }
  if (error?.status === 404 || error?.status === 405) {
    return tNow('family.settingUnavailable');
  }
  return error?.message || fallback;
}

export function formatUpdatedAt(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(getCurrentLocale(), {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatMinutes(total) {
  if (total === null || total === undefined || total === '') return tNow('common.notSet');
  const minutes = Number(total);
  if (!Number.isFinite(minutes)) return tNow('common.notSet');
  if (minutes <= 0) return tNow('common.minutesShort', { count: 0 });
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return tNow('common.minutesShort', { count: rest });
  if (!rest) return tNow('common.hoursShort', { count: hours });
  return tNow('common.hoursMinutes', { hours, minutes: rest });
}

export function parseClockTime(value) {
  const [hours, minutes] = String(value || '00:00')
    .split(':')
    .map((part) => Number(part));
  const date = new Date();
  date.setSeconds(0, 0);
  date.setHours(
    Number.isFinite(hours) ? hours : 0,
    Number.isFinite(minutes) ? minutes : 0,
    0,
    0,
  );
  return date;
}

export function clockTimeFromDate(date) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function formatActivityTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(getCurrentLocale(), {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function deletedDataSummary(payload) {
  const deleted = objectOrEmpty(payload?.deleted || payload);
  const entries = Object.entries(deleted).filter(([, value]) => Number.isFinite(Number(value)));
  if (!entries.length) return tNow('family.dataDeleted');

  const total = entries.reduce((sum, [, value]) => sum + Number(value), 0);
  return total > 0 ? tNow(total === 1 ? 'common.itemDeleted' : 'common.itemsDeleted', { count: total }) : tNow('common.noItemsRemained');
}
