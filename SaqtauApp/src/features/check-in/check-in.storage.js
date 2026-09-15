import { STORAGE_KEYS } from '@/src/services/storage/keys';
import {
  getJSON,
  getString,
  removeStorageItem,
  setJSON,
  setString,
} from '@/src/services/storage/storage';

const MAX_LOCAL_CHECKINS = 100;

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
      measurement.diagnostics &&
      typeof measurement.diagnostics === 'object'
        ? measurement.diagnostics
        : {},
    failure_code: measurement.failure_code || '',
    failure_detail: measurement.failure_detail || '',
    created_at: measurement.created_at,
    processed_at: measurement.processed_at,
  };
}

export async function savePendingMeasurementId(id) {
  return setString(
    STORAGE_KEYS.PENDING_MEASUREMENT_ID,
    id,
  );
}

export async function getPendingMeasurementId() {
  return getString(
    STORAGE_KEYS.PENDING_MEASUREMENT_ID,
  );
}

export async function clearPendingMeasurementId() {
  return removeStorageItem(
    STORAGE_KEYS.PENDING_MEASUREMENT_ID,
  );
}

export async function saveLastMeasurementId(id) {
  return setString(
    STORAGE_KEYS.LAST_MEASUREMENT_ID,
    id,
  );
}

export async function getLastMeasurementId() {
  return getString(
    STORAGE_KEYS.LAST_MEASUREMENT_ID,
  );
}

export async function getLocalGuestCheckIns() {
  return getJSON(
    STORAGE_KEYS.LOCAL_CHECKINS,
    [],
  );
}

export async function getLocalGuestCheckIn(id) {
  const checkIns = await getLocalGuestCheckIns();

  return (
    checkIns.find(
      (checkIn) => checkIn.id === id,
    ) || null
  );
}

export async function saveLocalGuestCheckIn(
  measurement,
) {
  const sanitized = sanitizeMeasurement(measurement);

  if (!sanitized?.id) {
    return null;
  }

  const current = await getLocalGuestCheckIns();

  const next = [
    sanitized,
    ...current.filter(
      (item) => item.id !== sanitized.id,
    ),
  ].slice(0, MAX_LOCAL_CHECKINS);

  await setJSON(
    STORAGE_KEYS.LOCAL_CHECKINS,
    next,
  );

  return sanitized;
}
