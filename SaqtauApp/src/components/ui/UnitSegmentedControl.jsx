import { Pressable, Text, View } from 'react-native';

import useI18n from '@/src/features/localization/hooks/useI18n';

const OPTIONS = [
  { value: 'metric', labelKey: 'profile.metric' },
  { value: 'imperial', labelKey: 'profile.imperial' },
];

export default function UnitSegmentedControl({ value, onChange }) {
  const { t } = useI18n();

  return (
    <View className="flex-row rounded-2xl bg-[#E1DFE3] p-1">
      {OPTIONS.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            className={`h-11 flex-1 items-center justify-center rounded-xl ${selected ? 'bg-[#181027]' : 'bg-transparent'}`}
            onPress={() => onChange(option.value)}
          >
            <Text className={`font-inter-medium text-[15px] ${selected ? 'text-[#ECECEC]' : 'text-[#6F6977]'}`}>
              {t(option.labelKey)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
