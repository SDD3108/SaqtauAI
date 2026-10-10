import { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import HeroArtwork from '@/assets/images/ai-home/hero.svg';
import ChevronArtwork from '@/assets/images/ai-home/chevron.svg';
import ProgressIcon from '@/assets/images/progress.svg';
import FaceIdIcon from '@/assets/images/faceid.svg';
import ReflectIcon from '@/assets/images/reflect.svg';
import AirIcon from '@/assets/images/air.svg';
import StatsIcon from '@/assets/images/stats.svg';
import SuggestedAction from '@/src/features/ai/components/SuggestedAction';
import { useAiStore } from '@/src/features/ai/ai.store';
import useI18n from '@/src/features/localization/hooks/useI18n';

function openChat(prompt = '', autoSend = false) {
  router.push({
    pathname: '/(app)/ai/chat',
    params: {
      ...(prompt ? { prompt } : {}),
      ...(autoSend ? { autoSend: '1' } : {}),
    },
  });
}

// Scale the original Figma SVG as a whole, retaining its intrinsic dimensions.
function DesignArtwork({ asset: Asset, nativeWidth, nativeHeight, width }) {
  const scale = width / nativeWidth;
  const height = nativeHeight * scale;

  return (
    <View
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width, height, overflow: 'hidden' }}
    >
      <View
        style={{
          position: 'absolute',
          width: nativeWidth,
          height: nativeHeight,
          left: (width - nativeWidth) / 2,
          top: (height - nativeHeight) / 2,
          transform: [{ scale }],
        }}
      >
        <Asset />
      </View>
    </View>
  );
}

function PrimaryAction({ icon, label, onPress, scale }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="flex-row items-center bg-[#F7F7F8] active:opacity-70"
      style={{
        minHeight: 80 * scale,
        borderRadius: 15 * scale,
        paddingVertical: 12 * scale,
        paddingLeft: 17 * scale,
        paddingRight: 23 * scale,
        gap: 16 * scale,
      }}
    >
      <DesignArtwork asset={icon} nativeWidth={138} nativeHeight={138} width={49 * scale} />
      <Text
        className="flex-1 font-inter-semibold text-[#181027]"
        style={{ fontSize: 20 * scale, lineHeight: 27 * scale, letterSpacing: -0.45 * scale }}
      >
        {label}
      </Text>
      <DesignArtwork asset={ChevronArtwork} nativeWidth={31} nativeHeight={52} width={11 * scale} />
    </Pressable>
  );
}

export default function AskSaqtauAIScreen() {
  const { t } = useI18n();
  const messages = useAiStore((state) => state.messages);
  const { width } = useWindowDimensions();
  const [viewportHeight, setViewportHeight] = useState(0);
  const contentWidth = Math.min(width, 560);
  const scale = Math.min(contentWidth / 390, 1.18);
  const horizontalPadding = 22 * scale;

  return (
    <SafeAreaView className="flex-1 bg-[#ECECEC]" edges={['top', 'left', 'right']}>
      <ScrollView
        className="flex-1"
        onLayout={({ nativeEvent }) => setViewportHeight(nativeEvent.layout.height)}
        contentContainerStyle={{ alignItems: 'center', paddingBottom: 34 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ width: '100%', maxWidth: 560, paddingHorizontal: horizontalPadding }}>
          <View
            style={{
              minHeight: Math.max(640 * scale, viewportHeight),
              paddingTop: 32 * scale,
              paddingBottom: 24 * scale,
            }}
          >
            <View className="items-center">
              <DesignArtwork asset={HeroArtwork} nativeWidth={776} nativeHeight={215} width={276 * scale} />
              <Text
                accessibilityRole="header"
                className="mt-3 text-center font-inter-semibold text-[#181027]"
                style={{ fontSize: 46 * scale, lineHeight: 57 * scale, letterSpacing: -1.8 * scale }}
              >
                {t('ai.homeTitle')}
              </Text>
              <Text
                className="text-center font-inter-semibold text-[#181027]"
                style={{ marginTop: 15 * scale, fontSize: 18.5 * scale, lineHeight: 25 * scale, letterSpacing: -0.45 * scale }}
              >
                {t('ai.homeSubtitle')}
              </Text>
              <Text
                className="text-center font-inter-medium text-[#807B89]"
                style={{ marginTop: 12 * scale, maxWidth: 292 * scale, fontSize: 17 * scale, lineHeight: 21.5 * scale, letterSpacing: -0.25 * scale }}
              >
                {t('ai.homeDescription')}
              </Text>
            </View>

            <View style={{ flexGrow: 1, minHeight: 50 * scale }} />

            <View style={{ gap: 10 * scale }}>
              <PrimaryAction icon={ProgressIcon} label={t('ai.howDoing')} onPress={() => openChat(t('ai.howDoing'), true)} scale={scale} />
              <PrimaryAction icon={FaceIdIcon} label={t('ai.startCheckIn')} onPress={() => router.push('/(check-in)/permissions')} scale={scale} />
              <PrimaryAction icon={ReflectIcon} label={t('ai.reflect')} onPress={() => openChat(t('ai.reflect'), true)} scale={scale} />
            </View>
          </View>

          <View className="pb-2 pt-3">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('ai.messagePlaceholder')}
              onPress={() => openChat()}
              className="min-h-[58px] flex-row items-center rounded-[15px] bg-[#F7F7F8] px-5 py-3 active:opacity-75"
            >
              <Text className="flex-1 font-inter text-[16px] text-[#807B89]">{t('ai.messagePlaceholder')}</Text>
              <View className="ml-3 h-9 w-9 items-center justify-center rounded-full bg-[#181027]">
                <Text className="font-inter-semibold text-[19px] text-white">↑</Text>
              </View>
            </Pressable>

            {messages.length > 0 ? (
              <Pressable accessibilityRole="button" onPress={() => openChat()} className="mt-3 min-h-11 items-center justify-center self-center px-3 py-2">
                <Text className="text-center font-inter-semibold text-[14px] text-[#181027]">{t('ai.continueSession')}</Text>
              </Pressable>
            ) : null}

            <Text className="mb-3 mt-6 font-inter-semibold text-[13px] uppercase tracking-[0.8px] text-[#807B89]">{t('ai.suggestions')}</Text>
            <SuggestedAction icon={AirIcon} label={t('ai.breathing')} onPress={() => openChat(t('ai.breathing'), true)} />
            <SuggestedAction icon={StatsIcon} label={t('ai.trends')} onPress={() => router.push('/(app)/(tabs)/history')} />

            <Text className="mt-4 text-center font-inter text-[12px] leading-[18px] text-[#9A949F]">{t('ai.wellnessDisclaimer')}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
