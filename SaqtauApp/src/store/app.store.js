import { create } from 'zustand';

import { useAuthStore } from '@/src/features/auth/auth.store';
import { useCheckInStore } from '@/src/features/check-in/check-in.store';
import { useOnboardingStore } from '@/src/features/onboarding/onboarding.store';
import { ApiError } from '@/src/services/api/client';

let bootstrapPromise = null;

function describeFailure(error, stage) {
  let key = 'startupUnexpected';
  let code = 'LOCAL';
  if (error instanceof ApiError) {
    code = error.code;
    if (code === 'NETWORK') key = 'startupNetwork';
    else if (code === 'TIMEOUT') key = 'startupTimeout';
    else if (code === 'INVALID_RESPONSE') key = 'startupInvalidResponse';
    else if (error.status === 429) key = 'startupBusy';
    else if (error.status >= 500) key = 'startupServer';
    else key = 'startupRejected';
  }
  return {
    titleKey: code === 'LOCAL' ? 'onboarding.startupLocalTitle' : 'onboarding.startupErrorTitle',
    messageKey: `onboarding.${key}`,
    diagnostic: `${stage.toUpperCase()}-${code}${error?.status ? `-${error.status}` : ''}`,
  };
}

export const useAppStore = create((set, get) => ({
  isBootstrapped: false,
  isBootstrapping: false,
  localReady: false,
  bootstrapError: null,

  bootstrap: () => {
    if (bootstrapPromise) return bootstrapPromise;
    if (get().isBootstrapped) return Promise.resolve(true);

    set({ isBootstrapping: true, bootstrapError: null, localReady: false });
    // All callers await the same work. A retry cannot overlap unfinished hydration.
    bootstrapPromise = Promise.resolve().then(async () => {
      const auth = useAuthStore.getState();
      const tasks = [
        ['onboarding', () => useOnboardingStore.getState().hydrate()],
        ['checkin', () => useCheckInStore.getState().hydrate()],
        ['session', () => auth.isReady && auth.token && auth.account?.id
          ? Promise.resolve() // Already authenticated in this process.
          : auth.restoreSession()],
      ];
      const results = await Promise.allSettled(
        tasks.map(([, run]) => Promise.resolve().then(run)),
      );
      const localReady = results[0].status === 'fulfilled' && results[1].status === 'fulfilled';
      const failedIndex = results.findIndex((result) => result.status === 'rejected');
      if (failedIndex !== -1) {
        const error = describeFailure(results[failedIndex].reason, tasks[failedIndex][0]);
        console.warn('[STARTUP ERROR]', error.diagnostic);
        set({ isBootstrapped: false, localReady, bootstrapError: error });
        return false;
      }
      set({ isBootstrapped: true, localReady: true, bootstrapError: null });
      return true;
    }).finally(() => {
      bootstrapPromise = null;
      set({ isBootstrapping: false });
    });
    return bootstrapPromise;
  },

  retryBootstrap: () => get().bootstrap(),
}));
