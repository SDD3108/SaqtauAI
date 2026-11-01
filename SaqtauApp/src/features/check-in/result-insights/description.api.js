import { normalizeLanguage } from '@/src/features/localization/i18n';
import { apiRequest, getApiToken } from '@/src/services/api/client';

export const DESCRIPTION_POLL_MS = 60_000;
const MAX_ENTRIES = 100;
let sessionToken = null;
let entries = new Map();

function sessionError() {
  const error = new Error('Description session changed');
  error.status = 401;
  return error;
}

function entryFor(measurementId, language, token) {
  const currentToken = getApiToken();
  if (currentToken !== sessionToken) {
    sessionToken = currentToken;
    entries = new Map();
  }
  if (!token || token !== currentToken) throw sessionError();

  const key = JSON.stringify([String(measurementId), normalizeLanguage(language)]);
  if (!entries.has(key)) {
    if (entries.size >= MAX_ENTRIES) {
      const oldest = [...entries].find(([, entry]) => !entry.request);
      if (oldest) entries.delete(oldest[0]);
    }
    entries.set(key, { nextAllowedAt: 0, data: null, error: null, request: null });
  }
  return entries.get(key);
}

function retryDelay(value) {
  const seconds = Number(value);
  return Number.isFinite(seconds) && seconds > 0
    ? Math.max(DESCRIPTION_POLL_MS, Math.min(seconds, 3600) * 1000)
    : DESCRIPTION_POLL_MS;
}

export function validateDescription(data, measurementId, language) {
  if (
    !data || typeof data !== 'object' ||
    String(data.measurement_id) !== String(measurementId) ||
    data.language !== normalizeLanguage(language) ||
    !['pending', 'ready', 'failed', 'unavailable'].includes(data.status)
  ) {
    throw new Error('Invalid measurement description response');
  }

  const description = typeof data.description === 'string' ? data.description.trim() : '';
  if (data.status === 'ready' && (!description || description.length > 6000)) {
    throw new Error('Invalid measurement description text');
  }

  return {
    status: data.status,
    description: data.status === 'ready' ? description : '',
    retryAfterMs: retryDelay(data.retry_after_seconds),
  };
}

export function descriptionWaitMs(measurementId, language, token) {
  return Math.max(0, entryFor(measurementId, language, token).nextAllowedAt - Date.now());
}

// The token stays in memory only. Each auth session has an isolated cache.
export async function loadMeasurementDescription(measurementId, language, token) {
  const entry = entryFor(measurementId, language, token);
  if (entry.request) return entry.request;
  if (entry.data?.status === 'ready') return entry.data;
  if (Date.now() < entry.nextAllowedAt) {
    if (entry.error) throw entry.error;
    return entry.data;
  }

  const lang = normalizeLanguage(language);
  const path = `/measurements/${encodeURIComponent(String(measurementId))}/description/`;
  const pending = entry.data?.status === 'pending';
  entry.nextAllowedAt = Date.now() + DESCRIPTION_POLL_MS;
  entry.request = apiRequest(pending ? `${path}?lang=${lang}` : path, {
    method: pending ? 'GET' : 'POST',
    ...(pending ? {} : { body: { lang } }),
    timeout: 20_000,
  })
    .then((response) => {
      if (getApiToken() !== token) throw sessionError();
      const data = validateDescription(response, measurementId, lang);
      entry.data = data;
      entry.error = null;
      if (data.status !== 'ready') {
        entry.nextAllowedAt = Math.max(entry.nextAllowedAt, Date.now() + data.retryAfterMs);
      }
      return data;
    })
    .catch((error) => {
      entry.error = error;
      if ([404, 405, 410].includes(error?.status)) entry.data = null;
      entry.nextAllowedAt = Math.max(
        entry.nextAllowedAt,
        Date.now() + retryDelay(error?.data?.retry_after_seconds),
      );
      throw error;
    })
    .finally(() => { entry.request = null; });

  return entry.request;
}
