import { router } from 'expo-router';
import { useEffect, useRef } from 'react';

import StartupAnimation from '@/features/onboarding/components/StartupAnimation';
import { useOnboardingStore } from '@/features/onboarding/onboarding.store';
import { useAppStore } from '@/store/app.store';

const MIN_STARTUP_TIME = 900;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getNextRoute() {
  const { welcomeCompleted, profileCompleted, firstCheckInCompleted } =
    useOnboardingStore.getState();

  if (!welcomeCompleted) {
    return '/(onboarding)/welcome';
  }

  if (!profileCompleted || !firstCheckInCompleted) {
    return '/(check-in)';
  }

  return '/(app)/(tabs)';
}

export default function StartupScreen() {
  const bootstrap = useAppStore((state) => state.bootstrap);
  const retryBootstrap = useAppStore((state) => state.retryBootstrap);
  const bootstrapError = useAppStore((state) => state.bootstrapError);
  const hasStarted = useRef(false);

  const start = async (retry = false) => {
    const startedAt = Date.now();
    const success = retry ? await retryBootstrap() : await bootstrap();
    const elapsed = Date.now() - startedAt;

    if (elapsed < MIN_STARTUP_TIME) {
      await wait(MIN_STARTUP_TIME - elapsed);
    }

    if (success) {
      router.replace(getNextRoute());
    }
  };

  useEffect(() => {
    if (hasStarted.current) {
      return;
    }

    hasStarted.current = true;
    start();
  }, []);

  return <StartupAnimation error={bootstrapError} onRetry={() => start(true)} />;
}
