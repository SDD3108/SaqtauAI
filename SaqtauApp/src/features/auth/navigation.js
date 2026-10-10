export function normalizeReturnTo(value) {
  const raw = Array.isArray(value) ? value[0] : value;

  if (typeof raw !== 'string') {
    return '';
  }

  const normalized = raw.trim();

  if (
    !normalized.startsWith('/') ||
    normalized.startsWith('//') ||
    normalized.includes('://')
  ) {
    return '';
  }

  return normalized;
}
