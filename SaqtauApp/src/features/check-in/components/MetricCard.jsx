import { Text, View } from 'react-native';

export default function MetricCard({
  label,
  value,
  unit,
  helper,
}) {
  return (
    <View className="w-[48.5%] rounded-[20px] bg-white px-4 py-4">
      <Text className="font-inter-medium text-[13px] text-[#807B89]">
        {label}
      </Text>

      <View className="mt-2 flex-row items-end">
        <Text className="font-inter-bold text-[28px] leading-[33px] tracking-[-0.6px] text-[#181027]">
          {value}
        </Text>

        {unit ? (
          <Text className="mb-[3px] ml-1 font-inter-medium text-[12px] text-[#807B89]">
            {unit}
          </Text>
        ) : null}
      </View>

      {helper ? (
        <Text className="mt-2 font-inter text-[11px] leading-[15px] text-[#A09AA8]">
          {helper}
        </Text>
      ) : null}
    </View>
  );
}
