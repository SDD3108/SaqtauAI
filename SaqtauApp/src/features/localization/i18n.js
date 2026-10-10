import en from '@/src/features/localization/messages/en';
import kk from '@/src/features/localization/messages/kk';
import ru from '@/src/features/localization/messages/ru';

export const SUPPORTED_LANGUAGES = ['en', 'ru', 'kk'];

export const LANGUAGE_OPTIONS = [
  { value: 'en', labelKey: 'language.english', nativeLabel: 'English' },
  { value: 'ru', labelKey: 'language.russian', nativeLabel: 'Русский' },
  { value: 'kk', labelKey: 'language.kazakh', nativeLabel: 'Қазақша' },
];

export const LANGUAGE_LOCALES = {
  en: 'en-US',
  ru: 'ru-RU',
  kk: 'kk-KZ',
};

const dictionaries = { en, ru, kk };

export function normalizeLanguage(value) {
  const language = String(value || '').trim().toLowerCase().split(/[-_]/)[0];
  return SUPPORTED_LANGUAGES.includes(language) ? language : 'en';
}

function interpolate(template, params = {}) {
  return String(template).replace(/\{(\w+)\}/g, (match, key) => {
    const value = params[key];
    return value === undefined || value === null ? match : String(value);
  });
}

export function translate(language, key, params) {
  const normalized = normalizeLanguage(language);
  const template = dictionaries[normalized]?.[key] ?? dictionaries.en[key] ?? key;
  return interpolate(template, params);
}

export function localeForLanguage(language) {
  return LANGUAGE_LOCALES[normalizeLanguage(language)] || LANGUAGE_LOCALES.en;
}
