import { Pressable, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

export default function SuggestedAction({ icon: Icon, label, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="mb-3 flex-row items-center rounded-[22px] bg-white px-4 py-[14px] active:opacity-70"
    >
      <View className="mr-3 h-11 w-11 items-center justify-center rounded-full bg-[#F2F7FF]">
        <Icon width={24} height={24} />
      </View>

      <Text className="flex-1 font-inter-semibold text-[16px] leading-5 text-[#181027]">
        {label}
      </Text>

      <ChevronRight size={20} strokeWidth={2} color="#A19CA8" />
    </Pressable>
  );
}
