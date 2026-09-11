// import React from 'react';
// import {
//   Image,
//   Pressable,
//   Text,
//   useWindowDimensions,
//   View,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// const DESIGN_WIDTH = 1194;
// const DESIGN_HEIGHT = 2584;
// import Logo2 from '@/assets/images/Logo2.png';
// export default function WelcomeScreen({ onStart, onSignIn }) {
//   const { width, height } = useWindowDimensions();

//   const scale = width / DESIGN_WIDTH;
//   const verticalScale = height / (DESIGN_HEIGHT * scale);

//   return (
//     <SafeAreaView
//       className="flex-1 bg-[#ECECEC]"
//       edges={['top', 'bottom']}
//     >
//       <View className="flex-1 items-center">
//         <View className="w-full items-center"
//           style={{
//             paddingTop: 726.58 * scale * verticalScale,
//           }}
//         >
//           <Image source={Logo2} resizeMode="contain"
//             style={{
//               width: 704 ,
//               height: 60 ,
//             }}
//           />

//           <Text
//             className="text-center font-extrabold text-[#181027]"
//             style={{
//               width: 780.957 * scale,
//               marginTop: 381.13 * scale * verticalScale,
//               fontSize: 100.596 * scale,
//               lineHeight: 130.183 * scale,
//               letterSpacing: -5.0272 * scale,
//             }}
//           >
//             Know your body, gently.
//           </Text>

//           <Text
//             className="text-center font-medium text-[#807B89] "
//             style={{
//               width: 723.429 * scale,
//               marginTop: 165.87 * scale * verticalScale,
//               fontSize: 56.301 * scale,
//               lineHeight: 72.86 * scale,
//               letterSpacing: 0.788 * scale,
//             }}
//           >
//             A calm 60-second check-in with Saqtau AI.
//           </Text>
//         </View>

//         <View
//           className="absolute left-0 right-0 items-center"
//           style={{
//             bottom: 55 * scale,
//           }}
//         >
//           <Pressable
//             onPress={onStart}
//             className="items-center justify-center bg-[#181027]"
//             style={{
//               width: 959.056 * scale,
//               height: 179.675 * scale,
//               borderRadius: 31.522 * scale,
//             }}
//           >
//             <Text
//               className="font-medium text-[#ECECEC]"
//               style={{
//                 fontSize: 56.301 * scale,
//                 lineHeight: 72.86 * scale,
//                 letterSpacing: 0.788 * scale,
//               }}
//             >
//               Start check-in
//             </Text>
//           </Pressable>

//           <Pressable
//             onPress={onSignIn}
//             className="items-center"
//             style={{
//               marginTop: 18 * scale,
//             }}
//           >
//             <Text
//               className="font-normal text-[#181027]"
//               style={{
//                 fontSize: 56.301 * scale,
//                 lineHeight: 72.86 * scale,
//                 letterSpacing: 0.788 * scale,
//               }}
//             >
//               Sign in
//             </Text>
//           </Pressable>
//         </View>
//       </View>
//     </SafeAreaView>
//   );
// }


import React from 'react';
import {
  Image,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const DESIGN_WIDTH = 1194;
const DESIGN_HEIGHT = 2584;

import Logo2 from '@/assets/images/Logo2.png';

export default function WelcomeScreen({ onStart, onSignIn }) {
  const { width, height } = useWindowDimensions();

  const scale = width / DESIGN_WIDTH;
  const verticalScale = height / (DESIGN_HEIGHT * scale);

  return (
    <SafeAreaView
      className="flex-1 bg-[#ECECEC]"
      edges={['top', 'bottom']}
    >
      <View className="flex-1 items-center">
        <View
          className="w-full items-center"
          style={{
            paddingTop: 185,
          }}
        >
          <Image
            source={Logo2}
            resizeMode="contain"
            style={{
              width: 704,
              height: 60,
            }}
          />

          <Text
            className="text-center font-extrabold text-[#181027]"
            style={{
              width: 780.957 * scale,
              marginTop: 250 * scale * verticalScale,
              fontSize: 100.596 * scale,
              lineHeight: 130.183 * scale,
              letterSpacing: -5.0272 * scale,
            }}
          >
            Know your body, gently.
          </Text>

          <Text
            className="text-center font-medium text-[#807B89]"
            style={{
              width: 723.429 * scale,
              marginTop:  10,
              fontSize: 56.301 * scale,
              lineHeight: 72.86 * scale,
              letterSpacing: 0.788 * scale,
            }}
          >
            A calm 60-second check-in with Saqtau AI.
          </Text>
        </View>

        <View
          className="absolute left-0 right-0 items-center"
          style={{
            bottom: 25,
          }}
        >
          <Pressable
            onPress={onStart}
            className="items-center justify-center bg-[#181027]"
            style={{
              width: 959.056 * scale,
              height: 179.675 * scale,
              borderRadius: 31.522 * scale,
            }}
          >
            <Text
              className="font-medium text-[#ECECEC]"
              style={{
                fontSize: 56.301 * scale,
                lineHeight: 72.86 * scale,
                letterSpacing: 0.788 * scale,
              }}
            >
              Start check-in
            </Text>
          </Pressable>

          <Pressable
            onPress={onSignIn}
            className="items-center"
            style={{
              marginTop: 18 * scale,
            }}
          >
            <Text
              className="font-normal text-[#181027]"
              style={{
                fontSize: 56.301 * scale,
                lineHeight: 72.86 * scale,
                letterSpacing: 0.788 * scale,
              }}
            >
              Sign in
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}