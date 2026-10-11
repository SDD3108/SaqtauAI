import useI18n from '@/src/features/localization/hooks/useI18n';
import { CameraView } from 'expo-camera';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  ArrowLeft,
  Camera as CameraIcon,
  Check,
} from 'lucide-react-native';
import {
  AppState,
  Pressable,
  Text,
  View,
} from 'react-native';
import {
  useEffect,
  useRef,
  useState,
} from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import useMotionStability from '@/src/features/check-in/hooks/useMotionStability';
import { useCheckInStore } from '@/src/features/check-in/check-in.store';
import CaptureProgress, { CaptureGuide } from '@/src/features/check-in/components/CaptureProgress';

const RECORDING_SECONDS = 60;
const MIN_VALID_SECONDS = 50;

function formatSeconds(value) {
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`;
}

export default function CaptureScreen() {
  const { t } = useI18n();
  const cameraRef = useRef(null);
  const timerRef = useRef(null);
  const recordingStartedAtRef = useRef(null);
  const interruptedRef = useRef(false);
  const recordingRef = useRef(false);

  const [cameraReady, setCameraReady] = useState(false);
  const [recording, setRecording] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(
    RECORDING_SECONDS,
  );
  const [error, setError] = useState('');

  const setVideoUri = useCheckInStore(
    (state) => state.setVideoUri,
  );

  const motion = useMotionStability(cameraReady);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      (nextState) => {
        if (
          nextState !== 'active' &&
          recordingRef.current
        ) {
          interruptedRef.current = true;
          cameraRef.current?.stopRecording();
        }
      },
    );

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      if (recordingRef.current) {
        interruptedRef.current = true;
        cameraRef.current?.stopRecording();
      }
    };
  }, []);

  function startTimer() {
    setSecondsLeft(RECORDING_SECONDS);

    timerRef.current = setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          return 0;
        }

        return current - 1;
      });
    }, 1000);
  }

  function stopTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  async function startRecording() {
    if (
      !cameraReady ||
      recordingRef.current ||
      !cameraRef.current
    ) {
      return;
    }

    setError('');
    interruptedRef.current = false;
    recordingRef.current = true;
    recordingStartedAtRef.current = Date.now();
    setRecording(true);
    startTimer();

    try {
      const video =
        await cameraRef.current.recordAsync({
          maxDuration: RECORDING_SECONDS,
          codec: 'avc1',
        });

      const elapsed =
        recordingStartedAtRef.current
          ? (Date.now() -
              recordingStartedAtRef.current) /
            1000
          : 0;

      if (interruptedRef.current) {
        setError(
          t('checkin.captureInterrupted'),
        );
        return;
      }

      if (!video?.uri) {
        setError(
          t('checkin.cameraNoRecording'),
        );
        return;
      }

      if (elapsed < MIN_VALID_SECONDS) {
        setError(
          t('checkin.recordingTooShort'),
        );
        return;
      }

      setVideoUri(video.uri);
      router.replace('/(check-in)/processing');
    } catch (recordError) {
      setError(
        recordError?.message ||
          t('checkin.recordError'),
      );
    } finally {
      recordingRef.current = false;
      setRecording(false);
      stopTimer();
    }
  }

  function handleBack() {
    if (recordingRef.current) {
      return;
    }

    router.back();
  }

  const stabilityLabel = motion.available
    ? motion.stable
      ? t('checkin.steady')
      : t('checkin.holdStill')
    : t('checkin.motionUnavailable');

  return (
    <View className="flex-1 bg-black">
      <Stack.Screen
        options={{
          gestureEnabled: !recording,
        }}
      />
      <StatusBar style="light" />

      <CameraView
        ref={cameraRef}
        style={{ flex: 1 }}
        facing="front"
        mode="video"
        mute
        videoQuality="720p"
        onCameraReady={() => setCameraReady(true)}
        onMountError={(event) => {
          setError(
            event?.message ||
              t('checkin.cameraError'),
          );
        }}
      />

      <View className="absolute inset-0 bg-black/15" />

      <SafeAreaView
        className="absolute inset-0"
        edges={['top', 'bottom']}
        pointerEvents="box-none"
      >
        <View className="flex-1 px-6">
          <View className="flex-row items-center justify-between pt-2">
            <Pressable
              accessibilityRole="button"
              onPress={handleBack}
              disabled={recording}
              className="h-11 w-11 items-center justify-center rounded-full bg-black/30 active:opacity-80 disabled:opacity-40"
            >
              <ArrowLeft
                size={22}
                color="#FFFFFF"
                strokeWidth={2}
              />
            </Pressable>

            <View className="rounded-full bg-black/35 px-4 py-2">
              <Text className="font-inter-semibold text-[14px] tabular-nums text-white">
                {recording
                  ? formatSeconds(secondsLeft)
                  : t('checkin.sixtySec')}
              </Text>
            </View>
          </View>

          <View className="flex-1 items-center justify-center py-4">
            <CaptureGuide recording={recording} secondsLeft={secondsLeft} duration={RECORDING_SECONDS} />

            <View
              className={`mt-5 flex-row items-center rounded-full px-4 py-2 ${
                motion.stable
                  ? 'bg-black/40'
                  : 'bg-[#181027]/75'
              }`}
            >
              {motion.stable ? (
                <Check
                  size={16}
                  color="#FFFFFF"
                  strokeWidth={2.2}
                />
              ) : null}

              <Text className="ml-2 font-inter-medium text-[14px] text-white">
                {stabilityLabel}
              </Text>
            </View>
          </View>

          <View className="pb-5">
            <View className="rounded-[24px] bg-black/45 px-5 py-5">
              <Text className="text-center font-inter-bold text-[23px] leading-[29px] text-white">
                {recording
                  ? t('checkin.keepStill')
                  : t('checkin.readyCapture')}
              </Text>

              {!recording ? <Text className="mt-2 text-center font-inter text-[14px] leading-[20px] text-white/75">
                {t('checkin.captureInstructions')}
              </Text> : null}

              {error ? (
                <Text className="mt-3 text-center font-inter-medium text-[13px] leading-[18px] text-[#FFD1D1]">
                  {error}
                </Text>
              ) : null}

              {!recording ? (
                <Pressable
                  accessibilityRole="button"
                  disabled={
                    !cameraReady ||
                    !motion.available
                  }
                  onPress={startRecording}
                  className="mt-5 h-[58px] flex-row items-center justify-center rounded-[16px] bg-white active:opacity-90 disabled:opacity-50"
                >
                  <CameraIcon
                    size={20}
                    color="#181027"
                    strokeWidth={2}
                  />

                  <Text className="ml-2 font-inter-semibold text-[16px] text-[#181027]">
                    {t('onboarding.startCheckIn')}
                  </Text>
                </Pressable>
              ) : (
              <CaptureProgress secondsLeft={secondsLeft} duration={RECORDING_SECONDS} />
              )}
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
