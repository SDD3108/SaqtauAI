import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { useOnboardingStore } from '@/features/onboarding/onboarding.store';

export default function WelcomeScreen() {
  const completeWelcome = useOnboardingStore((state) => state.completeWelcome);

  const handleStartCheckIn = async () => {
    await completeWelcome();
    router.push('/(check-in)');
  };

  return (
    <View className="flex-1 bg-[#ECECEC] px-8 pb-12 pt-24">
      <View className="flex-1 items-center justify-center">
        <Text className="text-4xl font-bold text-[#181027]">SaqtauAI</Text>
        <Text className="mt-14 text-center text-[32px] font-extrabold leading-10 text-[#181027]">
          Know your body, gently.
        </Text>
        <Text className="mt-5 text-center text-lg leading-7 text-[#807B89]">
          A calm 60-second check-in with Saqtau AI.
        </Text>
      </View>

      <Pressable
        className="items-center rounded-xl bg-[#181027] py-5"
        onPress={handleStartCheckIn}
      >
        <Text className="text-lg font-semibold text-[#ECECEC]">Start check-in</Text>
      </Pressable>

      <Pressable className="mt-7 items-center" onPress={() => router.push('/(auth)/sign-in')}>
        <Text className="text-lg font-medium text-[#181027]">Sign in</Text>
      </Pressable>
    </View>
  );
}



// import React from 'react';
// import {Image,Pressable,Text,useWindowDimensions,View,} from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';

// const DESIGN_WIDTH = 1194;
// const DESIGN_HEIGHT = 2584;

// import Logo2 from '@/assets/images/Logo2.png';

// const WelcomeBrand = () => {
//     const { width, height } = useWindowDimensions();
//     const scale = width / DESIGN_WIDTH;
//     const verticalScale = height / (DESIGN_HEIGHT * scale);

//     return (
//         <SafeAreaView className="flex-1 bg-[#ECECEC]" edges={['top', 'bottom']}>
//             <View className="flex-1 items-center">
//                 <View className="w-full items-center" style={{paddingTop: 185,}}>
//                     <Image source={Logo2} resizeMode="contain" style={{width: 704,height: 60,}}/>
//                     <Text className="text-center font-extrabold text-[#181027]"
//                         style={{
//                             width: 780.957 * scale,
//                             marginTop: 250 * scale * verticalScale,
//                             fontSize: 100.596 * scale,
//                             lineHeight: 130.183 * scale,
//                             letterSpacing: -5.0272 * scale,
//                         }}
//                     >
//                     Know your body, gently.
//                     </Text>
//                     <Text className="text-center font-medium text-[#807B89]"
//                         style={{
//                             width: 723.429 * scale,
//                             marginTop:  10,
//                             fontSize: 56.301 * scale,
//                             lineHeight: 72.86 * scale,
//                             letterSpacing: 0.788 * scale,
//                         }}  
//                     >
//                     A calm 60-second check-in with Saqtau AI.
//                     </Text>
//                 </View>
//                 <View className="absolute left-0 right-0 items-center" style={{bottom: 25}}>
//                     <Pressable onPress={() => router.push('/(check-in)')} className="items-center justify-center bg-[#181027]"
//                         style={{
//                             width: 959.056 * scale,
//                             height: 179.675 * scale,
//                             borderRadius: 31.522 * scale,
//                         }}
//                     >
//                         <Text className="font-medium text-[#ECECEC]"
//                             style={{
//                                 fontSize: 56.301 * scale,
//                                 lineHeight: 72.86 * scale,
//                                 letterSpacing: 0.788 * scale,
//                             }}
//                         >
//                         Start check-in
//                         </Text>
//                     </Pressable>
//                     <Pressable onPress={() => router.push('/(auth)/sign-in')} className="items-center" style={{marginTop: 18 * scale}}>
//                         <Text className="font-normal text-[#181027]"
//                             style={{
//                                 fontSize: 56.301 * scale,
//                                 lineHeight: 72.86 * scale,
//                                 letterSpacing: 0.788 * scale,
//                             }}
//                         >
//                         Sign in
//                         </Text>
//                     </Pressable>
//                 </View>
//             </View>
//         </SafeAreaView>
//     );
// };

// export default WelcomeBrand;