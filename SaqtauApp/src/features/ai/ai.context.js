import {
  getTransferredAccountCheckIns,
  mergeCheckInsById,
} from '@/src/features/check-in/check-in.storage';
import {
  getDashboardMeasurements,
  getDashboardSummary,
} from '@/src/features/dashboard/dashboard.api';
import { getLatestCompletedMeasurement } from '@/src/features/dashboard/dashboard.utils';

function firstNumber(...values) {
  for (const value of values) {
    const number = Number(value);

    if (Number.isFinite(number)) {
      return number;
    }
  }

  return null;
}

function normalizeStress(value) {
  const normalized = String(value || '').toLowerCase();

  if (normalized.includes('low')) {
    return 'low';
  }

  if (normalized.includes('medium') || normalized.includes('moderate')) {
    return 'medium';
  }

  if (normalized.includes('high')) {
    return 'high';
  }

  return null;
}

function normalizeQuality(value) {
  const quality = firstNumber(value);

  if (quality == null) {
    return null;
  }

  if (quality > 1 && quality <= 100) {
    return Math.max(0, Math.min(1, quality / 100));
  }

  return Math.max(0, Math.min(1, quality));
}

export function measurementToAiContext(measurement) {
  if (!measurement) {
    return null;
  }

  const context = {
    bpm: firstNumber(measurement.bpm, measurement.heart_rate),
    hrv: firstNumber(
      measurement.hrv_rmssd,
      measurement.hrv_rmssd_ms,
      measurement.hrv,
      measurement.hrv?.rmssd,
    ),
    breathing: firstNumber(
      measurement.respiratory_rate,
      measurement.breathing_rate_bpm,
      measurement.breathing,
      measurement.breathing_rate,
    ),
    stress: normalizeStress(
      measurement.stress_level ?? measurement.stress,
    ),
    quality: normalizeQuality(
      measurement.signal_quality ?? measurement.quality,
    ),
    durationSeconds: firstNumber(
      measurement.duration_seconds,
      measurement.durationSeconds,
      measurement.duration,
    ),
  };

  const compact = Object.fromEntries(
    Object.entries(context).filter(([, value]) => value != null),
  );

  return Object.keys(compact).length ? compact : null;
}

export async function getAiWellnessContext(accountId) {
  const [summaryResult, measurementsResult, transferredResult] =
    await Promise.allSettled([
      getDashboardSummary(),
      getDashboardMeasurements(),
      getTransferredAccountCheckIns(accountId),
    ]);

  const summary =
    summaryResult.status === 'fulfilled' ? summaryResult.value : null;
  const serverMeasurements =
    measurementsResult.status === 'fulfilled' ? measurementsResult.value : [];
  const transferredMeasurements =
    transferredResult.status === 'fulfilled' ? transferredResult.value : [];

  const measurements = mergeCheckInsById(
    transferredMeasurements,
    serverMeasurements,
  );

  const latest =
    getLatestCompletedMeasurement(measurements) ||
    summary?.latest_measurement ||
    null;

  return measurementToAiContext(latest);
}
