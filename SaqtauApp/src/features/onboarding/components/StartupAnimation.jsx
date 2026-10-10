import useI18n from '@/src/features/localization/hooks/useI18n';
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
  const { t } = useI18n();
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
          {t('onboarding.startupErrorTitle')}
        </Text>

        <Text className="font-inter mt-3 max-w-[310px] text-center text-[16px] leading-6 text-[#807B89]">
          {t('onboarding.startupErrorBody')}
        </Text>

        <Pressable
          accessibilityRole="button"
          className="mt-8 h-14 min-w-[180px] items-center justify-center rounded-2xl bg-[#181027] active:opacity-90"
          onPress={onRetry}
        >
          <Text className="font-inter-medium text-[16px] text-[#ECECEC]">
            {t('common.retry')}
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

// import { useEffect, useRef, useState } from 'react';
// import {
//   AccessibilityInfo,
//   Animated,
//   Easing,
//   Pressable,
//   Text,
//   View,
// } from 'react-native';

// import Logo from '@/assets/images/Logo.svg';

// /* ------------------------------------------------------------------ *
//  *  Настройки анимации — крути здесь
//  * ------------------------------------------------------------------ */

// /** Стартовый размер логотипа: гигантский, по центру экрана. */
// const LOGO_START_SIZE = 120;
// /** Финальный размер логотипа после сжатия. */
// const LOGO_END_SIZE = 50;
// const LOGO_END_SCALE = LOGO_END_SIZE / LOGO_START_SIZE;

// /** Зазор между логотипом и надписью «SaqtauAI». */
// const BRAND_GAP = 14;

// /**
//  * Финальное смещение надписи вправо от центра сцены.
//  * Выведено из условия, что связка «логотип + текст» центрируется целиком:
//  *   LOGO_END_SIZE / 2 + BRAND_GAP / 2
//  */
// const BRAND_END_X = LOGO_END_SIZE / 2 + BRAND_GAP / 2;
// /** Насколько надпись «выезжает» справа в момент появления. */
// const BRAND_SLIDE_IN = 24;

// const GROUP_END_Y = -170;

// const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);

// export default function StartupAnimation({
//   error,
//   onAnimationComplete,
//   onRetry,
// }) {
//   const logoOpacity = useRef(new Animated.Value(0)).current;
//   const logoScale = useRef(new Animated.Value(0.88)).current;
//   const logoX = useRef(new Animated.Value(0)).current;
//   const brandOpacity = useRef(new Animated.Value(0)).current;
//   const brandX = useRef(
//     new Animated.Value(BRAND_END_X + BRAND_SLIDE_IN),
//   ).current;
//   const groupY = useRef(new Animated.Value(0)).current;
//   const hasFinished = useRef(false);

//   const [brandWidth, setBrandWidth] = useState(null);

//   const handleBrandLayout = (event) => {
//     if (brandWidth != null) {
//       return;
//     }
//     setBrandWidth(event.nativeEvent.layout.width);
//   };

//   useEffect(() => {
//     if (brandWidth == null) {
//       return;
//     }

//     let cancelled = false;

//     const finish = () => {
//       if (cancelled || hasFinished.current) {
//         return;
//       }

//       hasFinished.current = true;
//       onAnimationComplete?.();
//     };
//     const logoEndX = -(BRAND_GAP + brandWidth) / 2;

//     const start = async () => {
//       const reduceMotion = await AccessibilityInfo.isReduceMotionEnabled();

//       if (cancelled) {
//         return;
//       }

//       if (reduceMotion) {
//         logoOpacity.setValue(1);
//         logoScale.setValue(LOGO_END_SCALE);
//         logoX.setValue(logoEndX);
//         brandOpacity.setValue(1);
//         brandX.setValue(BRAND_END_X);
//         groupY.setValue(GROUP_END_Y);
//         finish();
//         return;
//       }
//       logoOpacity.setValue(0);
//       logoScale.setValue(0.88);
//       logoX.setValue(0);
//       brandOpacity.setValue(0);
//       brandX.setValue(BRAND_END_X + BRAND_SLIDE_IN);
//       groupY.setValue(0);

//       Animated.sequence([
//         Animated.parallel([
//           Animated.timing(logoOpacity, {
//             toValue: 1,
//             duration: 380,
//             easing: Easing.out(Easing.quad),
//             useNativeDriver: true,
//           }),
//           Animated.spring(logoScale, {
//             toValue: 1,
//             damping: 14,
//             stiffness: 110,
//             mass: 0.8,
//             useNativeDriver: true,
//           }),
//         ]),

//         Animated.delay(160),
//         Animated.parallel([
//           Animated.timing(logoScale, {
//             toValue: LOGO_END_SCALE,
//             duration: 640,
//             easing: EASE_OUT,
//             useNativeDriver: true,
//           }),
//           Animated.timing(logoX, {
//             toValue: logoEndX,
//             duration: 640,
//             easing: EASE_OUT,
//             useNativeDriver: true,
//           }),
//           Animated.timing(brandOpacity, {
//             toValue: 1,
//             duration: 460,
//             delay: 160,
//             easing: Easing.out(Easing.quad),
//             useNativeDriver: true,
//           }),
//           Animated.timing(brandX, {
//             toValue: BRAND_END_X,
//             duration: 560,
//             delay: 160,
//             easing: EASE_OUT,
//             useNativeDriver: true,
//           }),
//         ]),

//         Animated.delay(100),
//         Animated.delay(500),
//       ]).start(({ finished }) => {
//         if (finished) {
//           finish();
//         }
//       });
//     };

//     start();

//     return () => {
//       cancelled = true;
//       logoOpacity.stopAnimation();
//       logoScale.stopAnimation();
//       logoX.stopAnimation();
//       brandOpacity.stopAnimation();
//       brandX.stopAnimation();
//       groupY.stopAnimation();
//     };
//   }, [
//     brandWidth,
//     brandOpacity,
//     brandX,
//     groupY,
//     logoOpacity,
//     logoScale,
//     logoX,
//     onAnimationComplete,
//   ]);

//   if (error) {
//     console.log("error: ", error);
//     return (
//       <View className="flex-1 items-center justify-center bg-[#ECECEC] px-8">
//         <Text className="font-inter-bold text-center text-[22px] leading-7 text-[#181027]">
//           Couldn’t connect to SaqtauAI
//         </Text>

//         <Text className="font-inter mt-3 max-w-[310px] text-center text-[16px] leading-6 text-[#807B89]">
//           Check your internet connection and try again.
//         </Text>

//         <Pressable
//           accessibilityRole="button"
//           className="mt-8 h-14 min-w-[180px] items-center justify-center rounded-2xl bg-[#181027] active:opacity-90"
//           onPress={onRetry}
//         >
//           <Text className="font-inter-medium text-[16px] text-[#ECECEC]">
//             Try again
//           </Text>
//         </Pressable>
//       </View>
//     );
//   }
  

//   return (
//     <View className="flex-1 items-center justify-center bg-[#ECECEC]">
//       {/* Вся группа: поднимается вверх на третьем шаге */}
//       <Animated.View style={{ transform: [{ translateY: groupY }] }}>
//         {/* Логотип: появляется → сжимается → уезжает влево */}
//         <Animated.View
//           style={{
//             width: LOGO_START_SIZE,
//             height: LOGO_START_SIZE,
//             alignItems: 'center',
//             justifyContent: 'center',
//             opacity: logoOpacity,
//             transform: [{ translateX: logoX }, { scale: logoScale }],
//           }}
//         >
//           <Logo width={LOGO_START_SIZE} height={LOGO_START_SIZE} />
//         </Animated.View>

//         {/* Надпись: лежит поверх группы и центрируется по её центру,
//             поэтому финальный сдвиг вправо — константа BRAND_END_X */}
//         <Animated.View
//           pointerEvents="none"
//           style={{
//             position: 'absolute',
//             left: 0,
//             right: 0,
//             top: 0,
//             bottom: 0,
//             alignItems: 'center',
//             justifyContent: 'center',
//             opacity: brandOpacity,
//             transform: [{ translateX: brandX }],
//           }}
//         >
//           <Text
//             onLayout={handleBrandLayout}
//             className="font-inter-medium text-[18px] text-[#181027]"
//           >
//             SaqtauAI
//           </Text>
//         </Animated.View>
//       </Animated.View>
//     </View>
//   );
// }