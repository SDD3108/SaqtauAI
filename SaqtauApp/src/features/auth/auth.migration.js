import { copyGuestCheckInsToAccount } from '@/src/features/check-in/check-in.storage';
import { STORAGE_KEYS } from '@/src/services/storage/keys';
import { getJSON } from '@/src/services/storage/storage';

const EMPTY_PROFILE = {
  dateOfBirth: null,
  heightCm: null,
  weightKg: null,
  units: 'metric',
};

function hasValue(value) {
  return value !== null && value !== undefined && value !== '';
}

export async function readLocalProfile() {
  const profile = await getJSON(STORAGE_KEYS.PROFILE, EMPTY_PROFILE);

  return {
    dateOfBirth: profile?.dateOfBirth || null,
    heightCm: profile?.heightCm ?? profile?.height ?? null,
    weightKg: profile?.weightKg ?? profile?.weight ?? null,
    units: profile?.units || 'metric',
  };
}

export function mergeLocalProfile(existingProfileData, localProfile, overwrite = false) {
  const next = {
    ...(existingProfileData && typeof existingProfileData === 'object'
      ? existingProfileData
      : {}),
  };

  for (const key of ['dateOfBirth', 'heightCm', 'weightKg', 'units']) {
    const incoming = localProfile?.[key];

    if (hasValue(incoming) && (overwrite || !hasValue(next[key]))) {
      next[key] = incoming;
    }
  }

  return next;
}

export function buildAccountPatch(account, localProfile, {
  displayName,
  overwriteProfile = false,
} = {}) {
  const profileData = mergeLocalProfile(
    account?.profile_data,
    localProfile,
    overwriteProfile,
  );
  const settingsData = {
    ...(account?.settings_data && typeof account.settings_data === 'object'
      ? account.settings_data
      : {}),
    guest: false,
  };

  if (localProfile?.units && !settingsData.units) {
    settingsData.units = localProfile.units;
  }

  const patch = {
    profile_data: profileData,
    settings_data: settingsData,
  };

  if (typeof displayName === 'string' && displayName.trim()) {
    patch.display_name = displayName.trim();
  }

  return patch;
}

export async function preserveGuestCheckInsForAccount(accountId) {
  if (!accountId) {
    return [];
  }

  return copyGuestCheckInsToAccount(String(accountId));
}
