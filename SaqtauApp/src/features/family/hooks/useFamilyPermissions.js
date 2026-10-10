import { useCallback, useEffect, useState } from 'react';

import {
  getFamilyPermissions,
  updateFamilyPermissions,
} from '@/src/features/family/family-controls.api';
import {
  DEFAULT_PERMISSIONS,
  familyControlsErrorMessage,
  normalizePermissionsResponse,
} from '@/src/features/family/family-controls.utils';

export default function useFamilyPermissions(accountId) {
  const [permissions, setPermissions] = useState(DEFAULT_PERMISSIONS);
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
      const result = normalizePermissionsResponse(await getFamilyPermissions(accountId));
      setPermissions(result.permissions);
      setUpdatedAt(result.updatedAt);
      setAvailable(true);
    } catch (loadError) {
      setAvailable(false);
      setError(
        familyControlsErrorMessage(
          loadError,
          'Could not load family permissions.',
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    load();
  }, [load]);

  const update = useCallback(
    async (key, value) => {
      setSavingKey(key);
      setError('');
      try {
        const response = await updateFamilyPermissions(accountId, { [key]: value });
        const normalized = normalizePermissionsResponse(response);
        setPermissions((current) => ({
          ...current,
          [key]: value,
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
            'Could not update this family permission.',
          ),
        );
        return false;
      } finally {
        setSavingKey('');
      }
    },
    [accountId],
  );

  return {
    permissions,
    updatedAt,
    loading,
    savingKey,
    error,
    available,
    reload: load,
    update,
  };
}
