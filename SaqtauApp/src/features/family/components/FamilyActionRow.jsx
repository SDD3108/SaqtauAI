import { ChevronRight } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

export default function FamilyActionRow({ Icon, title, subtitle, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      className="mb-3 flex-row items-center rounded-[22px] bg-white px-4 py-4 active:opacity-80"
    >
      <View className="h-12 w-12 items-center justify-center rounded-full bg-[#EEECEF]">
        <Icon width={28} height={28} />
      </View>
      <View className="ml-4 flex-1">
        <Text className="font-inter-bold text-[16px] text-[#181027]">{title}</Text>
        {subtitle ? (
          <Text className="mt-1 font-inter-medium text-[13px] leading-[18px] text-[#807B89]">
            {subtitle}
          </Text>
        ) : null}
      </View>
      <ChevronRight size={21} color="#9C98A5" />
    </Pressable>
  );
}
