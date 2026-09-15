import { useEffect, useRef } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Pressable,
  Text,
  View,
} from 'react-native';

import Logo from '@/assets/images/Logo.svg';

export default function StartupAnimation({
  error,
  onAnimationComplete,
  onRetry,
}) {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.88)).current;
  const brandOpacity = useRef(new Animated.Value(0)).current;
  const hasFinished = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const finish = () => {
      if (cancelled || hasFinished.current) {
        return;
      }

      hasFinished.current = true;
      onAnimationComplete?.();
    };

    const start = async () => {
      const reduceMotion = await AccessibilityInfo.isReduceMotionEnabled();

      if (cancelled) {
        return;
      }

      if (reduceMotion) {
        logoOpacity.setValue(1);
        logoScale.setValue(1);
        brandOpacity.setValue(1);
        finish();
        return;
      }

      Animated.sequence([
        Animated.parallel([
          Animated.timing(logoOpacity, {
            toValue: 1,
            duration: 450,
            useNativeDriver: true,
          }),
          Animated.spring(logoScale, {
            toValue: 1,
            damping: 14,
            stiffness: 110,
            mass: 0.8,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(250),
        Animated.timing(brandOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.delay(450),
      ]).start(({ finished }) => {
        if (finished) {
          finish();
        }
      });
    };

    start();

    return () => {
      cancelled = true;
      logoOpacity.stopAnimation();
      logoScale.stopAnimation();
      brandOpacity.stopAnimation();
    };
  }, [brandOpacity, logoOpacity, logoScale, onAnimationComplete]);

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-[#ECECEC] px-8">
        <Text className="font-inter-bold text-center text-[22px] leading-7 text-[#181027]">
          Couldn’t connect to SaqtauAI
        </Text>

        <Text className="font-inter mt-3 max-w-[310px] text-center text-[16px] leading-6 text-[#807B89]">
          Check your internet connection and try again.
        </Text>

        <Pressable
          accessibilityRole="button"
          className="mt-8 h-14 min-w-[180px] items-center justify-center rounded-2xl bg-[#181027] active:opacity-90"
          onPress={onRetry}
        >
          <Text className="font-inter-medium text-[16px] text-[#ECECEC]">
            Try again
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center bg-[#ECECEC]">
      <Animated.View
        style={{
          opacity: logoOpacity,
          transform: [{ scale: logoScale }],
        }}
      >
        <Logo width={150} height={48} />
      </Animated.View>

      <Animated.View
        style={{
          opacity: brandOpacity,
          marginTop: 20,
        }}
      >
        <Text className="font-inter-medium text-center text-[18px] text-[#181027]">
          SaqtauAI
        </Text>
      </Animated.View>
    </View>
  );
}
