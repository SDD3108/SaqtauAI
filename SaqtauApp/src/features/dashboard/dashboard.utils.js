import { getCurrentLocale, tNow } from '@/src/features/localization/localization.store';

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function measurementDate(measurement) {
  const value = measurement?.processed_at || measurement?.created_at || null;
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function sortMeasurementsNewestFirst(items = []) {
  return [...items].sort((a, b) => {
    const aTime = measurementDate(a)?.getTime() || 0;
    const bTime = measurementDate(b)?.getTime() || 0;
    return bTime - aTime;
  });
}

export function completedMeasurements(items = []) {
  return sortMeasurementsNewestFirst(items.filter((item) => item?.status === 'completed'));
}

export function getLatestCompletedMeasurement(items = []) {
  return completedMeasurements(items)[0] || null;
}

export function getWellnessScore(summary, latest) {
  const candidates = [
    summary?.wellness_score,
    summary?.score,
    latest?.wellness_score,
    latest?.diagnostics?.wellness_score,
  ];

  for (const value of candidates) {
    const number = toNumber(value);
    if (number !== null) return Math.max(0, Math.min(100, Math.round(number)));
  }
  return null;
}

export function getDashboardStatus(summary, latest) {
  const raw = String(summary?.status || latest?.stress_level || '').trim().toLowerCase();

  if (raw.includes('steady') || raw.includes('balanced') || raw.includes('good') || raw === 'low') {
    return tNow('dashboard.statusSteady');
  }
  if (raw === 'medium' || raw.includes('moderate')) return tNow('dashboard.statusMixed');
  if (raw === 'high') return tNow('dashboard.statusHigh');
  return latest ? tNow('dashboard.statusComplete') : tNow('dashboard.statusReady');
}

export function getDashboardMessage(summary, latest) {
  if (summary?.message) return String(summary.message);
  if (!latest) return tNow('dashboard.messageEmpty');
  if (latest.stress_level === 'high') return tNow('dashboard.messageHigh');
  return tNow('dashboard.messageBalanced');
}

export function formatLastCheckIn(measurement) {
  const date = measurementDate(measurement);
  if (!date) return tNow('dashboard.noCheckIn');

  const now = new Date();
  const sameDay =
    now.getFullYear() === date.getFullYear() &&
    now.getMonth() === date.getMonth() &&
    now.getDate() === date.getDate();
  const locale = getCurrentLocale();

  const time = date.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });
  if (sameDay) return `${tNow('common.today')}, ${time}`;

  return date.toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatCheckInDuration(measurement) {
  const seconds = toNumber(measurement?.duration_seconds);
  if (seconds === null || seconds <= 0) {
    return measurement ? tNow('dashboard.oneMinuteCheckIn') : '—';
  }

  const minutes = Math.max(1, Math.round(seconds / 60));
  return minutes === 1
    ? tNow('dashboard.oneMinuteCheckIn')
    : tNow('dashboard.minutesCheckIn', { count: minutes });
}
