import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

import { useAuthStore } from '@/src/features/auth/auth.store';
import {
  getLocalGuestCheckIns,
  getTransferredAccountCheckIns,
  mergeCheckInsById,
} from '@/src/features/check-in/check-in.storage';
import { getMeasurementsHistory } from '@/src/features/history/history.api';
import {
  average,
  filterByPeriod,
  filterCompleted,
} from '@/src/features/history/history.utils';

export default function useHistory() {
  const isGuest = useAuthStore((state) => state.isGuest);
  const accountId = useAuthStore((state) => state.account?.id);
  const [period, setPeriod] = useState('7d');
  const [measurements, setMeasurements] = useState([]);
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
        let items = [];

        if (isGuest) {
          items = await getLocalGuestCheckIns();
        } else {
          const [serverResult, transferredResult] = await Promise.allSettled([
            getMeasurementsHistory(),
            getTransferredAccountCheckIns(accountId),
          ]);

          const serverItems =
            serverResult.status === 'fulfilled' ? serverResult.value : [];
          const transferredItems =
            transferredResult.status === 'fulfilled' ? transferredResult.value : [];

          if (
            serverResult.status === 'rejected' &&
            transferredResult.status === 'rejected'
          ) {
            throw serverResult.reason || transferredResult.reason;
          }

          items = mergeCheckInsById(transferredItems, serverItems);

          if (serverResult.status === 'rejected' && transferredItems.length) {
            setError('Showing transferred check-ins. Server history could not refresh.');
          }
        }

        setMeasurements(filterCompleted(items));
      } catch (loadError) {
        setError(loadError?.message || 'Could not load your check-in history.');
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

  const periodMeasurements = useMemo(
    () => filterByPeriod(measurements, period),
    [measurements, period],
  );

  const stats = useMemo(
    () => ({
      averageBpm: average(periodMeasurements, (item) => item.bpm),
      averageHrv: average(periodMeasurements, (item) => item.hrv_rmssd_ms),
      count: periodMeasurements.length,
    }),
    [periodMeasurements],
  );

  const chartPoints = useMemo(
    () =>
      [...periodMeasurements]
        .filter(
          (item) =>
            item.bpm !== null &&
            item.bpm !== undefined &&
            item.bpm !== '' &&
            typeof item.bpm !== 'boolean',
        )
        .reverse()
        .map((item) => ({
          id: item.id,
          value: Number(item.bpm),
          date: item.processed_at || item.created_at || null,
        }))
        .filter((point) => Number.isFinite(point.value)),
    [periodMeasurements],
  );

  return {
    period,
    setPeriod,
    measurements,
    periodMeasurements,
    chartPoints,
    stats,
    loading,
    refreshing,
    error,
    refresh: () => load({ refresh: true }),
    retry: () => load(),
  };
}