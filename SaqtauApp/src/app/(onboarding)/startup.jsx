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
    />
  );
}


// import { router } from 'expo-router';
// import { useEffect, useRef } from 'react';

// import StartupAnimation from '@/src/features/onboarding/components/StartupAnimation';
// import { useOnboardingStore } from '@/src/features/onboarding/onboarding.store';
// import { useAppStore } from '@/src/store/app.store';

// const MIN_STARTUP_TIME = 900;

// function wait(ms) {
//   return new Promise((resolve) => setTimeout(resolve, ms));
// }

// function getNextRoute() {
//   const { welcomeCompleted, profileCompleted, firstCheckInCompleted } =
//     useOnboardingStore.getState();

//   if (!welcomeCompleted) {
//     return '/(onboarding)/welcome';
//   }

//   if (!profileCompleted || !firstCheckInCompleted) {
//     return '/(check-in)';
//   }

//   return '/(app)/(tabs)';
// }

// export default function StartupScreen() {
//   const bootstrap = useAppStore((state) => state.bootstrap);
//   const retryBootstrap = useAppStore((state) => state.retryBootstrap);
//   const bootstrapError = useAppStore((state) => state.bootstrapError);
//   const hasStarted = useRef(false);

//   const start = async (retry = false) => {
//     const startedAt = Date.now();
//     const success = retry ? await retryBootstrap() : await bootstrap();
//     const elapsed = Date.now() - startedAt;

//     if (elapsed < MIN_STARTUP_TIME) {
//       await wait(MIN_STARTUP_TIME - elapsed);
//     }

//     if (success) {
//       router.replace(getNextRoute());
//     }
//   };

//   useEffect(() => {
//     if (hasStarted.current) {
//       return;
//     }

//     hasStarted.current = true;
//     start();
//   }, []);

//   return <StartupAnimation error={bootstrapError} onRetry={() => start(true)} />;
// }
