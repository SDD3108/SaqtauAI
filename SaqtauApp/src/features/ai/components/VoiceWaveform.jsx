import { useMemo } from 'react';
import { View } from 'react-native';

import { meteringToLevel } from '@/src/features/ai/voice.utils';
import useReducedMotion from '@/src/components/runtime/useReducedMotion';

const BAR_COUNT = 33;

export default function VoiceWaveform({ metering, durationMillis = 0, active }) {
  const reduceMotion = useReducedMotion();
  const bars = useMemo(() => {
    const level = active ? meteringToLevel(metering) : 0.18;
    const phase = reduceMotion ? 0 : Math.floor((Number(durationMillis) || 0) / 90);

    return Array.from({ length: BAR_COUNT }, (_, index) => {
      const wave = 0.3 + Math.abs(Math.sin((index + phase) * 0.66)) * 0.7;
      const centerBoost = 0.68 + 0.32 * Math.sin(((index + 1) / BAR_COUNT) * Math.PI);
      return 7 + Math.round(42 * level * wave * centerBoost);
    });
  }, [active, durationMillis, metering, reduceMotion]);

  return (
    <View accessible={false} importantForAccessibility="no-hide-descendants" className="h-[58px] flex-row items-center justify-center gap-[3px] overflow-hidden px-2">
      {bars.map((height, index) => (
        <View
          key={index}
          style={{ height }}
          className={`w-[3px] rounded-full ${active ? 'bg-[#208AEF]' : 'bg-[#C9C5CE]'}`}
        />
      ))}
    </View>
  );
}
