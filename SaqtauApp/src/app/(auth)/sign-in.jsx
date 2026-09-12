import { Text, View } from 'react-native';

export default function SignInScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-[#ECECEC] px-8">
      <Text className="text-3xl font-bold text-[#181027]">Sign in</Text>
      <Text className="mt-3 text-center text-base text-[#807B89]">
        The full Figma sign-in screen will be implemented in the auth step.
      </Text>
    </View>
  );
}
