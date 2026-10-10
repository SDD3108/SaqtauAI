import * as Network from 'expo-network';
import { create } from 'zustand';

function toOffline(state) {
  if (!state) return false;
  return state.isConnected === false || state.isInternetReachable === false;
}

export const useNetworkStore = create((set, get) => ({
  checked: false,
  checking: false,
  offline: false,
  state: null,
  message: '',

  apply: (state) => {
    set({
      checked: true,
      checking: false,
      state,
      offline: toOffline(state),
    });
  },

  check: async () => {
    if (get().checking) return get().state;
    set({ checking: true, message: '' });

    try {
      const state = await Network.getNetworkStateAsync();
      get().apply(state);
      return state;
    } catch {
      set({ checked: true, checking: false });
      return null;
    }
  },

  setMessage: (message) => set({ message }),
}));
