import { getLocales } from 'expo-localization';
import { create } from 'zustand';

import { localeForLanguage, normalizeLanguage, translate } from '@/src/features/localization/i18n';
import { STORAGE_KEYS } from '@/src/services/storage/keys';
import { getString, setString } from '@/src/services/storage/storage';

function detectDeviceLanguage() {
  try {
    const locale = getLocales()?.[0];
    return normalizeLanguage(locale?.languageCode || locale?.languageTag || 'en');
  } catch {
    return 'en';
  }
}

export const useLocalizationStore = create((set, get) => ({
  language: 'en',
  ready: false,

  initialize: async () => {
    if (get().ready) return get().language;

    const saved = await getString(STORAGE_KEYS.LANGUAGE);
    const language = saved ? normalizeLanguage(saved) : detectDeviceLanguage();

    set({ language, ready: true });
    return language;
  },

  setLanguage: async (value) => {
    const language = normalizeLanguage(value);
    await setString(STORAGE_KEYS.LANGUAGE, language);
    set({ language, ready: true });
    return language;
  },
}));

export function getCurrentLanguage() {
  return useLocalizationStore.getState().language;
}

export function getCurrentLocale() {
  return localeForLanguage(getCurrentLanguage());
}

export function tNow(key, params) {
  return translate(getCurrentLanguage(), key, params);
}
