import { Text, TextInput, View } from 'react-native';

export default function ProfileField({
  label,
  value,
  onChangeText,
  unit,
  placeholder,
  error,
  appearance,
}) {
  const beforeStart = appearance === 'beforeStart';
  return (
    <View className={beforeStart ? "mt-7" : "mt-5"}>
      <Text className={beforeStart ? "mb-1.5 font-inter-semibold text-[17px] leading-[23px] tracking-[-0.5px] text-black" : "font-inter-medium mb-2 text-[15px] text-[#5F5967]"}>
        {label}
      </Text>

      <View
        className={` ${beforeStart ? "min-h-[48px] flex-row items-center rounded-[7px] border bg-transparent px-2.5" : "h-[58px] flex-row items-center rounded-2xl border bg-[#F5F4F5] px-4"} ${
          error ? 'border-[#B84747]' : beforeStart ? 'border-[#D2CFD6]' : 'border-[#D9D6DC]'
        }`}
      >
        <TextInput
          accessibilityLabel={label}
          className={beforeStart ? "min-w-0 flex-1 py-2.5 font-inter-semibold text-[17px] leading-[23px] tracking-[-0.6px] text-[#181027]" : "font-inter flex-1 text-[17px] text-[#181027]"}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={beforeStart ? "#807B89" : "#A19CA6"}
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
