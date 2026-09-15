import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { useAuthStore } from '@/src/features/auth/auth.store';
import { getLocalGuestCheckIns } from '@/src/features/check-in/check-in.storage';
import {
  getDashboardMeasurements,
  getDashboardSummary,
} from '@/src/features/dashboard/dashboard.api';
import {
  getDashboardMessage,
  getDashboardStatus,
  getLatestCompletedMeasurement,
  getWellnessScore,
} from '@/src/features/dashboard/dashboard.utils';

export default function useDashboard() {
  const isGuest = useAuthStore((state) => state.isGuest);

  const [data, setData] = useState({
    summary: null,
    latest: null,
    wellnessScore: null,
    statusLabel: 'Ready when you are',
    message: 'Complete a check-in to see your latest wellness snapshot.',
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(
    async ({ refresh = false } = {}) => {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError('');

      try {
        let summary = null;
        let measurements = [];

        if (isGuest) {
          // Guest Home is intentionally local-first. Part 3 stores the
          // completed result on-device, so Home does not need to read a
          // server-side dashboard summary for a guest account.
          measurements = await getLocalGuestCheckIns();
        } else {
          const [summaryResult, measurementsResult] =
            await Promise.allSettled([
              getDashboardSummary(),
              getDashboardMeasurements(),
            ]);

          if (summaryResult.status === 'fulfilled') {
            summary = summaryResult.value;
          }

          if (measurementsResult.status === 'fulfilled') {
            measurements = measurementsResult.value;
          }

          if (
            summaryResult.status === 'rejected' &&
            measurementsResult.status === 'rejected'
          ) {
            throw measurementsResult.reason || summaryResult.reason;
          }
        }

        const latest =
          getLatestCompletedMeasurement(measurements) ||
          summary?.latest_measurement ||
          null;

        setData({
          summary,
          latest,
          wellnessScore: getWellnessScore(summary, latest),
          statusLabel: getDashboardStatus(summary, latest),
          message: getDashboardMessage(summary, latest),
        });
      } catch (loadError) {
        setError(
          loadError?.message ||
            'Could not load your latest wellness data.',
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [isGuest],
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return {
    ...data,
    loading,
    refreshing,
    error,
    refresh: () => load({ refresh: true }),
    retry: () => load(),
  };
}
