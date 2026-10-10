import { View } from 'react-native';

export default function ChatArtwork({ asset: Asset, nativeWidth, nativeHeight, width }) {
  const scale = width / nativeWidth;
  const height = nativeHeight * scale;
  return (
    <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width, height, overflow: 'hidden' }}>
      <View style={{ position: 'absolute', width: nativeWidth, height: nativeHeight, left: (width - nativeWidth) / 2, top: (height - nativeHeight) / 2, transform: [{ scale }] }}>
        <Asset />
      </View>
    </View>
  );
}
