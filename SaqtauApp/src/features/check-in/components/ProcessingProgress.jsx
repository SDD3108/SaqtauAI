import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import { Check, CloudUpload, HeartPulse } from 'lucide-react-native';

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

function StepIcon({ done, active, children }) {
  return (
    <View className="h-10 w-10 items-center justify-center rounded-[12px]" style={{ backgroundColor: done ? '#E4F3E8' : active ? '#EBE6F6' : '#F1EFF3' }}>
      {done ? <Check size={21} strokeWidth={2.4} color="#397A5A" /> : children}
    </View>
  );
}

export default function ProcessingProgress({ state, uploadProgress, measurement }) {
  const { language } = useI18n();
  const copy = processingCopy(language);
  const uploading = state === 'uploading' || state === 'upload-error';
  const offline = state === 'offline';
  const complete = state === 'completed';
  const failed = state === 'failed';
  const uploadDone = !uploading;
  const actualAnalysisPercent = processingPercent(measurement);
  const analysisValue = complete ? 100 : failed ? null : actualAnalysisPercent;
  const uploadValue = uploadDone ? 100 : uploadPercent(uploadProgress);

  return (
    <View className="mt-8 w-full max-w-[360px] rounded-[24px] bg-white px-5 py-5">
      <Text className="mb-5 font-inter-semibold text-[17px] text-[#181027]">{copy.title}</Text>

      <View className="flex-row items-center">
        <StepIcon done={uploadDone} active={uploading}><CloudUpload size={21} color={uploading ? '#654E9A' : '#938D9A'} /></StepIcon>
        <View className="ml-3 flex-1">
          <Text className="font-inter-semibold text-[14px] text-[#181027]">{copy.upload}</Text>
          <Text className="mt-0.5 font-inter text-[12px] text-[#8B8691]">{uploadDone ? copy.finished : copy.uploading}</Text>
        </View>
        <Text className="font-inter-semibold text-[14px] text-[#654E9A]">{uploadValue}%</Text>
      </View>
      <ProgressTrack percent={uploadValue} inactive={uploadDone} />

      <View className="my-5 h-px bg-[#EFEDF0]" />

      <View className="flex-row items-center">
        <StepIcon done={complete} active={!uploading && !failed && !offline}><HeartPulse size={21} color={!uploading && !failed && !offline ? '#654E9A' : '#938D9A'} /></StepIcon>
        <View className="ml-3 flex-1">
          <Text className="font-inter-semibold text-[14px] text-[#181027]">{copy.analyze}</Text>
          <Text className="mt-0.5 font-inter text-[12px] text-[#8B8691]">
            {complete ? copy.finished : offline ? copy.retrying : uploading ? copy.waiting : failed ? copy.retrying : copy.analyzing}
          </Text>
        </View>
        <Text className="font-inter-semibold text-[14px] text-[#654E9A]">
          {analysisValue === null ? '—' : `${analysisValue}%`}
        </Text>
      </View>
      <ProgressTrack
        percent={uploading || offline || failed ? 0 : analysisValue}
        inactive={uploading || offline || failed}
        animate={!uploading && !offline && !failed && !complete && analysisValue === null}
      />
      {!uploading && !failed && !complete && analysisValue === null ? (
        <Text className="mt-3 font-inter text-[12px] text-[#8B8691]">{copy.noEstimate}</Text>
      ) : null}
    </View>
  );
}
