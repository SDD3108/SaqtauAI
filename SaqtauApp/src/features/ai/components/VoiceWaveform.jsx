import { useMemo } from 'react';
import { View } from 'react-native';
import RecordingIcon from '@/assets/images/recording.svg';
import ChatArtwork from '@/src/features/ai/components/ChatArtwork';
import { meteringToLevel } from '@/src/features/ai/voice.utils';
import useReducedMotion from '@/src/components/runtime/useReducedMotion';

const PROFILE = [6, 6, 6, 6, 13, 27, 57, 35, 18, 6, 6];

export default function VoiceWaveform({ metering, durationMillis = 0, active }) {
  const reduceMotion = useReducedMotion();
  const bars = useMemo(() => {
    const level = active ? meteringToLevel(metering) : 0.18;
    const phase = reduceMotion ? 0 : Math.floor((Number(durationMillis) || 0) / 90);
    return PROFILE.map((height, index) => {
      const variation = active && !reduceMotion ? 0.8 + Math.abs(Math.sin((index + phase) * 0.66)) * 0.2 : 1;
      return Math.max(5, Math.round(height * (0.65 + 0.35 * level) * variation));
    });
  }, [active, durationMillis, metering, reduceMotion]);

  const side = (values, key) => (
    <View key={key} accessible={false} importantForAccessibility="no-hide-descendants" className="h-[94px] flex-1 flex-row items-center justify-between overflow-hidden">
      {values.map((height, index) => <View key={index} style={{ height }} className="w-[5px] rounded-full bg-[#A29FAA]" />)}
    </View>
  );

  return (
    <View accessible={false} importantForAccessibility="no-hide-descendants" className="w-full flex-row items-center gap-3">
      {side(bars, 'left')}
      <ChatArtwork asset={RecordingIcon} nativeWidth={248} nativeHeight={262} width={89} />
      {side([...bars].reverse(), 'right')}
    </View>
  );
}
