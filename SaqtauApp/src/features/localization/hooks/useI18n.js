import { useCallback, useMemo } from 'react';

import { localeForLanguage, translate } from '@/src/features/localization/i18n';
import { useLocalizationStore } from '@/src/features/localization/localization.store';

export default function useI18n() {
  const language = useLocalizationStore((state) => state.language);
  const setLanguage = useLocalizationStore((state) => state.setLanguage);

  const t = useCallback(
    (key, params) => translate(language, key, params),
    [language],
  );

  const locale = useMemo(() => localeForLanguage(language), [language]);

  return { language, locale, setLanguage, t };
}
