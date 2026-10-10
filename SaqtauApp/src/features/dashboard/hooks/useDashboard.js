import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { useAuthStore } from '@/src/features/auth/auth.store';
import {
  getLocalGuestCheckIns,
  getTransferredAccountCheckIns,
  mergeCheckInsById,
} from '@/src/features/check-in/check-in.storage';
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
  const accountId = useAuthStore((state) => state.account?.id);

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
          measurements = await getLocalGuestCheckIns();
        } else {
          const [summaryResult, measurementsResult, transferredResult] =
            await Promise.allSettled([
              getDashboardSummary(),
              getDashboardMeasurements(),
              getTransferredAccountCheckIns(accountId),
            ]);

          if (summaryResult.status === 'fulfilled') {
            summary = summaryResult.value;
          }

          const serverMeasurements =
            measurementsResult.status === 'fulfilled'
              ? measurementsResult.value
              : [];
          const transferredMeasurements =
            transferredResult.status === 'fulfilled'
              ? transferredResult.value
              : [];

          measurements = mergeCheckInsById(
            transferredMeasurements,
            serverMeasurements,
          );

          if (
            summaryResult.status === 'rejected' &&
            measurementsResult.status === 'rejected' &&
            !transferredMeasurements.length
          ) {
            throw measurementsResult.reason || summaryResult.reason;
          }

          if (
            measurementsResult.status === 'rejected' &&
            transferredMeasurements.length
          ) {
            setError('Showing your transferred check-in while server data refreshes.');
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
        setError(loadError?.message || 'Could not load your latest wellness data.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [accountId, isGuest],
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
