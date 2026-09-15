import { create } from 'zustand';

import { useAuthStore } from '@/src/features/auth/auth.store';
import { useCheckInStore } from '@/src/features/check-in/check-in.store';
import { useOnboardingStore } from '@/src/features/onboarding/onboarding.store';

export const useAppStore = create((set, get) => ({
  isBootstrapped: false,
  isBootstrapping: false,
  bootstrapError: null,

  bootstrap: async () => {
    if (
      get().isBootstrapping ||
      get().isBootstrapped
    ) {
      return true;
    }

    set({
      isBootstrapping: true,
      bootstrapError: null,
    });

    try {
      await Promise.all([
        useOnboardingStore.getState().hydrate(),
        useAuthStore.getState().restoreSession(),
        useCheckInStore.getState().hydrate(),
      ]);

      set({
        isBootstrapped: true,
        isBootstrapping: false,
      });

      return true;
    } catch (error) {
      set({
        isBootstrapped: false,
        isBootstrapping: false,
        bootstrapError:
          error?.message ||
          'Failed to start SaqtauAI',
      });

      return false;
    }
  },

  retryBootstrap: async () => {
    set({
      isBootstrapped: false,
    });

    return get().bootstrap();
  },
}));


// import { create } from 'zustand';

// import { useAuthStore } from '@/src/features/auth/auth.store';
// import { useOnboardingStore } from '@/src/features/onboarding/onboarding.store';

// export const useAppStore = create((set, get) => ({
//   isBootstrapped: false,
//   isBootstrapping: false,
//   bootstrapError: null,

//   bootstrap: async () => {
//     if (get().isBootstrapping || get().isBootstrapped) {
//       return true;
//     }

//     set({
//       isBootstrapping: true,
//       bootstrapError: null,
//     });

//     try {
//       await Promise.all([
//         useOnboardingStore.getState().hydrate(),
//         useAuthStore.getState().restoreSession(),
//       ]);

//       set({
//         isBootstrapped: true,
//         isBootstrapping: false,
//       });

//       return true;
//     } catch (error) {
//       set({
//         isBootstrapped: false,
//         isBootstrapping: false,
//         bootstrapError: error?.message || 'Failed to start SaqtauAI',
//       });

//       return false;
//     }
//   },

//   retryBootstrap: async () => {
//     set({ isBootstrapped: false });
//     return get().bootstrap();
//   },
// }));



// import { create } from 'zustand';

// import { useAuthStore } from '@/src/features/auth/auth.store';
// import { useOnboardingStore } from '@/src/features/onboarding/onboarding.store';

// export const useAppStore = create(
//   (set, get) => ({
//     isBootstrapped: false,

//     isBootstrapping: false,

//     bootstrapError: null,

//     bootstrap: async () => {
//       if (
//         get().isBootstrapping ||
//         get().isBootstrapped
//       ) {
//         return true;
//       }

//       set({
//         isBootstrapping: true,
//         bootstrapError: null,
//       });

//       try {
//         await Promise.all([
//           useOnboardingStore
//             .getState()
//             .hydrate(),

//           useAuthStore
//             .getState()
//             .restoreSession(),
//         ]);

//         set({
//           isBootstrapped: true,
//           isBootstrapping: false,
//         });

//         return true;
//       } catch (error) {
//         set({
//           isBootstrapped: false,

//           isBootstrapping: false,

//           bootstrapError:
//             error?.message ||
//             'Failed to start SaqtauAI',
//         });

//         return false;
//       }
//     },

//     retryBootstrap: async () => {
//       set({
//         isBootstrapped: false,
//       });

//       return get().bootstrap();
//     },
//   }),
// );