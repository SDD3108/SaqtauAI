import { ChevronRight } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

export default function SettingsRow({
  title,
  subtitle,
  Icon,
  onPress,
  trailing,
  danger = false,
  disabled = false,
  showChevron = Boolean(onPress),
}) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={title}
      disabled={disabled || !onPress}
      onPress={onPress}
      className={`min-h-[76px] flex-row items-center gap-4 px-3 py-3 ${
        onPress && !disabled ? 'active:opacity-65' : ''
      }`}
    >
      {Icon ? (
        <View
          className={`h-11 w-11 items-center justify-center rounded-[14px] ${
            danger ? 'bg-[#FCE9EA]' : 'bg-[#E7E7EA]'
          }`}
        >
          <Icon width={24} height={24} />
        </View>
      ) : null}

      <View className="min-w-0 flex-1">
        <Text
          className={`font-inter-semibold text-[17px] leading-[22px] ${
            danger ? 'text-[#B83A45]' : 'text-[#181027]'
          }`}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text className="mt-1 font-inter-medium text-[13px] leading-[18px] text-[#918B9D]">
            {subtitle}
          </Text>
        ) : null}
      </View>

      {trailing}
      {showChevron && !trailing ? (
        <ChevronRight size={23} strokeWidth={2.3} color="#918B9D" />
      ) : null}
    </Pressable>
  );
}
