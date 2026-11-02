import { tNow } from '@/src/features/localization/localization.store';
import useI18n from '@/src/features/localization/hooks/useI18n';
import * as FileSystem from 'expo-file-system/legacy';
import * as Notifications from 'expo-notifications';
import { Stack, router } from 'expo-router';
import Wordmark from '@/assets/images/Logo2.svg';
import WaitingRunner from '@/src/features/check-in/components/WaitingRunner';
import { AppState, Pressable, ScrollView, Text, View, } from 'react-native';
import { useCallback, useEffect, useRef, useState, } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getMeasurement, uploadCameraMeasurement, } from '@/src/features/check-in/check-in.api';
import { clearPendingMeasurementId, saveLastMeasurementId, saveLocalGuestCheckIn, savePendingMeasurementId, } from '@/src/features/check-in/check-in.storage';
import { useCheckInStore } from '@/src/features/check-in/check-in.store';
import { useAuthStore } from '@/src/features/auth/auth.store';
import { useOnboardingStore } from '@/src/features/onboarding/onboarding.store';
import ProcessingProgress from '@/src/features/check-in/components/ProcessingProgress';
import ReadyNotificationCard from '@/src/features/check-in/components/ReadyNotificationCard';
import { processingCopy } from '@/src/features/check-in/utils/processingProgress.utils';
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
        console.log("error, '@/src/app/(check-in)/processing.jsx'");
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
    const isUploading = screenState === 'uploading';
    const isOffline = screenState === 'offline';
    const isFailed = screenState === 'failed';
    const isUploadError = screenState === 'upload-error';
    const waiting = isUploading || screenState === 'processing' || isOffline;
    const title = isUploading ? t('checkin.uploading') : isUploadError ? t('checkin.uploadInterrupted')
        : isFailed ? t('checkin.signalFailed') : isOffline ? t('checkin.stillWorking')
        : screenState === 'completed' ? copy.complete : t('checkin.readingSignal');
    const body = isUploadError || isFailed ? message : isOffline ? t('checkin.offlinePending')
        : isUploading ? t('checkin.runnerUpload') : t('checkin.opensAutomatically');
    return (
      <SafeAreaView className="flex-1 bg-[#ECECEC]" edges={['top', 'bottom']}>
        <Stack.Screen options={{ gestureEnabled: false }} />
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, alignItems: 'center', paddingHorizontal: 20, paddingVertical: 20 }}>
          <View style={{ width: '100%', maxWidth: 440, flexGrow: 1 }}>
            <View accessibilityRole="image" accessible accessibilityLabel="Saqtau AI">
              <Wordmark width={140} height={36} />
            </View>
            <Text accessibilityRole="header" className="mt-7 font-inter-extrabold text-[29px] leading-[36px] text-[#181027]">{title}</Text>
            {!!body && <Text className="mt-2 font-inter text-[15px] leading-[22px] text-[#625B70]">{body}</Text>}
            {!isFailed && !isUploadError && !isOffline && (
              <ProcessingProgress state={screenState} uploadProgress={uploadProgress} measurement={currentMeasurement} />
            )}
            <View style={{ flexGrow: 1.4, minHeight: 24 }} />
            {waiting && <WaitingRunner />}
            {(screenState === 'processing' || isOffline) && <ReadyNotificationCard />}
            {(isUploadError || isOffline || isFailed) && (
              <Pressable accessibilityRole="button" disabled={isOffline && checking}
                onPress={isUploadError ? retryUpload : isFailed ? startOver : () => checkStatus(measurementId)}
                className="mt-4 min-h-[54px] items-center justify-center rounded-[16px] bg-[#181027] px-4 py-3 active:opacity-80 disabled:opacity-60">
                <Text className="text-center font-inter-semibold text-[15px] text-white">
                  {t(isUploadError ? 'checkin.retryUpload' : isFailed ? 'checkin.tryAnother' : 'checkin.checkAgain')}
                </Text>
              </Pressable>
            )}
            <View style={{ flexGrow: 0.8, minHeight: 12 }} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
}
