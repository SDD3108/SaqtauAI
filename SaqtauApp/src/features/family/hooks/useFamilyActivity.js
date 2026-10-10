import { useCallback, useEffect, useState } from 'react';

import { getFamilyActivity } from '@/src/features/family/family-controls.api';
import {
  familyControlsErrorMessage,
  normalizeActivityResponse,
} from '@/src/features/family/family-controls.utils';

export default function useFamilyActivity(accountId) {
  const [range, setRange] = useState('7d');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(
    async ({ refresh = false } = {}) => {
      if (!accountId) {
        setLoading(false);
        setError('Family member is missing.');
        return;
      }

      refresh ? setRefreshing(true) : setLoading(true);
      setError('');
      try {
        const result = normalizeActivityResponse(
          await getFamilyActivity(accountId, range),
          range,
        );
        setEvents(result.events);
      } catch (loadError) {
        setError(
          familyControlsErrorMessage(loadError, 'Could not load family activity.'),
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [accountId, range],
  );

  useEffect(() => {
    load();
  }, [load]);

  return {
    range,
    setRange,
    events,
    loading,
    refreshing,
    error,
    reload: () => load(),
    refresh: () => load({ refresh: true }),
  };
}
