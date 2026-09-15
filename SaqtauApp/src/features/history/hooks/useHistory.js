import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

import { useAuthStore } from '@/src/features/auth/auth.store';
import { getLocalGuestCheckIns } from '@/src/features/check-in/check-in.storage';
import { getMeasurementsHistory } from '@/src/features/history/history.api';
import {
  average,
  filterByPeriod,
  filterCompleted,
} from '@/src/features/history/history.utils';

export default function useHistory() {
  const isGuest = useAuthStore((state) => state.isGuest);
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
        const items = isGuest
          ? await getLocalGuestCheckIns()
          : await getMeasurementsHistory();

        setMeasurements(filterCompleted(items));
      } catch (loadError) {
        setError(
          loadError?.message ||
            'Could not load your check-in history.',
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

  const periodMeasurements = useMemo(
    () => filterByPeriod(measurements, period),
    [measurements, period],
  );

  const stats = useMemo(
    () => ({
      averageBpm: average(
        periodMeasurements,
        (item) => item.bpm,
      ),
      averageHrv: average(
        periodMeasurements,
        (item) => item.hrv_rmssd_ms,
      ),
      count: periodMeasurements.length,
    }),
    [periodMeasurements],
  );

  const chartPoints = useMemo(
    () =>
      [...periodMeasurements]
        .reverse()
        .map((item) => ({
          id: item.id,
          value: Number(item.bpm),
          date:
            item.processed_at || item.created_at || null,
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
