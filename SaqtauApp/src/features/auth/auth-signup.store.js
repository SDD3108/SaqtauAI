import { create } from 'zustand';

export const useAuthSignupStore = create((set) => ({
  email: '',
  password: '',
  hasCredentials: false,
  returnTo: '',

  setCredentials: (email, password) =>
    set({
      email: email.trim().toLowerCase(),
      password,
      hasCredentials: true,
    }),

  setReturnTo: (returnTo) => set({ returnTo: returnTo || '' }),

  clear: () =>
    set({
      email: '',
      password: '',
      hasCredentials: false,
      returnTo: '',
    }),
}));
