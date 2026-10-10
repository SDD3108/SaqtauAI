import { ActivityIndicator, Switch, Text, View } from 'react-native';

export default function PreferenceRow({
  title,
  description,
  value,
  onValueChange,
  saving = false,
  disabled = false,
}) {
  return (
    <View className="flex-row items-center border-b border-[#EEECEF] px-4 py-4">
      <View className="mr-4 flex-1">
        <Text className="font-inter-semibold text-[15px] text-[#181027]">
          {title}
        </Text>
        {description ? (
          <Text className="mt-1 font-inter text-[12px] leading-[17px] text-[#807B89]">
            {description}
          </Text>
        ) : null}
      </View>

      {saving ? (
        <View className="w-[51px] items-center">
          <ActivityIndicator size="small" color="#181027" />
        </View>
      ) : (
        <Switch
          accessibilityLabel={title}
          value={Boolean(value)}
          onValueChange={onValueChange}
          disabled={disabled}
          trackColor={{ false: '#CBC7CF', true: '#181027' }}
          thumbColor="#FFFFFF"
          ios_backgroundColor="#CBC7CF"
        />
      )}
    </View>
  );
}
