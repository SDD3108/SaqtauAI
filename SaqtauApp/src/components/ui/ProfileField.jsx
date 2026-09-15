import { Text, TextInput, View } from 'react-native';

export default function ProfileField({
  label,
  value,
  onChangeText,
  unit,
  placeholder,
  error,
}) {
  return (
    <View className="mt-5">
      <Text className="font-inter-medium mb-2 text-[15px] text-[#5F5967]">
        {label}
      </Text>

      <View
        className={`h-[58px] flex-row items-center rounded-2xl border bg-[#F5F4F5] px-4 ${
          error ? 'border-[#B84747]' : 'border-[#D9D6DC]'
        }`}
      >
        <TextInput
          className="font-inter flex-1 text-[17px] text-[#181027]"
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#A19CA6"
          keyboardType="decimal-pad"
          returnKeyType="done"
        />

        <Text className="font-inter-medium ml-3 text-[15px] text-[#807B89]">
          {unit}
        </Text>
      </View>

      {error ? (
        <Text className="font-inter mt-2 text-[13px] text-[#B84747]">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
