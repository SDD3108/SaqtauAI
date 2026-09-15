export function getMeasurementDate(measurement) {
  const value = measurement?.processed_at || measurement?.created_at;

  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function sortNewest(items = []) {
  return [...items].sort((a, b) => {
    const aTime = getMeasurementDate(a)?.getTime() || 0;
    const bTime = getMeasurementDate(b)?.getTime() || 0;
    return bTime - aTime;
  });
}

export function filterCompleted(items = []) {
  return sortNewest(
    items.filter((item) => item?.status === 'completed'),
  );
}

export function filterByPeriod(items, period) {
  const days = Number.parseInt(period, 10);

  if (!Number.isFinite(days)) {
    return items;
  }

  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

  return items.filter((item) => {
    const time = getMeasurementDate(item)?.getTime();
    return time ? time >= cutoff : false;
  });
}

export function average(items, selector) {
  const values = items
    .map(selector)
    .map(Number)
    .filter(Number.isFinite);

  if (!values.length) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function formatNumber(value, digits = 0) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return '—';
  }

  return number.toFixed(digits).replace(/\.0+$/, '');
}

export function formatMeasurementDate(measurement) {
  const date = getMeasurementDate(measurement);

  if (!date) {
    return 'Unknown date';
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year:
      date.getFullYear() === new Date().getFullYear()
        ? undefined
        : 'numeric',
  });
}

export function formatMeasurementTime(measurement) {
  const date = getMeasurementDate(measurement);

  if (!date) {
    return '';
  }

  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function stressLabel(value) {
  const level = String(value || '').trim().toLowerCase();

  if (!level) {
    return '—';
  }

  return level.charAt(0).toUpperCase() + level.slice(1);
}

export function signalPercent(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return null;
  }

  const normalized = number <= 1 ? number * 100 : number;
  return Math.max(0, Math.min(100, Math.round(normalized)));
}
