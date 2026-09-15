import { HeartPulse } from 'lucide-react-native';
import { Path, Svg } from 'react-native-svg';
import { View } from 'react-native';

export default function HeartSignalGraphic() {
  return (
    <View className="items-end">
      <View className="h-[62px] w-[62px] items-center justify-center rounded-full bg-[#DDDCDD]">
        <HeartPulse
          size={32}
          strokeWidth={1.8}
          color="#181027"
        />
      </View>

      <Svg
        width={150}
        height={58}
        viewBox="0 0 150 58"
        style={{ marginTop: -5 }}
      >
        <Path
          d="M3 36H25L33 25L43 36H60L66 4L74 52L82 25L90 36H104L110 29L116 36H132L137 29L142 36H147"
          fill="none"
          stroke="#181027"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}
