import { Check, Languages } from 'lucide-react-native';
import { useState } from 'react';
import { AccessibilityInfo, Pressable, Text, View } from 'react-native';

import SettingsPage from '@/src/features/settings/components/SettingsPage';
import { LANGUAGE_OPTIONS } from '@/src/features/localization/i18n';
import useI18n from '@/src/features/localization/hooks/useI18n';

export default function LanguageSettingsScreen() {
  const { language, setLanguage, t } = useI18n();
  const [saving, setSaving] = useState('');

  async function choose(value) {
    if (value === language || saving) return;

    setSaving(value);
    try {
      await setLanguage(value);
      AccessibilityInfo.announceForAccessibility(t('language.saved'));
    } finally {
      setSaving('');
    }
  }

  return (
    <SettingsPage title={t('language.title')} subtitle={t('language.subtitle')}>
      <View className="overflow-hidden rounded-[24px] bg-[#F7F7F8] px-2 py-1">
        {LANGUAGE_OPTIONS.map((option, index) => {
          const selected = language === option.value;
          const label = t(option.labelKey);

          return (
            <View key={option.value}>
              <Pressable
                accessibilityRole="radio"
                accessibilityLabel={label}
                accessibilityState={{ checked: selected, disabled: Boolean(saving) }}
                disabled={Boolean(saving)}
                onPress={() => choose(option.value)}
                className="min-h-[72px] flex-row items-center gap-4 px-2 py-3 active:opacity-70"
              >
                <View
                  className={`h-11 w-11 items-center justify-center rounded-[14px] ${
                    selected ? 'bg-[#181027]' : 'bg-[#ECEAEC]'
                  }`}
                >
                  <Languages size={22} color={selected ? '#FFFFFF' : '#625D71'} />
                </View>

                <View className="min-w-0 flex-1">
                  <Text className="font-inter-semibold text-[17px] text-[#181027]">
                    {option.nativeLabel}
                  </Text>
                  {selected ? (
                    <Text className="mt-1 font-inter-medium text-[12px] text-[#807B89]">
                      {t('language.current')}
                    </Text>
                  ) : null}
                </View>

                {selected ? (
                  <View className="h-8 w-8 items-center justify-center rounded-full bg-[#181027]">
                    <Check size={17} color="#FFFFFF" strokeWidth={2.5} />
                  </View>
                ) : null}
              </Pressable>

              {index < LANGUAGE_OPTIONS.length - 1 ? (
                <View className="mx-3 h-px bg-[#E7E5EA]" />
              ) : null}
            </View>
          );
        })}
      </View>

      <Text className="mt-5 px-4 text-center font-inter-medium text-[13px] leading-[19px] text-[#918B9D]">
        {t('language.deviceDetected')}
      </Text>
    </SettingsPage>
  );
}
