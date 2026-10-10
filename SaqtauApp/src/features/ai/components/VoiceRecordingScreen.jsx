import { getCurrentLanguage, tNow } from '@/src/features/localization/localization.store';
import useI18n from '@/src/features/localization/hooks/useI18n';
import { router } from 'expo-router';
import { ChevronLeft, LockKeyhole, Pause, Play, Send as SendOutline, Settings, X } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Linking,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import StopIcon from '@/assets/images/stop.svg';
import { transcribeAiAudio } from '@/src/features/ai/ai.api';
import AIChatNavigation from '@/src/features/ai/components/AIChatNavigation';
import ChatArtwork from '@/src/features/ai/components/ChatArtwork';
import VoiceWaveform from '@/src/features/ai/components/VoiceWaveform';
import useVoiceRecorder, {
  deleteVoiceRecording,
} from '@/src/features/ai/hooks/useVoiceRecorder';
import { formatVoiceDuration } from '@/src/features/ai/voice.utils';

function statusTitle(phase) {
  if (phase === 'requesting') return tNow('ai.voiceGettingReady');
  if (phase === 'paused') return tNow('ai.voicePaused');
  if (phase === 'ready') return tNow('ai.voiceReady');
  if (phase === 'denied') return tNow('ai.voicePermission');
  if (phase === 'error') return tNow('ai.voiceUnavailable');
  return tNow('ai.voiceListening');
}

export default function VoiceRecordingScreen() {
  const { t } = useI18n();
  const {
    phase,
    uri,
    error,
    recorderState,
    start,
    pause,
    resume,
    stop,
    discard,
  } = useVoiceRecorder({ autoStart: true });
  const [viewportHeight, setViewportHeight] = useState(0);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');

  const isActive = phase === 'recording';
  const canControl = phase === 'recording' || phase === 'paused';
  const canSend = Boolean(uri) || canControl;

  const cancel = async () => {
    if (sending) return;
    await discard();
    router.back();
  };

  const send = async () => {
    if (!canSend || sending) return;

    setSending(true);
    setSendError('');
    let recordingUri = uri;

    try {
      if (!recordingUri) {
        recordingUri = await stop();
      }

      if (!recordingUri) {
        throw new Error(t('ai.voiceNoRecording'));
      }

      const result = await transcribeAiAudio({ uri: recordingUri, lang: getCurrentLanguage() });

      await deleteVoiceRecording(recordingUri);

      router.replace({
        pathname: '/(app)/ai/chat',
        params: {
          prompt: result.transcript,
          autoSend: '1',
          source: 'voice',
        },
      });
    } catch (transcriptionError) {
      setSendError(
        transcriptionError?.message ||
          t('ai.voiceTranscribeError'),
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#ECECEC]" edges={['top', 'bottom', 'left', 'right']}>
      <View className="w-full max-w-[620px] flex-row items-center self-center px-3 pb-0.5 pt-5">
        <Pressable accessibilityRole="button" accessibilityLabel={t('ai.goBack')} disabled={sending} onPress={cancel} className="h-11 w-11 items-center justify-center rounded-full active:opacity-60">
          <ChevronLeft size={28} strokeWidth={2.5} color="#8E879B" />
        </Pressable>
        <Text accessibilityRole="header" className="flex-1 px-1 text-center font-inter-semibold text-[26px] leading-[33px] tracking-[-0.7px] text-[#181027]">{t('ai.homeTitle')}</Text>
        <View className="h-11 w-11" />
      </View>

      <ScrollView className="flex-1" onLayout={({ nativeEvent }) => setViewportHeight(nativeEvent.layout.height)} contentContainerStyle={{ alignItems: 'center', flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="w-full max-w-[620px] px-4 pb-5" style={{ minHeight: Math.max(600, viewportHeight) }}>
          <View style={{ flexGrow: 1.5, minHeight: 92 }} />
          <View className="items-center">
            <VoiceWaveform metering={recorderState?.metering} durationMillis={recorderState?.durationMillis} active={isActive} />
            <Text accessibilityLiveRegion="polite" className="mt-4 text-center font-inter-semibold text-[32px] leading-[40px] tracking-[-0.8px] text-[#181027]">
              {sending ? t('ai.voiceTranscribing') : isActive ? t('ai.voiceListeningDesign') : statusTitle(phase)}
            </Text>
            <Text className="mt-4 max-w-[250px] text-center font-inter-medium text-[15px] leading-[21px] text-[#807B89]">{t('ai.voiceCaptureHint')}</Text>
            <Text accessibilityLabel={t('ai.voiceDuration')} className="mt-2 text-center font-inter-medium text-[12px] tabular-nums text-[#807B89]">{formatVoiceDuration(recorderState?.durationMillis)}</Text>

            {phase === 'requesting' ? <ActivityIndicator className="mt-4" color="#181027" /> : null}
            {phase === 'denied' ? (
              <View className="mt-5 w-full max-w-[360px] items-center rounded-[20px] bg-[#F7F7F8] px-5 py-4">
                <Text className="text-center font-inter text-[14px] leading-5 text-[#807B89]">{t('ai.voicePermissionBody')}</Text>
                <Pressable accessibilityRole="button" onPress={() => Linking.openSettings()} className="mt-4 min-h-11 flex-row items-center rounded-full bg-[#181027] px-5 py-3 active:opacity-80">
                  <Settings size={17} color="white" />
                  <Text className="ml-2 flex-shrink font-inter-semibold text-[14px] text-white">{t('common.openSettings')}</Text>
                </Pressable>
              </View>
            ) : null}
            {phase === 'error' ? (
              <Pressable accessibilityRole="button" disabled={sending} onPress={start} className="mt-5 min-h-11 self-center rounded-full bg-[#181027] px-6 py-3 active:opacity-80">
                <Text className="text-center font-inter-semibold text-[14px] text-white">{t('common.retry')}</Text>
              </Pressable>
            ) : null}
            {error || sendError ? (
              <View accessibilityLiveRegion="polite" className="mt-4 w-full rounded-[18px] border border-[#F1CECE] bg-[#FFF7F7] px-4 py-3">
                <Text className="font-inter text-[13px] leading-[19px] text-[#8B3E3E]">{sendError || error}</Text>
              </View>
            ) : null}
          </View>
          <View style={{ flexGrow: 1, minHeight: 48 }} />

          {canControl ? (
            <View className="items-center">
              <Pressable accessibilityRole="button" accessibilityLabel={t('ai.voiceStop')} disabled={sending} onPress={stop} className={`min-h-[50px] min-w-[186px] max-w-full flex-row items-center justify-center rounded-[16px] bg-[#D9D9D9] px-6 py-3 active:opacity-70 ${sending ? 'opacity-50' : ''}`}>
                <ChatArtwork asset={StopIcon} nativeWidth={48} nativeHeight={48} width={18} />
                <Text className="ml-4 flex-shrink text-center font-inter-semibold text-[17px] leading-[23px] text-[#181027]">{t('ai.voiceStop')}</Text>
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel={phase === 'paused' ? t('common.resume') : t('common.pause')} disabled={sending} onPress={phase === 'paused' ? resume : pause} className="mt-1 min-h-11 flex-row items-center justify-center px-5 py-2 active:opacity-60">
                {phase === 'paused' ? <Play size={14} color="#807B89" fill="#807B89" /> : <Pause size={14} color="#807B89" fill="#807B89" />}
                <Text className="ml-2 font-inter-medium text-[12px] text-[#807B89]">{phase === 'paused' ? t('common.resume') : t('common.pause')}</Text>
              </Pressable>
            </View>
          ) : null}

          <View className="mt-4 flex-row items-center justify-between gap-2 px-3">
            <Pressable accessibilityRole="button" accessibilityLabel={t('common.cancel')} accessibilityState={{ disabled: sending }} disabled={sending} onPress={cancel} className={`min-w-[48px] items-center py-2 active:opacity-60 ${sending ? 'opacity-50' : ''}`}>
              <View className="h-11 w-11 items-center justify-center rounded-full border border-[#B1B1B1] bg-[#E7E7E7]"><X size={23} strokeWidth={2} color="#807B89" /></View>
              <Text className="mt-2 max-w-[84px] text-center font-inter-medium text-[13px] leading-[18px] text-[#807B89]">{t('common.cancel')}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={t('ai.voicePrivacyTitle')} onPress={() => Alert.alert(t('ai.voicePrivacyTitle'), t('ai.voicePrivacy'))} className="min-h-11 flex-1 flex-row items-center justify-center gap-2 py-2 active:opacity-60">
              <LockKeyhole size={17} strokeWidth={1.8} color="#807B89" />
              <Text className="flex-shrink text-center font-inter-medium text-[10px] leading-[14px] text-[#807B89]">{t('ai.voicePrivacyShort')}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={t('common.send')} accessibilityState={{ disabled: !canSend || sending }} disabled={!canSend || sending} onPress={send} className={`min-w-[62px] items-center py-2 active:opacity-60 ${!canSend || sending ? 'opacity-50' : ''}`}>
              <View className="h-[62px] w-[62px] items-center justify-center rounded-full border border-[#B1B1B1] bg-[#E7E7E7]">
                {sending ? <ActivityIndicator color="#181027" /> : <SendOutline size={25} strokeWidth={1.8} color="#807B89" />}
              </View>
              <Text className="mt-2 max-w-[84px] text-center font-inter-medium text-[13px] leading-[18px] text-[#807B89]">{t('common.send')}</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
      <AIChatNavigation disabled={sending} onNavigate={() => discard()} onNavigationError={(navigationError) => setSendError(navigationError?.message || t('ai.voiceUnavailable'))} />
    </SafeAreaView>
  );
}
