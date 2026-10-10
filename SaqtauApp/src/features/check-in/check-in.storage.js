import { STORAGE_KEYS } from '@/src/services/storage/keys';
import {
  getJSON,
  getString,
  removeStorageItem,
  setJSON,
  setString,
} from '@/src/services/storage/storage';

const MAX_LOCAL_CHECKINS = 100;

function accountTransferredKey(accountId) {
  if (!accountId) {
    return null;
  }

  return `${STORAGE_KEYS.ACCOUNT_TRANSFERRED_CHECKINS_PREFIX}.${accountId}`;
}

export function sanitizeMeasurement(measurement) {
  if (!measurement) {
    return null;
  }

  return {
    id: measurement.id,
    status: measurement.status,
    source_type: measurement.source_type,
    algorithm: measurement.algorithm,
    algorithm_version: measurement.algorithm_version,
    provenance: measurement.provenance,
    wellness_score: measurement.wellness_score,
    bpm: measurement.bpm,
    hrv_rmssd_ms: measurement.hrv_rmssd_ms,
    hrv_sdnn_ms: measurement.hrv_sdnn_ms,
    breathing_rate_bpm: measurement.breathing_rate_bpm,
    stress_index: measurement.stress_index,
    stress_level: measurement.stress_level,
    signal_quality: measurement.signal_quality,
    duration_seconds: measurement.duration_seconds,
    effective_fps: measurement.effective_fps,
    analyzed_frames: measurement.analyzed_frames,
    face_coverage: measurement.face_coverage,
    warnings: Array.isArray(measurement.warnings)
      ? measurement.warnings
      : [],
    diagnostics:
      measurement.diagnostics && typeof measurement.diagnostics === 'object'
        ? measurement.diagnostics
        : {},
    failure_code: measurement.failure_code || '',
    failure_detail: measurement.failure_detail || '',
    created_at: measurement.created_at,
    processed_at: measurement.processed_at,
  };
}

export function mergeCheckInsById(...groups) {
  const byId = new Map();
  const withoutId = [];

  for (const group of groups) {
    for (const item of Array.isArray(group) ? group : []) {
      if (!item) {
        continue;
      }

      if (!item.id) {
        withoutId.push(item);
        continue;
      }

      byId.set(String(item.id), item);
    }
  }

  return [...byId.values(), ...withoutId];
}

export async function savePendingMeasurementId(id) {
  return setString(STORAGE_KEYS.PENDING_MEASUREMENT_ID, id);
}

export async function getPendingMeasurementId() {
  return getString(STORAGE_KEYS.PENDING_MEASUREMENT_ID);
}

export async function clearPendingMeasurementId() {
  return removeStorageItem(STORAGE_KEYS.PENDING_MEASUREMENT_ID);
}

export async function saveLastMeasurementId(id) {
  return setString(STORAGE_KEYS.LAST_MEASUREMENT_ID, id);
}

export async function getLastMeasurementId() {
  return getString(STORAGE_KEYS.LAST_MEASUREMENT_ID);
}

export async function getLocalGuestCheckIns() {
  return getJSON(STORAGE_KEYS.LOCAL_CHECKINS, []);
}

export async function getLocalGuestCheckIn(id) {
  const checkIns = await getLocalGuestCheckIns();

  return checkIns.find((checkIn) => checkIn.id === id) || null;
}

export async function saveLocalGuestCheckIn(measurement) {
  const sanitized = sanitizeMeasurement(measurement);

  if (!sanitized?.id) {
    return null;
  }

  const current = await getLocalGuestCheckIns();
  const next = mergeCheckInsById(current, [sanitized])
    .slice(0, MAX_LOCAL_CHECKINS);

  await setJSON(STORAGE_KEYS.LOCAL_CHECKINS, next);
  return sanitized;
}

export async function getTransferredAccountCheckIns(accountId) {
  const key = accountTransferredKey(accountId);

  if (!key) {
    return [];
  }

  return getJSON(key, []);
}

export async function copyGuestCheckInsToAccount(accountId) {
  const key = accountTransferredKey(accountId);

  if (!key) {
    return [];
  }

  const [guestCheckIns, currentTransferred] = await Promise.all([
    getLocalGuestCheckIns(),
    getTransferredAccountCheckIns(accountId),
  ]);

  const next = mergeCheckInsById(
    currentTransferred,
    guestCheckIns.map(sanitizeMeasurement).filter(Boolean),
  ).slice(0, MAX_LOCAL_CHECKINS);

  await setJSON(key, next);
  return next;
}
