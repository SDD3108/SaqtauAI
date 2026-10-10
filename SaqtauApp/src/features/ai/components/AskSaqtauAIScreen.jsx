import useI18n from '@/src/features/localization/hooks/useI18n';
import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import MessageIcon from '@/assets/images/message.svg';
import ProgressIcon from '@/assets/images/progress.svg';
import FaceIdIcon from '@/assets/images/faceid.svg';
import ReflectIcon from '@/assets/images/reflect.svg';
import AirIcon from '@/assets/images/air.svg';
import StatsIcon from '@/assets/images/stats.svg';
import SuggestedAction from '@/src/features/ai/components/SuggestedAction';
import { useAiStore } from '@/src/features/ai/ai.store';

function openChat(prompt = '', autoSend = false) {
  router.push({
    pathname: '/(app)/ai/chat',
    params: {
      ...(prompt ? { prompt } : {}),
      ...(autoSend ? { autoSend: '1' } : {}),
    },
  });
}

export default function AskSaqtauAIScreen() {
  const { t } = useI18n();
  const messages = useAiStore((state) => state.messages);

  return (
    <SafeAreaView className="flex-1 bg-[#ECECEC]" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 34 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center pt-8">
          <MessageIcon width={74} height={74} />
          <Text className="mt-5 text-center font-inter-extrabold text-[34px] leading-[39px] tracking-[-1.2px] text-[#181027]">
            {t('ai.homeTitle')}
          </Text>
          <Text className="mt-3 max-w-[320px] text-center font-inter text-[16px] leading-6 text-[#77717F]">
            {t('ai.homeBody')}
          </Text>
        </View>

        <Pressable
          onPress={() => openChat()}
          className="mt-8 min-h-[58px] flex-row items-center rounded-[22px] bg-white px-5 active:opacity-75"
        >
          <Text className="flex-1 font-inter text-[16px] text-[#8A8491]">
            {t('ai.messagePlaceholder')}
          </Text>
          <View className="h-9 w-9 items-center justify-center rounded-full bg-[#208AEF]">
            <Text className="font-inter-semibold text-[19px] text-white">↑</Text>
          </View>
        </Pressable>

        {messages.length > 0 ? (
          <Pressable
            onPress={() => openChat()}
            className="mt-3 self-center px-3 py-2"
          >
            <Text className="font-inter-semibold text-[14px] text-[#208AEF]">
              {t('ai.continueSession')}
            </Text>
          </Pressable>
        ) : null}

        <Text className="mb-3 mt-7 font-inter-semibold text-[14px] uppercase tracking-[0.8px] text-[#8D8793]">
          {t('ai.suggestions')}
        </Text>

        <SuggestedAction
          icon={ProgressIcon}
          label={t('ai.howDoing')}
          onPress={() => openChat(t('ai.howDoing'), true)}
        />
        <SuggestedAction
          icon={FaceIdIcon}
          label={t('ai.startCheckIn')}
          onPress={() => router.push('/(check-in)/permissions')}
        />
        <SuggestedAction
          icon={ReflectIcon}
          label={t('ai.reflect')}
          onPress={() =>
            openChat(t('ai.reflect'), true)
          }
        />
        <SuggestedAction
          icon={AirIcon}
          label={t('ai.breathing')}
          onPress={() =>
            openChat(t('ai.breathing'), true)
          }
        />
        <SuggestedAction
          icon={StatsIcon}
          label={t('ai.trends')}
          onPress={() => router.push('/(app)/(tabs)/history')}
        />

        <Text className="mt-4 text-center font-inter text-[12px] leading-[18px] text-[#9A949F]">
          {t('ai.wellnessDisclaimer')}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
