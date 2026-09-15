import * as FileSystem from 'expo-file-system/legacy';
import { Stack, router } from 'expo-router';
import {
  CheckCircle2,
  RotateCcw,
  WifiOff,
} from 'lucide-react-native';
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
} from 'react-native';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  getMeasurement,
  uploadCameraMeasurement,
} from '@/src/features/check-in/check-in.api';
import {
  clearPendingMeasurementId,
  saveLastMeasurementId,
  saveLocalGuestCheckIn,
  savePendingMeasurementId,
} from '@/src/features/check-in/check-in.storage';
import { useCheckInStore } from '@/src/features/check-in/check-in.store';
import { useAuthStore } from '@/src/features/auth/auth.store';
import { useOnboardingStore } from '@/src/features/onboarding/onboarding.store';

const POLL_INTERVAL_MS = 60_000;

async function deleteLocalVideo(uri) {
  if (!uri) {
    return;
  }

  try {
    await FileSystem.deleteAsync(uri, {
      idempotent: true,
    });
  } catch {
    // A camera cache file can already be gone. That should not
    // invalidate a server-side measurement that was accepted.
    console.log("error '@/src/app/(check-in)/processing.jsx'");
  }
}

export default function ProcessingScreen() {
  const videoUri = useCheckInStore(
    (state) => state.videoUri,
  );
  const measurementId = useCheckInStore(
    (state) => state.measurementId,
  );
  const uploadProgress = useCheckInStore(
    (state) => state.uploadProgress,
  );
  const setMeasurementId = useCheckInStore(
    (state) => state.setMeasurementId,
  );
  const setMeasurement = useCheckInStore(
    (state) => state.setMeasurement,
  );
  const setUploadProgress = useCheckInStore(
    (state) => state.setUploadProgress,
  );
  const setPhase = useCheckInStore(
    (state) => state.setPhase,
  );
  const setStoreError = useCheckInStore(
    (state) => state.setError,
  );
  const resetAll = useCheckInStore(
    (state) => state.resetAll,
  );

  const isGuest = useAuthStore(
    (state) => state.isGuest,
  );
  const completeFirstCheckIn = useOnboardingStore(
    (state) => state.completeFirstCheckIn,
  );

  const [screenState, setScreenState] = useState(
    measurementId ? 'processing' : 'uploading',
  );
  const [message, setMessage] = useState('');
  const [checking, setChecking] = useState(false);
  const [uploadAttempt, setUploadAttempt] = useState(0);

  const uploadStartedRef = useRef(false);
  const completedRef = useRef(false);
  const pollTimerRef = useRef(null);
  const uploadTaskRef = useRef(null);

  const clearPollTimer = useCallback(() => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const finishCompletedMeasurement = useCallback(
    async (measurement) => {
      if (
        completedRef.current ||
        !measurement?.id
      ) {
        return;
      }

      completedRef.current = true;
      clearPollTimer();

      setMeasurement(measurement);
      setMeasurementId(measurement.id);
      setPhase('completed');
      setStoreError(null);

      await saveLastMeasurementId(measurement.id);

      if (isGuest) {
        await saveLocalGuestCheckIn(measurement);
      }

      await clearPendingMeasurementId();
      await completeFirstCheckIn();

      setScreenState('completed');

      router.replace('/(check-in)/result');
    },
    [
      clearPollTimer,
      completeFirstCheckIn,
      isGuest,
      setMeasurement,
      setMeasurementId,
      setPhase,
      setStoreError,
    ],
  );

  const checkStatus = useCallback(
    async (id, { scheduleNext = true } = {}) => {
      if (!id || completedRef.current) {
        return;
      }

      clearPollTimer();
      setChecking(true);
      setMessage('');

      try {
        const measurement =
          await getMeasurement(id);

        setMeasurement(measurement);

        if (measurement.status === 'completed') {
          await finishCompletedMeasurement(
            measurement,
          );
          return;
        }

        if (measurement.status === 'failed') {
          setPhase('failed');
          setScreenState('failed');
          setStoreError(
            measurement.failure_detail ||
              'We could not process this check-in.',
          );
          setMessage(
            measurement.failure_detail ||
              'We could not process this check-in. Please try again.',
          );
          return;
        }

        setPhase('processing');
        setScreenState('processing');

        if (scheduleNext) {
          pollTimerRef.current = setTimeout(
            () => {
              checkStatus(id);
            },
            POLL_INTERVAL_MS,
          );
        }
      } catch (error) {
        setPhase('processing');
        setScreenState('offline');
        setMessage(
          error?.message ||
            'Could not check your result. We will keep your pending check-in.',
        );

        if (scheduleNext) {
          pollTimerRef.current = setTimeout(
            () => {
              checkStatus(id);
            },
            POLL_INTERVAL_MS,
          );
        }
      } finally {
        setChecking(false);
      }
    },
    [
      clearPollTimer,
      finishCompletedMeasurement,
      setMeasurement,
      setPhase,
      setStoreError,
    ],
  );

  useEffect(() => {
    if (
      measurementId &&
      !completedRef.current
    ) {
      setScreenState('processing');
      checkStatus(measurementId);
    }

    return clearPollTimer;
  }, [
    checkStatus,
    clearPollTimer,
    measurementId,
  ]);

  useEffect(() => {
    if (
      measurementId ||
      !videoUri ||
      uploadStartedRef.current
    ) {
      return undefined;
    }

    uploadStartedRef.current = true;
    setPhase('uploading');
    setScreenState('uploading');
    setStoreError(null);
    setMessage('');

    const task = uploadCameraMeasurement({
      videoUri,
      onProgress: setUploadProgress,
    });

    uploadTaskRef.current = task;

    task.promise
      .then(async (measurement) => {
        if (!measurement?.id) {
          throw new Error(
            'The server accepted the upload without a measurement ID.',
          );
        }

        await savePendingMeasurementId(
          measurement.id,
        );
        await saveLastMeasurementId(
          measurement.id,
        );

        setMeasurement(measurement);
        setMeasurementId(measurement.id);

        await deleteLocalVideo(videoUri);

        useCheckInStore.setState({
          videoUri: null,
        });

        if (measurement.status === 'completed') {
          await finishCompletedMeasurement(
            measurement,
          );
          return;
        }

        setPhase('processing');
        setScreenState('processing');
      })
      .catch((error) => {
        setPhase('upload-error');
        setScreenState('upload-error');
        setStoreError(
          error?.message ||
            'Could not upload your check-in.',
        );
        setMessage(
          error?.message ||
            'Could not upload your check-in. Please try again.',
        );
        uploadStartedRef.current = false;
      });

    return () => {
      // Do not abort a successful server-side processing job.
      // Only an in-flight local upload is cancelled when this screen unmounts.
      if (!measurementId) {
        uploadTaskRef.current?.abort?.();
      }
    };
  }, [
    checkStatus,
    finishCompletedMeasurement,
    measurementId,
    setMeasurement,
    setMeasurementId,
    setPhase,
    setStoreError,
    setUploadProgress,
    videoUri,
    uploadAttempt,
  ]);

  async function retryUpload() {
    uploadStartedRef.current = false;
    setUploadProgress(0);
    setMessage('');
    setScreenState('uploading');

    // Toggling the URI through the store causes the upload effect to run again.
    useCheckInStore.setState({
      videoUri,
      phase: 'captured',
    });
    setUploadAttempt((value) => value + 1);
  }

  async function startOver() {
    clearPollTimer();
    await clearPendingMeasurementId();
    resetAll();
    router.replace('/(check-in)/capture');
  }

  const progressPercent = Math.round(
    uploadProgress * 100,
  );

  const isUploading =
    screenState === 'uploading';
  const isOffline = screenState === 'offline';
  const isFailed = screenState === 'failed';
  const isUploadError =
    screenState === 'upload-error';

  return (
    <SafeAreaView
      className="flex-1 bg-[#ECECEC]"
      edges={['top', 'bottom']}
    >
      <Stack.Screen
        options={{ gestureEnabled: false }}
      />

      <View className="flex-1 px-6">
        <View className="flex-1 items-center justify-center">
          <View className="h-[132px] w-[132px] items-center justify-center rounded-full bg-white">
            {isOffline ? (
              <WifiOff
                size={38}
                strokeWidth={1.7}
                color="#181027"
              />
            ) : isFailed || isUploadError ? (
              <RotateCcw
                size={38}
                strokeWidth={1.7}
                color="#181027"
              />
            ) : screenState === 'completed' ? (
              <CheckCircle2
                size={42}
                strokeWidth={1.7}
                color="#397A5A"
              />
            ) : (
              <ActivityIndicator
                size="large"
                color="#181027"
              />
            )}
          </View>

          <Text className="mt-9 text-center font-inter-extrabold text-[30px] leading-[36px] tracking-[-0.9px] text-[#181027]">
            {isUploading
              ? 'Uploading your check-in'
              : isFailed
                ? 'We couldn’t read that signal'
                : isUploadError
                  ? 'Upload interrupted'
                  : isOffline
                    ? 'Still working on it'
                    : 'Reading your signal'}
          </Text>

          <Text className="mt-4 max-w-[330px] text-center font-inter text-[16px] leading-[23px] text-[#807B89]">
            {isUploading
              ? `Securely sending the recording for processing. ${progressPercent}%`
              : isFailed
                ? message
                : isUploadError
                  ? message
                  : isOffline
                    ? 'Your check-in is saved on the server. Reconnect and we can check the result again.'
                    : 'This can take a little while. You can keep SaqtauAI open; we check the result about once a minute.'}
          </Text>

          {isUploading ? (
            <View className="mt-7 h-2 w-full max-w-[300px] overflow-hidden rounded-full bg-white">
              <View
                className="h-full rounded-full bg-[#181027]"
                style={{
                  width: `${Math.max(
                    3,
                    progressPercent,
                  )}%`,
                }}
              />
            </View>
          ) : null}
        </View>

        <View className="pb-4">
          {isUploadError ? (
            <Pressable
              accessibilityRole="button"
              onPress={retryUpload}
              className="h-[58px] items-center justify-center rounded-[16px] bg-[#181027] active:opacity-90"
            >
              <Text className="font-inter-semibold text-[16px] text-white">
                Retry upload
              </Text>
            </Pressable>
          ) : null}

          {isOffline ? (
            <Pressable
              accessibilityRole="button"
              disabled={checking}
              onPress={() =>
                checkStatus(measurementId, {
                  scheduleNext: true,
                })
              }
              className="h-[58px] items-center justify-center rounded-[16px] bg-[#181027] active:opacity-90 disabled:opacity-60"
            >
              {checking ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="font-inter-semibold text-[16px] text-white">
                  Check again
                </Text>
              )}
            </Pressable>
          ) : null}

          {isFailed ? (
            <Pressable
              accessibilityRole="button"
              onPress={startOver}
              className="h-[58px] items-center justify-center rounded-[16px] bg-[#181027] active:opacity-90"
            >
              <Text className="font-inter-semibold text-[16px] text-white">
                Try another check-in
              </Text>
            </Pressable>
          ) : null}

          {!isUploading &&
          !isUploadError &&
          !isOffline &&
          !isFailed ? (
            <Text className="text-center font-inter text-[12px] leading-[17px] text-[#807B89]">
              Your result will open automatically when it’s ready.
            </Text>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}
