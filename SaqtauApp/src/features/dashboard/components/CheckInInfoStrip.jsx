import { Clock3, Timer } from 'lucide-react-native';
import { Text, View } from 'react-native';

function Item({ icon: Icon, label, value }) {
  return (
    <View className="flex-1 flex-row items-center px-4">
      <Icon
        size={24}
        strokeWidth={1.8}
        color="#181027"
      />
      <View className="ml-3 flex-1">
        <Text className="font-inter-medium text-[13px] text-[#8E879B]">
          {label}
        </Text>
        <Text
          className="mt-1 font-inter-medium text-[13px] text-[#8E879B]"
          numberOfLines={1}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

export default function CheckInInfoStrip({
  lastCheckIn,
  duration,
}) {
  return (
    <View className="mt-3 h-[62px] flex-row items-center rounded-[15px] border border-[#B7B2BD]">
      <Item
        icon={Clock3}
        label="Last check-in"
        value={lastCheckIn}
      />

      <View className="h-[34px] w-px bg-[#A9A4AF]" />

      <Item
        icon={Timer}
        label="Check-in time"
        value={duration}
      />
    </View>
  );
}
