import { create } from 'zustand';

import {
  createGuestSession,
  getCurrentAccount,
} from '@/src/features/auth/auth.api';
import { ApiError, setApiToken } from '@/src/services/api/client';
import {
  removeSecureItem,
  getSecureItem,
  setSecureItem,
} from '@/src/services/storage/secure-storage';
import { getJSON, removeStorageItem, setJSON } from '@/src/services/storage/storage';
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

export const useAuthStore = create((set, get) => ({
  token: null,
  sessionType: null,
  account: null,
  isGuest: true,
  isReady: false,

  setSession: async ({ token, account }) => {
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

  clearSession: async () => {
    await clearPersistedSession();
    setApiToken(null);

    set({
      token: null,
      sessionType: null,
      account: null,
      isGuest: true,
      isReady: false,
    });
  },
}));