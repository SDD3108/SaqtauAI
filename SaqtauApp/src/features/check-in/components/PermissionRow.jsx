import {
  Check,
  ChevronRight,
  CircleAlert,
} from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

function getStateMeta(permission, optional) {
  if (permission?.unavailable) {
    return {
      label: 'Unavailable',
      tone: 'text-[#A09AA8]',
      icon: 'alert',
    };
  }

  if (permission?.granted) {
    return {
      label: 'Allowed',
      tone: 'text-[#397A5A]',
      icon: 'check',
    };
  }

  if (permission?.status === 'denied') {
    return {
      label: optional ? 'Not allowed' : 'Required',
      tone: 'text-[#A45353]',
      icon: 'alert',
    };
  }

  return {
    label: optional ? 'Optional' : 'Required',
    tone: 'text-[#807B89]',
    icon: 'arrow',
  };
}

export default function PermissionRow({
  title,
  description,
  Icon,
  permission,
  optional = false,
  onPress,
}) {
  const meta = getStateMeta(permission, optional);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="mb-3 flex-row items-center rounded-[20px] bg-white px-4 py-4 active:opacity-80"
    >
      <View className="h-11 w-11 items-center justify-center rounded-2xl bg-[#F2F0F4]">
        <Icon
          size={21}
          strokeWidth={1.8}
          color="#181027"
        />
      </View>

      <View className="ml-3 flex-1 pr-2">
        <Text className="font-inter-semibold text-[16px] leading-[21px] text-[#181027]">
          {title}
        </Text>

        <Text className="mt-1 font-inter text-[13px] leading-[18px] text-[#807B89]">
          {description}
        </Text>
      </View>

      <View className="items-end">
        <Text
          className={`font-inter-medium text-[12px] ${meta.tone}`}
        >
          {meta.label}
        </Text>

        <View className="mt-2 h-6 w-6 items-center justify-center">
          {meta.icon === 'check' ? (
            <Check
              size={18}
              strokeWidth={2.2}
              color="#397A5A"
            />
          ) : null}

          {meta.icon === 'alert' ? (
            <CircleAlert
              size={18}
              strokeWidth={1.8}
              color="#A45353"
            />
          ) : null}

          {meta.icon === 'arrow' ? (
            <ChevronRight
              size={18}
              strokeWidth={1.8}
              color="#807B89"
            />
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
