import { create } from 'zustand';

import { STORAGE_KEYS } from '@/services/storage/keys';
import { getJSON, setJSON } from '@/services/storage/storage';

const DEFAULT_PROFILE = {
  dateOfBirth: null,
  height: null,
  weight: null,
  units: 'metric',
};

export const useOnboardingStore = create((set, get) => ({
  welcomeCompleted: false,
  profileCompleted: false,
  firstCheckInCompleted: false,
  profile: DEFAULT_PROFILE,
  isHydrated: false,

  hydrate: async () => {
    const [welcomeCompleted, profileCompleted, firstCheckInCompleted, profile] =
      await Promise.all([
        getJSON(STORAGE_KEYS.WELCOME_COMPLETED, false),
        getJSON(STORAGE_KEYS.PROFILE_COMPLETED, false),
        getJSON(STORAGE_KEYS.FIRST_CHECKIN_COMPLETED, false),
        getJSON(STORAGE_KEYS.PROFILE, DEFAULT_PROFILE),
      ]);

    set({
      welcomeCompleted,
      profileCompleted,
      firstCheckInCompleted,
      profile: {
        ...DEFAULT_PROFILE,
        ...profile,
      },
      isHydrated: true,
    });
  },

  completeWelcome: async () => {
    await setJSON(STORAGE_KEYS.WELCOME_COMPLETED, true);
    set({ welcomeCompleted: true });
  },

  saveProfile: async (profile) => {
    const nextProfile = {
      ...get().profile,
      ...profile,
    };

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
    set({ firstCheckInCompleted: true });
  },
}));
