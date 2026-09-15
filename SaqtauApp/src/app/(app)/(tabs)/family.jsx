import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function FamilyScreen() {
  return (
    <SafeAreaView className="flex-1 bg-[#ECECEC]" edges={['top']}>
      <View className="flex-1 px-6 pt-8">
        <Text className="font-inter-extrabold text-[34px] leading-10 text-[#181027]">
          Family
        </Text>
        <Text className="font-inter mt-3 text-[16px] leading-6 text-[#807B89]">
          This screen will be implemented from Figma in the next parts.
        </Text>
      </View>
    </SafeAreaView>
  );
}