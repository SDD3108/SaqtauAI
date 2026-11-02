import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Text, View } from 'react-native';

import useI18n from '@/src/features/localization/hooks/useI18n';
import { processingCopy, processingPercent, uploadPercent } from '@/src/features/check-in/utils/processingProgress.utils';

function ProgressTrack({ percent, inactive = false, animate = false }) {
  const shimmer = useRef(new Animated.Value(0)).current;
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!animate || !width) return undefined;
    shimmer.setValue(0);
    const animation = Animated.loop(Animated.timing(shimmer, {
      toValue: 1,
      duration: 1800,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }));
    animation.start();
    return () => animation.stop();
  }, [animate, shimmer, width]);

  return (
    <View
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      className="mt-3 h-[8px] w-full overflow-hidden rounded-full bg-[#ECE9F0]"
      accessible
      accessibilityRole="progressbar"
      accessibilityValue={percent === null ? undefined : { min: 0, max: 100, now: percent }}
    >
      {percent !== null ? (
        <View className="h-full rounded-full bg-[#654E9A]" style={{ width: `${percent}%`, opacity: inactive ? 0.35 : 1 }} />
      ) : animate && width > 0 ? (
        <Animated.View
          className="h-full rounded-full bg-[#654E9A]"
          style={{
            width: width * 0.32,
            transform: [{ translateX: shimmer.interpolate({ inputRange: [0, 1], outputRange: [-width * 0.32, width] }) }],
          }}
        />
      ) : null}
    </View>
  );
}

export default function ProcessingProgress({ state, uploadProgress, measurement }) {
  const { language } = useI18n();
  const copy = processingCopy(language);
  const uploading = state === 'uploading';
  const value = uploading ? uploadPercent(uploadProgress) : state === 'completed' ? 100 : processingPercent(measurement);
  return (
    <View className="mt-5 rounded-[16px] bg-white px-4 py-3">
      <View className="flex-row items-center justify-between gap-2">
        <Text className="flex-1 font-inter-semibold text-[13px] text-[#51495F]">
          {uploading ? copy.upload : copy.analyze}
        </Text>
        {value !== null && <Text className="font-inter-semibold text-[13px] text-[#654E9A]">{value}%</Text>}
      </View>
      <ProgressTrack percent={value} animate={value === null} />
    </View>
  );
}
