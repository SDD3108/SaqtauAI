export const CHECK_IN_SECONDS = 20;

export function formatRecordedDuration(measurement, t) {
  const value = measurement?.duration_seconds;
  if (typeof value !== 'number' && typeof value !== 'string') return '';
  const seconds = Number(value);
  if (!Number.isFinite(seconds) || seconds <= 0) return '';
  return t('checkin.durationSeconds', { count: Math.max(1, Math.round(seconds)) });
}
