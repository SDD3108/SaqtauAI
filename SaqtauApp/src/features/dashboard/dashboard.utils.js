function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function measurementDate(measurement) {
  const value =
    measurement?.processed_at ||
    measurement?.created_at ||
    null;

  if (!value) {
    return null;
  }

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
  return sortMeasurementsNewestFirst(
    items.filter((item) => item?.status === 'completed'),
  );
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

    if (number !== null) {
      return Math.max(0, Math.min(100, Math.round(number)));
    }
  }

  return null;
}

export function getDashboardStatus(summary, latest) {
  const raw = String(
    summary?.status || latest?.stress_level || '',
  )
    .trim()
    .toLowerCase();

  if (
    raw.includes('steady') ||
    raw.includes('balanced') ||
    raw.includes('good') ||
    raw === 'low'
  ) {
    return 'Steady today';
  }

  if (raw === 'medium' || raw.includes('moderate')) {
    return 'Mixed today';
  }

  if (raw === 'high') {
    return 'Higher stress';
  }

  return latest ? 'Check-in complete' : 'Ready when you are';
}

export function getDashboardMessage(summary, latest) {
  if (summary?.message) {
    return String(summary.message);
  }

  if (!latest) {
    return 'Complete a check-in to see your latest wellness snapshot.';
  }

  if (latest.stress_level === 'high') {
    return 'Your latest signals show a higher stress reading.';
  }

  return 'Your latest signals look balanced.\nKeep up the great work.';
}

export function formatLastCheckIn(measurement) {
  const date = measurementDate(measurement);

  if (!date) {
    return 'No check-in yet';
  }

  const now = new Date();
  const sameDay =
    now.getFullYear() === date.getFullYear() &&
    now.getMonth() === date.getMonth() &&
    now.getDate() === date.getDate();

  const time = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  if (sameDay) {
    return `Today, ${time}`;
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatCheckInDuration(measurement) {
  const seconds = toNumber(measurement?.duration_seconds);

  if (seconds === null || seconds <= 0) {
    return measurement ? '1 min check-in' : '—';
  }

  if (seconds < 90) {
    return `${Math.max(1, Math.round(seconds / 60))} min check-in`;
  }

  const minutes = Math.round(seconds / 60);
  return `${minutes} min check-in`;
}
