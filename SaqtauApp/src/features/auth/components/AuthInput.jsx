import { Eye, EyeOff } from 'lucide-react-native';
import { Pressable, Text, TextInput, View } from 'react-native';

export default function AuthInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoComplete,
  textContentType,
  secureTextEntry = false,
  secureVisible = false,
  onToggleSecure,
  error,
  returnKeyType = 'next',
  onSubmitEditing,
}) {
  return (
    <View className="mt-5">
      <Text className="mb-2 font-inter-medium text-[15px] text-[#5F5967]">
        {label}
      </Text>

      <View
        className={`min-h-[58px] flex-row items-center rounded-2xl border bg-[#F7F6F7] px-4 ${
          error ? 'border-[#B84747]' : 'border-[#D9D6DC]'
        }`}
      >
        <TextInput
          accessibilityLabel={label}
          className="flex-1 py-4 font-inter text-[17px] text-[#181027]"
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#A19CA6"
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          autoComplete={autoComplete}
          textContentType={textContentType}
          secureTextEntry={secureTextEntry && !secureVisible}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
        />

        {secureTextEntry ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={secureVisible ? 'Hide password' : 'Show password'}
            className="ml-3 h-10 w-10 items-center justify-center"
            onPress={onToggleSecure}
          >
            {secureVisible ? (
              <EyeOff size={20} color="#807B89" />
            ) : (
              <Eye size={20} color="#807B89" />
            )}
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <Text className="mt-2 font-inter text-[13px] leading-[18px] text-[#B84747]">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
