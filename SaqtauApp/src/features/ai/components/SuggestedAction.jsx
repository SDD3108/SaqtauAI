import { Pressable, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

export default function SuggestedAction({ icon: Icon, label, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="mb-3 min-h-[64px] flex-row items-center rounded-[15px] bg-[#F7F7F8] px-4 py-[14px] active:opacity-70"
    >
      <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-[#F1EBE5]">
        <Icon width={24} height={24} />
      </View>
      <Text className="flex-1 font-inter-semibold text-[16px] leading-[22px] text-[#181027]">{label}</Text>
      <ChevronRight size={20} strokeWidth={2} color="#8E879B" />
    </Pressable>
  );
}
