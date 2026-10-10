import { Pressable, Text, View } from 'react-native';

import useI18n from '@/src/features/localization/hooks/useI18n';

const OPTIONS = [
  { value: 'metric', labelKey: 'profile.metric' },
  { value: 'imperial', labelKey: 'profile.imperial' },
];

export default function UnitSegmentedControl({ value, onChange, appearance }) {
  const { t } = useI18n();
  const beforeStart = appearance === 'beforeStart';

  return (
    <View className={beforeStart ? "flex-row overflow-hidden rounded-[7px] border border-[#D2CFD6]" : "flex-row rounded-2xl bg-[#E1DFE3] p-1"}>
      {OPTIONS.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            className={beforeStart ? `min-h-[48px] flex-1 items-center justify-center px-2 py-2 ${selected ? 'border border-[#746B82] bg-[#8E879B]' : 'bg-transparent'}` : `h-11 flex-1 items-center justify-center rounded-xl ${selected ? 'bg-[#181027]' : 'bg-transparent'}`}
            onPress={() => onChange(option.value)}
          >
            <Text className={beforeStart ? `text-center font-inter-semibold text-[17px] leading-[23px] tracking-[-0.5px] ${selected ? 'text-white' : 'text-black'}` : `font-inter-medium text-[15px] ${selected ? 'text-[#ECECEC]' : 'text-[#6F6977]'}`}>
              {t(option.labelKey)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
