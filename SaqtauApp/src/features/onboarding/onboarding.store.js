import { create } from 'zustand';

import { STORAGE_KEYS } from '@/src/services/storage/keys';
import { getJSON, setJSON } from '@/src/services/storage/storage';

const DEFAULT_PROFILE = {
  dateOfBirth: null,
  heightCm: null,
  weightKg: null,
  units: 'metric',
};

function normalizeProfile(profile) {
  if (!profile) {
    return DEFAULT_PROFILE;
  }

  return {
    dateOfBirth: profile.dateOfBirth || null,
    heightCm: profile.heightCm ?? profile.height ?? null,
    weightKg: profile.weightKg ?? profile.weight ?? null,
    units: profile.units || 'metric',
  };
}

export const useOnboardingStore = create((set, get) => ({
  welcomeCompleted: false,
  profileCompleted: false,
  firstCheckInCompleted: false,
  profile: DEFAULT_PROFILE,
  isHydrated: false,

  hydrate: async () => {
    const [
      welcomeCompleted,
      profileCompleted,
      firstCheckInCompleted,
      storedProfile,
    ] = await Promise.all([
      getJSON(STORAGE_KEYS.WELCOME_COMPLETED, false),
      getJSON(STORAGE_KEYS.PROFILE_COMPLETED, false),
      getJSON(STORAGE_KEYS.FIRST_CHECKIN_COMPLETED, false),
      getJSON(STORAGE_KEYS.PROFILE, DEFAULT_PROFILE),
    ]);

    set({
      welcomeCompleted,
      profileCompleted,
      firstCheckInCompleted,
      profile: normalizeProfile(storedProfile),
      isHydrated: true,
    });
  },

  completeWelcome: async () => {
    await setJSON(STORAGE_KEYS.WELCOME_COMPLETED, true);

    set({
      welcomeCompleted: true,
    });
  },

  saveProfile: async (profile) => {
    const nextProfile = normalizeProfile({
      ...get().profile,
      ...profile,
    });

    await Promise.all([
      setJSON(STORAGE_KEYS.PROFILE, nextProfile),
      setJSON(STORAGE_KEYS.PROFILE_COMPLETED, true),
    ]);

    set({
      profile: nextProfile,
      profileCompleted: true,
    });
  },

  completeFirstCheckIn: async () => {
    await setJSON(STORAGE_KEYS.FIRST_CHECKIN_COMPLETED, true);

    set({
      firstCheckInCompleted: true,
    });
  },
}));
