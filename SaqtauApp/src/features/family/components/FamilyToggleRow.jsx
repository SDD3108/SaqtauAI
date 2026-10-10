import { ActivityIndicator, Switch, Text, View } from 'react-native';

export default function FamilyToggleRow({
  title,
  subtitle,
  value,
  onValueChange,
  saving = false,
  disabled = false,
  isLast = false,
}) {
  return (
    <View className={`flex-row items-center px-4 py-4 ${isLast ? '' : 'border-b border-[#ECE9EE]'}`}>
      <View className="flex-1 pr-4">
        <Text className="font-inter-bold text-[15px] text-[#181027]">{title}</Text>
        {subtitle ? (
          <Text className="mt-1 font-inter-medium text-[12px] leading-[17px] text-[#807B89]">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {saving ? (
        <View className="w-[51px] items-center">
          <ActivityIndicator color="#181027" size="small" />
        </View>
      ) : (
        <Switch
          value={Boolean(value)}
          disabled={disabled}
          onValueChange={onValueChange}
          trackColor={{ false: '#D3D0D7', true: '#181027' }}
          thumbColor="#FFFFFF"
          ios_backgroundColor="#D3D0D7"
        />
      )}
    </View>
  );
}
