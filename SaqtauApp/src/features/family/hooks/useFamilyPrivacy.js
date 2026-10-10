import { useCallback, useEffect, useState } from 'react';

import {
  deleteFamilyMemberData,
  getFamilyPrivacy,
  updateFamilyPrivacy,
} from '@/src/features/family/family-controls.api';
import {
  DEFAULT_PRIVACY,
  deletedDataSummary,
  familyControlsErrorMessage,
  normalizePrivacyResponse,
} from '@/src/features/family/family-controls.utils';

export default function useFamilyPrivacy(accountId) {
  const [privacy, setPrivacy] = useState(DEFAULT_PRIVACY);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState('');
  const [deleting, setDeleting] = useState(false);
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
      const result = normalizePrivacyResponse(await getFamilyPrivacy(accountId));
      setPrivacy(result.privacy);
      setUpdatedAt(result.updatedAt);
      setAvailable(true);
    } catch (loadError) {
      setAvailable(false);
      setError(
        familyControlsErrorMessage(loadError, 'Could not load privacy settings.'),
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
        const response = await updateFamilyPrivacy(accountId, { [key]: value });
        const normalized = normalizePrivacyResponse(response);
        setPrivacy((current) => ({
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
          familyControlsErrorMessage(updateError, 'Could not update privacy settings.'),
        );
        return false;
      } finally {
        setSavingKey('');
      }
    },
    [accountId],
  );

  const deleteData = useCallback(async () => {
    setDeleting(true);
    setError('');
    try {
      const result = await deleteFamilyMemberData(accountId);
      return {
        ok: true,
        message: deletedDataSummary(result),
      };
    } catch (deleteError) {
      if (deleteError?.status === 403 || deleteError?.status === 404 || deleteError?.status === 405) {
        setAvailable(false);
      }
      const message = familyControlsErrorMessage(
        deleteError,
        'Could not delete this family member data.',
      );
      setError(message);
      return { ok: false, message };
    } finally {
      setDeleting(false);
    }
  }, [accountId]);

  return {
    privacy,
    updatedAt,
    loading,
    savingKey,
    deleting,
    error,
    available,
    reload: load,
    update,
    deleteData,
  };
}
