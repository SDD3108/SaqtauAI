import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  getFamilyMember,
  removeFamilyMember,
} from '@/src/features/family/family.api';
import { normalizeFamilyMember } from '@/src/features/family/family.utils';

export default function useFamilyMember(accountId) {
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState('');

  const normalizedId = useMemo(() => String(accountId || ''), [accountId]);

  const load = useCallback(async () => {
    if (!normalizedId) {
      setLoading(false);
      setError('Family member is missing.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await getFamilyMember(normalizedId);
      setMember(normalizeFamilyMember(result));
    } catch (loadError) {
      setError(loadError?.message || 'Could not load this family member.');
    } finally {
      setLoading(false);
    }
  }, [normalizedId]);

  useEffect(() => {
    load();
  }, [load]);

  const remove = useCallback(async () => {
    setRemoving(true);
    setError('');
    try {
      await removeFamilyMember(normalizedId);
      return true;
    } catch (removeError) {
      setError(removeError?.message || 'Could not remove this family member.');
      return false;
    } finally {
      setRemoving(false);
    }
  }, [normalizedId]);

  return {
    member,
    loading,
    removing,
    error,
    reload: load,
    remove,
  };
}
