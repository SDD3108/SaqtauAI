import { useCallback, useEffect, useState } from 'react';

import {
  getFamily,
  getPendingInvites,
  respondToPendingInvite,
} from '@/src/features/family/family.api';
import {
  normalizeFamilyResponse,
  normalizeInvite,
} from '@/src/features/family/family.utils';

export default function useFamily() {
  const [family, setFamily] = useState({ members: [], max: 5 });
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [actionId, setActionId] = useState('');

  const load = useCallback(async ({ refresh = false } = {}) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setError('');

    try {
      const [familyResult, inviteResult] = await Promise.allSettled([
        getFamily(),
        getPendingInvites(),
      ]);

      if (familyResult.status === 'rejected') {
        throw familyResult.reason;
      }

      setFamily(normalizeFamilyResponse(familyResult.value));

      if (inviteResult.status === 'fulfilled') {
        setInvites(
          (inviteResult.value?.invites || []).map(normalizeInvite).filter(Boolean),
        );
      }
    } catch (loadError) {
      setError(loadError?.message || 'Could not load your family.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const respond = useCallback(
    async (inviteId, action) => {
      setActionId(inviteId);
      setError('');
      try {
        await respondToPendingInvite(inviteId, action);
        await load({ refresh: true });
      } catch (respondError) {
        setError(respondError?.message || 'Could not update the invitation.');
      } finally {
        setActionId('');
      }
    },
    [load],
  );

  return {
    ...family,
    invites,
    loading,
    refreshing,
    error,
    actionId,
    reload: () => load(),
    refresh: () => load({ refresh: true }),
    acceptInvite: (id) => respond(id, 'accept'),
    declineInvite: (id) => respond(id, 'decline'),
  };
}
