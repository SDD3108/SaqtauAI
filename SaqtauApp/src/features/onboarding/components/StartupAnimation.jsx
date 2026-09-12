import { ActivityIndicator, Pressable, Text, View } from 'react-native';

export default function StartupAnimation({ error, onRetry }) {
  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-[#ECECEC] px-8">
        <Text className="text-center text-xl font-semibold text-[#181027]">
          Couldn’t connect to SaqtauAI
        </Text>
        <Text className="mt-3 text-center text-base text-[#807B89]">
          Check your internet connection and try again.
        </Text>
        <Pressable
          className="mt-8 rounded-xl bg-[#181027] px-8 py-4"
          onPress={onRetry}
        >
          <Text className="text-base font-semibold text-white">Try again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center bg-[#ECECEC]">
      <Text className="mb-8 text-3xl font-bold text-[#181027]">SaqtauAI</Text>
      <ActivityIndicator size="small" color="#181027" />
    </View>
  );
}
