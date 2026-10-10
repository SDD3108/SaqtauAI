import { Text, View } from 'react-native';

export default function ChatBubble({ role, content }) {
  const isUser = role === 'user';

  if (isUser) {
    return (
      <View className="mb-3 items-end">
        <View className="max-w-[84%] rounded-[22px] rounded-br-[7px] bg-[#208AEF] px-4 py-3">
          <Text className="font-inter text-[16px] leading-[23px] text-white">
            {content}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="mb-4 items-start">
      <View className="max-w-[91%] rounded-[22px] rounded-bl-[7px] bg-white px-4 py-3">
        <Text className="font-inter text-[16px] leading-[24px] text-[#27202F]">
          {content}
        </Text>
      </View>
    </View>
  );
}
