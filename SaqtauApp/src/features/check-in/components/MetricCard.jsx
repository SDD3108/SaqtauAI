import { Text, View } from 'react-native';

export default function MetricCard({
  label,
  value,
  unit,
  helper,
  explanation,
  fullWidth = false,
}) {
  return (
    <View className={`${fullWidth ? 'w-full' : 'w-[48.5%]'} rounded-[20px] bg-white px-4 py-4`}>
      <Text className="font-inter-medium text-[13px] text-[#807B89]">
        {label}
      </Text>

      <View className="mt-2 flex-row flex-wrap items-end">
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
        <Text className="mt-2 font-inter text-[12px] leading-[18px] text-[#807B89]">
          {helper}
        </Text>
      ) : null}
      {explanation ? (
        <Text className="mt-3 font-inter text-[10px] leading-[19px] text-[#696372]">
          {explanation}
        </Text>
      ) : null}
    </View>
  );
}
