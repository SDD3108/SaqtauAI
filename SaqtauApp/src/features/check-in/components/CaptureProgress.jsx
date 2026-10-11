import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Rect } from 'react-native-svg';

import useI18n from '@/src/features/localization/hooks/useI18n';
import { captureCopy, captureProgress } from '@/src/features/check-in/utils/captureProgress.utils';

const BLUE = '#83C9FF';
const PERIMETER = 2 * (264 + 384 - 4 * 132) + 2 * Math.PI * 132;

// This outline shows elapsed recording time, not measured signal quality.
export function CaptureGuide({ recording, secondsLeft, duration = 60 }) {
  const { ratio } = captureProgress(secondsLeft, duration);
  return (
    <View
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.guide}
    >
      <Svg width="100%" height="100%" viewBox="0 0 270 390">
        <Rect x={3} y={3} width={264} height={384} rx={132}
          fill="none" stroke="white" strokeOpacity={recording ? 0.35 : 0.9}
          strokeWidth={2} />
        {recording && ratio > 0 ? (
          <Rect x={3} y={3} width={264} height={384} rx={132}
            fill="none" stroke={BLUE} strokeWidth={4} strokeLinecap="round"
            strokeDasharray={[PERIMETER, PERIMETER]}
            strokeDashoffset={PERIMETER * (1 - ratio)} />
        ) : null}
      </Svg>
    </View>
  );
}

function useReducedMotion() {
  // Keep motion disabled until the accessibility preference is known.
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    let active = true;
    let changed = false;
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (value) => {
      changed = true;
      if (active) setReduced(value);
    });
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => { if (active && !changed) setReduced(value); })
      .catch(() => {});
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);
  return reduced;
}

export default function CaptureProgress({ secondsLeft, duration = 60 }) {
  const { language } = useI18n();
  const copy = captureCopy(language);
  const { ratio, stage, finishing } = captureProgress(secondsLeft, duration);
  const reduced = useReducedMotion();
  const fill = useRef(new Animated.Value(ratio)).current;
  const fade = useRef(new Animated.Value(1)).current;
  const [trackWidth, setTrackWidth] = useState(0);
  const [title, body] = finishing
    ? [copy.finishing, copy.finishingBody]
    : copy.stages[stage];

  useEffect(() => {
    if (reduced) {
      fill.setValue(ratio);
      return;
    }
    const animation = Animated.timing(fill, {
      toValue: ratio,
      duration: 850,
      easing: Easing.linear,
      useNativeDriver: true,
      isInteraction: false,
    });
    animation.start();
    return () => animation.stop();
  }, [ratio, reduced, fill]);

  useEffect(() => {
    if (reduced) {
      fade.setValue(1);
      return;
    }
    fade.setValue(0.65);
    const animation = Animated.timing(fade, {
      toValue: 1,
      duration: 550,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
      isInteraction: false,
    });
    animation.start();
    return () => animation.stop();
  }, [stage, finishing, reduced, fade]);

  return (
    <View className="mt-4">
      <View className="flex-row items-center justify-between">
        <Text className="font-inter-medium text-[11px] text-white/65">
          {copy.part} {stage + 1} {copy.of} 4
        </Text>
        <View style={styles.steps} accessible={false} accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants">
          {[0, 1, 2, 3].map((index) => (
            <View key={index} style={[styles.step, {
              backgroundColor: index <= stage ? BLUE : 'rgba(255,255,255,0.18)',
            }]} />
          ))}
        </View>
      </View>

      <Animated.View style={{ opacity: fade }}>
        <Text style={{ minHeight: 48 }} className="mt-2 text-center font-inter-semibold text-[18px] leading-[24px] text-white">
          {title}
        </Text>
        <Text style={{ minHeight: 38 }} className="mt-1 text-center font-inter text-[13px] leading-[19px] text-white/75">
          {body}
        </Text>
      </Animated.View>

      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={copy.progress}
        accessibilityValue={{ min: 0, max: 100, now: Math.round(ratio * 100) }}
        onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
        style={styles.track}
      >
        <Animated.View style={[styles.fill, { opacity: trackWidth > 0 ? 1 : 0, transform: [{
          translateX: fill.interpolate({
            inputRange: [0, 1],
            outputRange: [-trackWidth, 0],
            extrapolate: 'clamp',
          }),
        }] }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  guide: { flex: 1, width: '100%', maxWidth: 270, maxHeight: 390, minHeight: 60 },
  steps: { flexDirection: 'row', gap: 5 },
  step: { width: 19, height: 4, borderRadius: 2 },
  track: { marginTop: 14, height: 5, borderRadius: 3, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.15)' },
  fill: { width: '100%', height: '100%', borderRadius: 3, backgroundColor: BLUE },
});
