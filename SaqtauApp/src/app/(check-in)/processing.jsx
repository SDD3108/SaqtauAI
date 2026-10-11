import { tNow } from '@/src/features/localization/localization.store';
import useI18n from '@/src/features/localization/hooks/useI18n';
import * as FileSystem from 'expo-file-system/legacy';
import * as Notifications from 'expo-notifications';
import { Stack, router } from 'expo-router';
import { CheckCircle2, RotateCcw, WifiOff, } from 'lucide-react-native';
import { ActivityIndicator, AppState, Pressable, ScrollView, Text, View, } from 'react-native';
import { useCallback, useEffect, useRef, useState, } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getMeasurement, uploadCameraMeasurement, } from '@/src/features/check-in/check-in.api';
import { clearPendingMeasurementId, saveLastMeasurementId, saveLocalGuestCheckIn, savePendingMeasurementId, } from '@/src/features/check-in/check-in.storage';
import { useCheckInStore } from '@/src/features/check-in/check-in.store';
import { useAuthStore } from '@/src/features/auth/auth.store';
import { useOnboardingStore } from '@/src/features/onboarding/onboarding.store';
import ProcessingProgress from '@/src/features/check-in/components/ProcessingProgress';
import ReadyNotificationCard from '@/src/features/check-in/components/ReadyNotificationCard';
import { processingCopy, uploadPercent } from '@/src/features/check-in/utils/processingProgress.utils';
import { POLL_INTERVAL_MS, takeMeasurementPollSlot } from '@/src/features/check-in/services/measurementPolling';
import { notifyMeasurementReady, noteRemoteMeasurementNotification } from '@/src/services/notifications/push';
async function deleteLocalVideo(uri) {
    if (!uri) {
        return;
    }
    try {
        await FileSystem.deleteAsync(uri, {
            idempotent: true,
        });
    }
    catch {
        // A camera cache file can already be gone. That should not
        // invalidate a server-side measurement that was accepted.
        console.log("error '@/src/app/(check-in)/processing.jsx'");
    }
}
export default function ProcessingScreen() {
    const { t, language } = useI18n();
    const copy = processingCopy(language);
    const videoUri = useCheckInStore((state) => state.videoUri);
    const currentMeasurement = useCheckInStore((state) => state.measurement);
    const measurementId = useCheckInStore((state) => state.measurementId);
    const uploadProgress = useCheckInStore((state) => state.uploadProgress);
    const setMeasurementId = useCheckInStore((state) => state.setMeasurementId);
    const setMeasurement = useCheckInStore((state) => state.setMeasurement);
    const setUploadProgress = useCheckInStore((state) => state.setUploadProgress);
    const setPhase = useCheckInStore((state) => state.setPhase);
    const setStoreError = useCheckInStore((state) => state.setError);
    const resetAll = useCheckInStore((state) => state.resetAll);
    const isGuest = useAuthStore((state) => state.isGuest);
    const completeFirstCheckIn = useOnboardingStore((state) => state.completeFirstCheckIn);
    const [screenState, setScreenState] = useState(measurementId ? 'processing' : 'uploading');
    const [message, setMessage] = useState('');
    const [checking, setChecking] = useState(false);
    const [uploadAttempt, setUploadAttempt] = useState(0);
    const uploadStartedRef = useRef(false);
    const completedRef = useRef(false);
    const pollTimerRef = useRef(null);
    const uploadTaskRef = useRef(null);
    const checkingStatusRef = useRef(false);
    const mountedRef = useRef(true);
    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);
    const clearPollTimer = useCallback(() => {
        if (pollTimerRef.current) {
            clearTimeout(pollTimerRef.current);
            pollTimerRef.current = null;
        }
    }, []);
    const finishCompletedMeasurement = useCallback(async (measurement) => {
        if (completedRef.current ||
            !measurement?.id) {
            return;
        }
        completedRef.current = true;
        clearPollTimer();
        const session = useAuthStore.getState();
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
        // Notification failure must not prevent opening the saved result.
        notifyMeasurementReady(measurement, {
            accountId: session.account?.id || 'guest',
            isCurrent: () => {
                const current = useAuthStore.getState();
                return current.token === session.token && current.account?.id === session.account?.id;
            },
        }).catch(() => { });
        router.replace('/(check-in)/result');
    }, [
        clearPollTimer,
        completeFirstCheckIn,
        isGuest,
        setMeasurement,
        setMeasurementId,
        setPhase,
        setStoreError,
    ]);
    const checkStatus = useCallback(async (id, { scheduleNext = true } = {}) => {
        if (!id || completedRef.current || checkingStatusRef.current || !mountedRef.current) {
            return;
        }
        if (AppState.currentState !== 'active')
            return;
        const waitMs = takeMeasurementPollSlot(id);
        if (waitMs > 0) {
            // Keep one pending timer even when several events arrive together.
            clearPollTimer();
            pollTimerRef.current = setTimeout(() => checkStatus(id), waitMs);
            return;
        }
        checkingStatusRef.current = true;
        clearPollTimer();
        setChecking(true);
        setMessage('');
        try {
            const measurement = await getMeasurement(id);
            if (!mountedRef.current)
                return;
            setMeasurement(measurement);
            if (measurement.status === 'completed') {
                await finishCompletedMeasurement(measurement);
                return;
            }
            if (measurement.status === 'failed') {
                setPhase('failed');
                setScreenState('failed');
                setStoreError(measurement.failure_detail ||
                    tNow('checkin.processFailed'));
                setMessage(measurement.failure_detail ||
                    tNow('checkin.processFailed'));
                return;
            }
            setPhase('processing');
            setScreenState('processing');
            if (scheduleNext && AppState.currentState === 'active') {
                pollTimerRef.current = setTimeout(() => {
                    checkStatus(id);
                }, POLL_INTERVAL_MS);
            }
        }
        catch (error) {
            if (!mountedRef.current)
                return;
            setPhase('processing');
            setScreenState('offline');
            setMessage(error?.message ||
                tNow('checkin.statusError'));
            if (scheduleNext && AppState.currentState === 'active') {
                pollTimerRef.current = setTimeout(() => {
                    checkStatus(id);
                }, POLL_INTERVAL_MS);
            }
        }
        finally {
            checkingStatusRef.current = false;
            if (mountedRef.current)
                setChecking(false);
        }
    }, [
        clearPollTimer,
        finishCompletedMeasurement,
        setMeasurement,
        setPhase,
        setStoreError,
    ]);
    useEffect(() => {
        if (!measurementId)
            return undefined;
        const appSubscription = AppState.addEventListener('change', state => {
            if (state === 'active')
                checkStatus(measurementId);
            else
                clearPollTimer();
        });
        const received = Notifications.addNotificationReceivedListener(notification => {
            const data = notification?.request?.content?.data || {};
            if (String(data.measurement_id || '') === String(measurementId)) {
                if (data.saqtau_checkin_ready !== true && (data.type === 'measurement_ready' || data.kind === 'measurement_ready')) {
                    noteRemoteMeasurementNotification(measurementId);
                }
                // Verify the status through the authenticated API.
                checkStatus(measurementId);
            }
        });
        return () => { appSubscription.remove(); received.remove(); };
    }, [measurementId, checkStatus, clearPollTimer]);
    useEffect(() => {
        if (measurementId &&
            !completedRef.current) {
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
        if (measurementId ||
            !videoUri ||
            uploadStartedRef.current) {
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
                throw new Error(tNow('checkin.uploadNoId'));
            }
            await savePendingMeasurementId(measurement.id);
            await saveLastMeasurementId(measurement.id);
            setMeasurement(measurement);
            setMeasurementId(measurement.id);
            await deleteLocalVideo(videoUri);
            useCheckInStore.setState({
                videoUri: null,
            });
            if (measurement.status === 'completed') {
                await finishCompletedMeasurement(measurement);
                return;
            }
            setPhase('processing');
            setScreenState('processing');
        })
            .catch((error) => {
            setPhase('upload-error');
            setScreenState('upload-error');
            setStoreError(error?.message ||
                tNow('checkin.uploadError'));
            setMessage(error?.message ||
                tNow('checkin.uploadError'));
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
    const progressPercent = uploadPercent(uploadProgress);
    const isUploading = screenState === 'uploading';
    const isOffline = screenState === 'offline';
    const isFailed = screenState === 'failed';
    const isUploadError = screenState === 'upload-error';
    return (<SafeAreaView className="flex-1 bg-[#ECECEC]" edges={['top', 'bottom']}>

      <Stack.Screen options={{ gestureEnabled: false }}/>

      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingVertical: 16 }} showsVerticalScrollIndicator={false}>

        <View className="flex-1 items-center justify-center">

          <View className="h-[132px] w-[132px] items-center justify-center rounded-full bg-white">

            {isOffline ? (<WifiOff size={38} strokeWidth={1.7} color="#181027"/>) : isFailed || isUploadError ? (<RotateCcw size={38} strokeWidth={1.7} color="#181027"/>) : screenState === 'completed' ? (<CheckCircle2 size={42} strokeWidth={1.7} color="#397A5A"/>) : (<ActivityIndicator size="large" color="#181027"/>)}

          </View>

          <Text className="mt-9 text-center font-inter-extrabold text-[30px] leading-[36px] tracking-[-0.9px] text-[#181027]">

            {isUploading
            ? t('checkin.uploading')
            : isFailed
                ? t('checkin.signalFailed')
                : isUploadError
                    ? t('checkin.uploadInterrupted')
                    : isOffline
                        ? t('checkin.stillWorking')
                        : screenState === 'completed' ? copy.complete : t('checkin.readingSignal')}

          </Text>

          <Text className="mt-4 max-w-[330px] text-center font-inter text-[16px] leading-[23px] text-[#807B89]">

            {isUploading
            ? t('checkin.uploadBody', { percent: progressPercent })
            : isFailed
                ? message
                : isUploadError
                    ? message
                    : isOffline
                        ? t('checkin.offlinePending')
                        : screenState === 'completed' ? '' : copy.analysisBody}

          </Text>

          <ProcessingProgress state={screenState} uploadProgress={uploadProgress} measurement={currentMeasurement}/>

          {(screenState === 'processing' || screenState === 'offline') ? <ReadyNotificationCard /> : null}

        </View>

        <View className="pb-4 pt-6">

          {isUploadError ? (<Pressable accessibilityRole="button" onPress={retryUpload} className="h-[58px] items-center justify-center rounded-[16px] bg-[#181027] active:opacity-90">

              <Text className="font-inter-semibold text-[16px] text-white">

                {t('checkin.retryUpload')}

              </Text>

            </Pressable>) : null}

          {isOffline ? (<Pressable accessibilityRole="button" disabled={checking} onPress={() => checkStatus(measurementId, {
                scheduleNext: true,
            })} className="h-[58px] items-center justify-center rounded-[16px] bg-[#181027] active:opacity-90 disabled:opacity-60">

              {checking ? (<ActivityIndicator color="#FFFFFF"/>) : (<Text className="font-inter-semibold text-[16px] text-white">

                  {t('checkin.checkAgain')}

                </Text>)}

            </Pressable>) : null}

          {isFailed ? (<Pressable accessibilityRole="button" onPress={startOver} className="h-[58px] items-center justify-center rounded-[16px] bg-[#181027] active:opacity-90">

              <Text className="font-inter-semibold text-[16px] text-white">

                {t('checkin.tryAnother')}

              </Text>

            </Pressable>) : null}

          {!isUploading &&
            !isUploadError &&
            !isOffline &&
            !isFailed ? (<Text className="text-center font-inter text-[12px] leading-[17px] text-[#807B89]">

              {t('checkin.opensAutomatically')}

            </Text>) : null}

        </View>

      </ScrollView>

    </SafeAreaView>);
}
