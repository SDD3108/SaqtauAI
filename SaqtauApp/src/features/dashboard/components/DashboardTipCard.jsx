import {
  Accessibility,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

export function AccurateReadingCard() {
  return (
    <View className="mt-3 min-h-[116px] flex-row items-center rounded-[15px] border border-[#B7B2BD] px-4 py-3">
      <View className="h-[82px] w-[82px] items-center justify-center rounded-[14px] bg-[#E6E5E6]">
        <Accessibility
          size={46}
          strokeWidth={1.8}
          color="#181027"
        />
      </View>

      <View className="ml-4 flex-1">
        <Text className="font-inter-medium text-[17px] text-[#181027]">
          Tips for accurate readings
        </Text>
        <Text className="mt-1 font-inter-medium text-[13px] leading-[18px] text-[#8E879B]">
          Sit in a well-lit area and rest your arms on a steady surface to reduce movement.
        </Text>

        <View className="mt-2 flex-row items-center">
          <Text className="font-inter-medium text-[13px] text-[#181027]">
            Learn how
          </Text>
          <ChevronRight
            size={15}
            strokeWidth={2}
            color="#181027"
          />
        </View>
      </View>
    </View>
  );
}

export function PrivacyCard() {
  return (
    <Pressable
      accessibilityRole="button"
      className="mt-3 min-h-[82px] flex-row items-center rounded-[15px] border border-[#B7B2BD] px-4 py-3 active:opacity-80"
      onPress={() => {}}
    >
      <View className="h-[54px] w-[54px] items-center justify-center rounded-full bg-[#E1E0E2]">
        <ShieldCheck
          size={28}
          strokeWidth={1.7}
          color="#181027"
        />
      </View>

      <View className="ml-4 flex-1">
        <Text className="font-inter-medium text-[17px] text-[#181027]">
          Privacy first
        </Text>
        <Text className="mt-1 font-inter-medium text-[13px] leading-[18px] text-[#8E879B]">
          Your data is encrypted and never shared without your consent.
        </Text>
      </View>

      <ChevronRight
        size={22}
        strokeWidth={2}
        color="#181027"
      />
    </Pressable>
  );
}
