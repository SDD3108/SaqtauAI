import { Pressable, Text, View } from 'react-native';

import useI18n from '@/src/features/localization/hooks/useI18n';

const OPTIONS = [
  ['today', 'family.today'],
  ['7d', 'family.sevenDays'],
  ['30d', 'family.thirtyDays'],
  ['all', 'family.all'],
];

export default function FamilyRangeSelector({ value, onChange }) {
  const { t } = useI18n();
  return (
    <View className="flex-row rounded-[18px] bg-white p-1.5">
      {OPTIONS.map(([key, labelKey]) => {
        const selected = key === value;
        return (
          <Pressable
            key={key}
            onPress={() => onChange(key)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            className={`flex-1 items-center rounded-[14px] py-2.5 ${selected ? 'bg-[#181027]' : 'bg-transparent'}`}
          >
            <Text className={`font-inter-semibold text-[12px] ${selected ? 'text-white' : 'text-[#807B89]'}`}>
              {t(labelKey)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
