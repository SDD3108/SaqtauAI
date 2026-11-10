import { router } from 'expo-router';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import StartupAnimation from '@/src/features/onboarding/components/StartupAnimation';
import { useCheckInStore } from '@/src/features/check-in/check-in.store';
import { useOnboardingStore } from '@/src/features/onboarding/onboarding.store';
import { useAppStore } from '@/src/store/app.store';

function getNextRoute() {
  const pendingMeasurementId =
    useCheckInStore.getState().measurementId;

  if (pendingMeasurementId) {
    return '/(check-in)/processing';
  }

  const {
    welcomeCompleted,
    profileCompleted,
    firstCheckInCompleted,
  } = useOnboardingStore.getState();

  if (!welcomeCompleted) {
    return '/(onboarding)/welcome';
  }

  if (!profileCompleted) {
    return '/(check-in)';
  }

  if (!firstCheckInCompleted) {
    return '/(check-in)/permissions';
  }

  return '/(app)/(tabs)';
}

export default function StartupScreen() {
  const bootstrap = useAppStore(
    (state) => state.bootstrap,
  );
  const retryBootstrap = useAppStore(
    (state) => state.retryBootstrap,
  );
  const isBootstrapped = useAppStore(
    (state) => state.isBootstrapped,
  );
  const bootstrapError = useAppStore(
    (state) => state.bootstrapError,
  );

  const localReady = useAppStore((state) => state.localReady);

  const [animationDone, setAnimationDone] =
    useState(false);
  const hasStarted = useRef(false);
  const hasNavigated = useRef(false);

  const handleAnimationComplete = useCallback(
    () => {
      setAnimationDone(true);
    },
    [],
  );

  useEffect(() => {
    if (hasStarted.current) {
      return;
    }

    hasStarted.current = true;
    bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    if (
      !animationDone ||
      !isBootstrapped ||
      hasNavigated.current
    ) {
      return;
    }

    hasNavigated.current = true;
    router.replace(getNextRoute());
  }, [animationDone, isBootstrapped]);

  const handleRetry = async () => {
    hasNavigated.current = false;
    await retryBootstrap();
  };

  return (
    <StartupAnimation
      error={bootstrapError}
      onAnimationComplete={
        handleAnimationComplete
      }
      onRetry={handleRetry}
      onSignIn={localReady
        ? () => router.replace('/(auth)/sign-in')
        : undefined}
    />
  );
}
