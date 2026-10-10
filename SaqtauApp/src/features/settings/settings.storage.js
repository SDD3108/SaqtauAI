import { STORAGE_KEYS } from '@/src/services/storage/keys';
import {
  getJSON,
  removeStorageItems,
  setJSON,
} from '@/src/services/storage/storage';

export const DEFAULT_PRIVACY_PREFERENCES = {
  share_usage_data: false,
  share_insights: false,
};

function transferredKey(accountId) {
  return accountId
    ? `${STORAGE_KEYS.ACCOUNT_TRANSFERRED_CHECKINS_PREFIX}.${accountId}`
    : null;
}

export async function getLocalPrivacyPreferences() {
  const value = await getJSON(
    STORAGE_KEYS.PRIVACY_PREFERENCES,
    DEFAULT_PRIVACY_PREFERENCES,
  );

  return {
    ...DEFAULT_PRIVACY_PREFERENCES,
    ...(value && typeof value === 'object' ? value : {}),
  };
}

export async function saveLocalPrivacyPreferences(preferences) {
  const next = {
    ...DEFAULT_PRIVACY_PREFERENCES,
    ...preferences,
  };

  await setJSON(STORAGE_KEYS.PRIVACY_PREFERENCES, next);
  return next;
}

export async function buildGuestDataExport() {
  const [profile, checkIns, privacy] = await Promise.all([
    getJSON(STORAGE_KEYS.PROFILE, null),
    getJSON(STORAGE_KEYS.LOCAL_CHECKINS, []),
    getLocalPrivacyPreferences(),
  ]);

  return {
    exported_at: new Date().toISOString(),
    source: 'saqtau-ios-local-guest',
    profile,
    privacy_preferences: privacy,
    checkins: Array.isArray(checkIns) ? checkIns : [],
  };
}

export async function clearLocalMeasurementData(accountId) {
  const keys = [
    STORAGE_KEYS.LOCAL_CHECKINS,
    STORAGE_KEYS.PENDING_MEASUREMENT_ID,
    STORAGE_KEYS.LAST_MEASUREMENT_ID,
    STORAGE_KEYS.FIRST_CHECKIN_COMPLETED,
  ];

  const accountKey = transferredKey(accountId);
  if (accountKey) {
    keys.push(accountKey);
  }

  await removeStorageItems(keys);
}

export async function clearGuestProfileData() {
  await removeStorageItems([
    STORAGE_KEYS.PROFILE,
    STORAGE_KEYS.PROFILE_COMPLETED,
    STORAGE_KEYS.PRIVACY_PREFERENCES,
  ]);
}
