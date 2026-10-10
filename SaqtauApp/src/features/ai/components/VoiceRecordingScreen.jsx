import { getCurrentLanguage, tNow } from '@/src/features/localization/localization.store';
import useI18n from '@/src/features/localization/hooks/useI18n';
import { router } from 'expo-router';
import { Pause, Play, Settings } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BackIcon from '@/assets/images/back.svg';
import CancelIcon from '@/assets/images/cancel.svg';
import ConversationsIcon from '@/assets/images/conversations.svg';
import RecordingIcon from '@/assets/images/recording.svg';
import SendIcon from '@/assets/images/send.svg';
import StopIcon from '@/assets/images/stop.svg';
import { transcribeAiAudio } from '@/src/features/ai/ai.api';
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
    <SafeAreaView className="flex-1 bg-[#ECECEC]" edges={['top', 'bottom']}>
      <View className="flex-row items-center px-5 pt-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('ai.goBack')}
          disabled={sending}
          onPress={cancel}
          className="h-11 w-11 items-center justify-center rounded-full bg-white active:opacity-70"
        >
          <BackIcon width={22} height={22} />
        </Pressable>
        <Text className="ml-4 font-inter-extrabold text-[22px] tracking-[-0.6px] text-[#181027]">
          {t('ai.voiceTitle')}
        </Text>
      </View>

      <View className="flex-1 px-6 pt-9">
        <View className="items-center">
          <View className="h-[104px] w-[104px] items-center justify-center rounded-full bg-white">
            <RecordingIcon width={54} height={54} />
          </View>

          <Text className="mt-6 text-center font-inter-extrabold text-[29px] tracking-[-0.9px] text-[#181027]">
            {statusTitle(phase)}
          </Text>
          <Text className="mt-2 font-inter-semibold text-[18px] tabular-nums text-[#77717F]">
            {formatVoiceDuration(recorderState?.durationMillis)}
          </Text>
        </View>

        <View className="mt-8 rounded-[28px] bg-white px-4 py-6">
          <VoiceWaveform
            metering={recorderState?.metering}
            durationMillis={recorderState?.durationMillis}
            active={isActive}
          />

          {phase === 'requesting' ? (
            <ActivityIndicator className="mt-5" color="#208AEF" />
          ) : null}

          {phase === 'denied' ? (
            <View className="mt-5 items-center px-3">
              <Text className="text-center font-inter text-[14px] leading-5 text-[#77717F]">
                {t('ai.voicePermissionBody')}
              </Text>
              <Pressable
                onPress={() => Linking.openSettings()}
                className="mt-4 flex-row items-center rounded-full bg-[#181027] px-5 py-3 active:opacity-80"
              >
                <Settings size={17} color="white" />
                <Text className="ml-2 font-inter-semibold text-[14px] text-white">
                  {t('common.openSettings')}
                </Text>
              </Pressable>
            </View>
          ) : null}

          {phase === 'error' ? (
            <Pressable
              onPress={start}
              className="mt-5 self-center rounded-full bg-[#181027] px-6 py-3 active:opacity-80"
            >
              <Text className="font-inter-semibold text-[14px] text-white">{t('common.retry')}</Text>
            </Pressable>
          ) : null}

          {canControl ? (
            <View className="mt-5 flex-row items-center justify-center gap-3">
              <Pressable
                onPress={phase === 'paused' ? resume : pause}
                className="h-12 flex-row items-center justify-center rounded-full bg-[#EEECEF] px-5 active:opacity-75"
              >
                {phase === 'paused' ? (
                  <Play size={18} color="#181027" fill="#181027" />
                ) : (
                  <Pause size={18} color="#181027" fill="#181027" />
                )}
                <Text className="ml-2 font-inter-semibold text-[14px] text-[#181027]">
                  {phase === 'paused' ? t('common.resume') : t('common.pause')}
                </Text>
              </Pressable>

              <Pressable
                onPress={stop}
                className="h-12 flex-row items-center justify-center rounded-full bg-[#181027] px-5 active:opacity-80"
              >
                <StopIcon width={18} height={18} />
                <Text className="ml-2 font-inter-semibold text-[14px] text-white">
                  {t('ai.voiceStop')}
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>

        {error || sendError ? (
          <View className="mt-4 rounded-[18px] border border-[#F1CECE] bg-[#FFF7F7] px-4 py-3">
            <Text className="font-inter text-[13px] leading-[19px] text-[#8B3E3E]">
              {sendError || error}
            </Text>
          </View>
        ) : null}

        <View className="mt-5 flex-row items-start rounded-[22px] bg-[#E2E1E4] px-4 py-4">
          <ConversationsIcon width={23} height={23} />
          <Text className="ml-3 flex-1 font-inter-medium text-[12px] leading-[18px] text-[#716C79]">
            {t('ai.voicePrivacy')}
          </Text>
        </View>
      </View>

      <View className="flex-row gap-3 px-5 pb-2 pt-4">
        <Pressable
          disabled={sending}
          onPress={cancel}
          className="h-14 flex-1 flex-row items-center justify-center rounded-full bg-white active:opacity-75"
        >
          <CancelIcon width={20} height={20} />
          <Text className="ml-2 font-inter-semibold text-[15px] text-[#181027]">{t('common.cancel')}</Text>
        </Pressable>

        <Pressable
          disabled={!canSend || sending}
          onPress={send}
          className={`h-14 flex-1 flex-row items-center justify-center rounded-full ${
            canSend ? 'bg-[#208AEF]' : 'bg-[#CFCBD2]'
          }`}
        >
          {sending ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <SendIcon width={20} height={20} />
              <Text className="ml-2 font-inter-semibold text-[15px] text-white">{t('common.send')}</Text>
            </>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
