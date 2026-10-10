import { create } from 'zustand';

const DEFAULT_PREFERENCES = {
  in_app_notifications: true,
  report_ready: true,
  family_activity: true,
  email_notifications: false,
  checkin_reminders: false,
  reminder_time: '08:30',
};

export const useNotificationsStore = create((set) => ({
  unreadCount: 0,
  ready: false,
  session: null,
  permission: null,
  pushStatus: '',
  preferences: DEFAULT_PREFERENCES,

  setUnreadCount: (unreadCount) =>
    set({
      unreadCount: Math.max(
        0,
        Number(unreadCount) || 0,
      ),
    }),

  decrementUnread: () =>
    set((state) => ({
      unreadCount: Math.max(
        0,
        state.unreadCount - 1,
      ),
    })),

  incrementUnread: () =>
    set((state) => ({
      unreadCount: state.unreadCount + 1,
    })),

  setDeviceState: (deviceState) =>
    set(deviceState),

  setSession: (session) =>
    set({
      session,
    }),

  clearSession: () =>
    set({
      session: null,
      ready: false,
    }),

  setReady: (ready) =>
    set({
      ready,
    }),

  setPreferences: (preferences) =>
    set((state) => ({
      preferences: {
        ...state.preferences,
        ...preferences,
      },
    })),
}));