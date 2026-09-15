import { create } from 'zustand';

import { getPendingMeasurementId } from '@/src/features/check-in/check-in.storage';

export const useCheckInStore = create((set) => ({
  videoUri: null,
  measurementId: null,
  measurement: null,
  uploadProgress: 0,
  phase: 'idle',
  error: null,
  isHydrated: false,

  hydrate: async () => {
    const measurementId =
      await getPendingMeasurementId();

    set({
      measurementId,
      phase: measurementId
        ? 'processing'
        : 'idle',
      isHydrated: true,
    });
  },

  setVideoUri: (videoUri) => {
    set({
      videoUri,
      measurementId: null,
      measurement: null,
      uploadProgress: 0,
      phase: videoUri ? 'captured' : 'idle',
      error: null,
    });
  },

  setMeasurementId: (measurementId) => {
    set({ measurementId });
  },

  setMeasurement: (measurement) => {
    set({
      measurement,
      measurementId:
        measurement?.id || null,
    });
  },

  setUploadProgress: (uploadProgress) => {
    set({ uploadProgress });
  },

  setPhase: (phase) => {
    set({ phase });
  },

  setError: (error) => {
    set({ error });
  },

  resetCapture: () => {
    set({
      videoUri: null,
      uploadProgress: 0,
      phase: 'idle',
      error: null,
    });
  },

  resetAll: () => {
    set({
      videoUri: null,
      measurementId: null,
      measurement: null,
      uploadProgress: 0,
      phase: 'idle',
      error: null,
    });
  },
}));
