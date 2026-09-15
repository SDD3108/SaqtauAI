import { Pressable, Text, View } from 'react-native';

const OPTIONS = [
  { value: 'metric', label: 'Metric' },
  { value: 'imperial', label: 'Imperial' },
];

export default function UnitSegmentedControl({ value, onChange }) {
  return (
    <View className="flex-row rounded-2xl bg-[#E1DFE3] p-1">
      {OPTIONS.map((option) => {
        const selected = option.value === value;

        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            className={`h-11 flex-1 items-center justify-center rounded-xl ${
              selected ? 'bg-[#181027]' : 'bg-transparent'
            }`}
            onPress={() => onChange(option.value)}
          >
            <Text
              className={`font-inter-medium text-[15px] ${
                selected ? 'text-[#ECECEC]' : 'text-[#6F6977]'
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
