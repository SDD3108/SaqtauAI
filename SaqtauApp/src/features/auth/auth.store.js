import { create } from 'zustand';

import {
  createGuestSession,
  getCurrentAccount,
  loginWithEmail,
  registerWithEmail,
  updateCurrentAccount,
  upgradeGuestWithEmail,
} from '@/src/features/auth/auth.api';
import {
  buildAccountPatch,
  preserveGuestCheckInsForAccount,
  readLocalProfile,
} from '@/src/features/auth/auth.migration';
import { ApiError, setApiToken } from '@/src/services/api/client';
import { detachNotificationDevice } from '@/src/services/notifications/push';
import {
  getSecureItem,
  removeSecureItem,
  setSecureItem,
} from '@/src/services/storage/secure-storage';
import {
  getJSON,
  removeStorageItem,
  setJSON,
} from '@/src/services/storage/storage';
import {
  SECURE_STORAGE_KEYS,
  STORAGE_KEYS,
} from '@/src/services/storage/keys';

async function persistSession(token, sessionType, account) {
  await Promise.all([
    setSecureItem(SECURE_STORAGE_KEYS.ACCESS_TOKEN, token),
    setSecureItem(SECURE_STORAGE_KEYS.SESSION_TYPE, sessionType),
    setJSON(STORAGE_KEYS.ACCOUNT_SNAPSHOT, account),
  ]);
}

async function clearPersistedSession() {
  await Promise.all([
    removeSecureItem(SECURE_STORAGE_KEYS.ACCESS_TOKEN),
    removeSecureItem(SECURE_STORAGE_KEYS.SESSION_TYPE),
    removeStorageItem(STORAGE_KEYS.ACCOUNT_SNAPSHOT),
  ]);
}

async function trySyncGuestContext(account, {
  displayName,
  overwriteProfile = false,
} = {}) {
  const localProfile = await readLocalProfile();

  await preserveGuestCheckInsForAccount(account?.id);

  try {
    const updated = await updateCurrentAccount(
      buildAccountPatch(account, localProfile, {
        displayName,
        overwriteProfile,
      }),
    );

    return {
      account: updated,
      warning: '',
    };
  } catch (error) {
    return {
      account,
      warning:
        'Your account is ready. Your local check-ins are safe, but some profile details could not sync yet.',
      error,
    };
  }
}

export const useAuthStore = create((set, get) => ({
  token: null,
  sessionType: null,
  account: null,
  isGuest: true,
  isReady: false,
  authBusy: false,
  migrationWarning: '',

  setSession: async ({ token, account }) => {
    if (get().token && get().account?.id && get().account.id !== account?.id) {
      await detachNotificationDevice(get().token, get().account.id);
    }

    const isGuest = Boolean(account?.settings_data?.guest);
    const sessionType = isGuest ? 'guest' : 'account';

    setApiToken(token);
    await persistSession(token, sessionType, account);

    set({
      token,
      sessionType,
      account,
      isGuest,
      isReady: true,
    });
  },

  replaceAccount: async (account) => {
    const token = get().token;

    if (!token || !account) {
      return;
    }

    const isGuest = Boolean(account?.settings_data?.guest);
    const sessionType = isGuest ? 'guest' : 'account';

    await persistSession(token, sessionType, account);
    set({
      account,
      sessionType,
      isGuest,
    });
  },

  createGuest: async () => {
    const response = await createGuestSession();

    await get().setSession({
      token: response.token,
      account: response.account,
    });

    return response.account;
  },

  restoreSession: async () => {
    const [token, sessionType, cachedAccount] = await Promise.all([
      getSecureItem(SECURE_STORAGE_KEYS.ACCESS_TOKEN),
      getSecureItem(SECURE_STORAGE_KEYS.SESSION_TYPE),
      getJSON(STORAGE_KEYS.ACCOUNT_SNAPSHOT),
    ]);

    if (!token) {
      await get().createGuest();
      return;
    }

    setApiToken(token);
    set({
      token,
      sessionType,
      account: cachedAccount,
      isGuest: sessionType !== 'account',
    });

    try {
      const account = await getCurrentAccount();
      const isGuest = Boolean(account?.settings_data?.guest);
      const resolvedSessionType = isGuest ? 'guest' : 'account';

      await persistSession(token, resolvedSessionType, account);
      set({
        account,
        sessionType: resolvedSessionType,
        isGuest,
        isReady: true,
      });
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        await clearPersistedSession();
        setApiToken(null);
        set({
          token: null,
          sessionType: null,
          account: null,
          isGuest: true,
        });

        await get().createGuest();
        return;
      }

      throw error;
    }
  },

  signIn: async (email, password) => {
    set({ authBusy: true, migrationWarning: '' });

    try {
      const response = await loginWithEmail(email.trim().toLowerCase(), password);
      await get().setSession(response);

      const migrated = await trySyncGuestContext(response.account, {
        overwriteProfile: false,
      });

      await get().replaceAccount(migrated.account);
      set({ migrationWarning: migrated.warning });

      return migrated.account;
    } finally {
      set({ authBusy: false });
    }
  },

  registerFromGuest: async ({ email, password, displayName, profile }) => {
    set({ authBusy: true, migrationWarning: '' });

    try {
      let response;

      if (get().isGuest) {
        try {
          response = await upgradeGuestWithEmail(
            email.trim().toLowerCase(),
            password,
            displayName,
          );
        } catch (error) {
          if (!(error instanceof ApiError) || ![404, 405].includes(error.status)) {
            throw error;
          }
        }
      }

      if (!response) {
        response = await registerWithEmail(email.trim().toLowerCase(), password);
      }

      await get().setSession(response);
      await preserveGuestCheckInsForAccount(response.account?.id);

      let account = response.account;
      let warning = '';

      try {
        account = await updateCurrentAccount(
          buildAccountPatch(account, profile, {
            displayName,
            overwriteProfile: true,
          }),
        );
        await get().replaceAccount(account);
      } catch (error) {
        warning =
          'Your account was created and your local check-ins are safe. Some profile details will need to sync again later.';
      }

      set({ migrationWarning: warning });
      return account;
    } finally {
      set({ authBusy: false });
    }
  },

  refreshAccount: async () => {
    const account = await getCurrentAccount();
    await get().replaceAccount(account);
    return account;
  },

  clearMigrationWarning: () => set({ migrationWarning: '' }),

  clearSession: async ({ detachDevice = true } = {}) => {
    if (detachDevice && get().token) {
      try {
        await detachNotificationDevice(get().token, get().account?.id);
      } catch {
        console.log("error auth.store");
        // Local sign-out must not be blocked by a stale/offline push binding.
      }
    }

    await clearPersistedSession();
    setApiToken(null);

    set({
      token: null,
      sessionType: null,
      account: null,
      isGuest: true,
      isReady: false,
      authBusy: false,
      migrationWarning: '',
    });
  },
}));
