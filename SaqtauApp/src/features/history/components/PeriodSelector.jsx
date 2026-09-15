import { Pressable, Text, View } from 'react-native';

const OPTIONS = [
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
  { value: '90d', label: '90D' },
];

export default function PeriodSelector({ value, onChange }) {
  return (
    <View className="flex-row rounded-[13px] bg-[#DEDDDF] p-1">
      {OPTIONS.map((option) => {
        const selected = value === option.value;

        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            className={`min-w-[56px] flex-1 items-center justify-center rounded-[10px] px-3 py-2 ${
              selected ? 'bg-[#181027]' : ''
            }`}
          >
            <Text
              className={`font-inter-semibold text-[12px] ${
                selected ? 'text-white' : 'text-[#807B89]'
              }`}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
