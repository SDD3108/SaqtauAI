import { useCallback, useEffect, useState } from 'react';

import {
  getFamilyScreenTime,
  updateFamilyScreenTime,
} from '@/src/features/family/family-controls.api';
import {
  DEFAULT_SCREEN_TIME,
  familyControlsErrorMessage,
  normalizeScreenTimeResponse,
} from '@/src/features/family/family-controls.utils';

export default function useFamilyScreenTime(accountId) {
  const [screenTime, setScreenTime] = useState(DEFAULT_SCREEN_TIME);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState('');
  const [error, setError] = useState('');
  const [available, setAvailable] = useState(false);

  const load = useCallback(async () => {
    if (!accountId) {
      setLoading(false);
      setError('Family member is missing.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = normalizeScreenTimeResponse(await getFamilyScreenTime(accountId));
      setScreenTime(result.screenTime);
      setUpdatedAt(result.updatedAt);
      setAvailable(true);
    } catch (loadError) {
      setAvailable(false);
      setError(
        familyControlsErrorMessage(loadError, 'Could not load Screen Time settings.'),
      );
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    load();
  }, [load]);

  const savePatch = useCallback(
    async (key, patch) => {
      setSavingKey(key);
      setError('');
      try {
        const response = await updateFamilyScreenTime(accountId, patch);
        const normalized = normalizeScreenTimeResponse(response);
        setScreenTime((current) => ({
          ...current,
          ...patch,
          quiet_hours: {
            ...current.quiet_hours,
            ...(patch.quiet_hours || {}),
          },
        }));
        setUpdatedAt(normalized.updatedAt || new Date().toISOString());
        setAvailable(true);
        return true;
      } catch (updateError) {
        if (updateError?.status === 403 || updateError?.status === 404 || updateError?.status === 405) {
          setAvailable(false);
        }
        setError(
          familyControlsErrorMessage(
            updateError,
            'Could not update Screen Time settings.',
          ),
        );
        return false;
      } finally {
        setSavingKey('');
      }
    },
    [accountId],
  );

  const setDailyLimit = useCallback(
    (minutes) => savePatch('daily_limit_minutes', { daily_limit_minutes: minutes }),
    [savePatch],
  );

  const setQuietHours = useCallback(
    (patch) =>
      savePatch('quiet_hours', {
        quiet_hours: {
          ...screenTime.quiet_hours,
          ...patch,
        },
      }),
    [savePatch, screenTime.quiet_hours],
  );

  return {
    screenTime,
    updatedAt,
    loading,
    savingKey,
    error,
    available,
    reload: load,
    setDailyLimit,
    setQuietHours,
  };
}
