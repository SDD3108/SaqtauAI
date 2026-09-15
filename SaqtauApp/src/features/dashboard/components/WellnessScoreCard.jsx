import { HeartPulse } from 'lucide-react-native';
import { Text, View } from 'react-native';

import HeartSignalGraphic from '@/src/features/dashboard/components/HeartSignalGraphic';

export default function WellnessScoreCard({
  score,
  statusLabel,
  message,
}) {
  return (
    <View className="rounded-[15px] border border-[#B7B2BD] px-5 pb-5 pt-4">
      <View className="self-start flex-row items-center rounded-[14px] bg-[#DDDCDE] px-3 py-2">
        <HeartPulse
          size={18}
          strokeWidth={2}
          color="#181027"
        />
        <Text className="ml-2 font-inter-medium text-[14px] text-[#8E879B]">
          {statusLabel}
        </Text>
      </View>

      <View className="mt-5 flex-row items-center justify-between">
        <View className="flex-1 pr-2">
          <Text className="font-inter-medium text-[13px] text-[#807B89]">
            Your wellness score
          </Text>

          <View className="mt-1 flex-row items-end">
            <Text className="font-inter-extrabold text-[68px] leading-[74px] tracking-[-3px] text-[#181027]">
              {score ?? '—'}
            </Text>
            <Text className="mb-[10px] ml-1 font-inter-medium text-[20px] text-[#181027]">
              /100
            </Text>
          </View>
        </View>

        <HeartSignalGraphic />
      </View>

      <Text className="mt-2 font-inter-medium text-[14px] leading-[20px] text-[#807B89]">
        {message}
      </Text>
    </View>
  );
}
