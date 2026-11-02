import { useCallback, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAuthStore } from '@/src/features/auth/auth.store';
import { listGuardianships, answerGuardianship, requestGuardianship } from '../guardianship.api';

export default function useGuardianships() {
  const actor = useAuthStore(s => !s.isGuest && s.account?.id);
  const [snapshot, setSnapshot] = useState(null);
  const [activity, setActivity] = useState(null);
  const serial = useRef(0);
  const focus = useRef(null);
  const lock = useRef(null);

  const refresh = useCallback(async () => {
    const epoch = focus.current;
    if (!actor || !epoch || epoch.actor !== actor) return;
    const seq = ++serial.current;
    const current = () => focus.current === epoch && serial.current === seq;
    try {
      const links = await listGuardianships();
      if (current()) setSnapshot({actor, links});
    } catch {
      if (current()) setSnapshot({actor, links: [], error: true});
    }
  }, [actor]);

  useFocusEffect(useCallback(() => {
    focus.current = {actor};
    setActivity(null);
    refresh();
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') refresh();
    });
    return () => { focus.current = null; lock.current = null; sub.remove(); };
  }, [actor, refresh]));

  const mutate = async (key, fn, notice) => {
    const epoch = focus.current;
    if (!actor || epoch?.actor !== actor || lock.current) return;
    const ticket = {};
    lock.current = ticket;
    setActivity({key});
    try {
      await fn();
      if (focus.current === epoch) setActivity({notice});
    } catch (e) {
      if (focus.current === epoch) setActivity({error: e?.status === 409 || e?.status === 404
        ? 'guard.changed' : 'guard.saveError'});
    } finally {
      if (focus.current === epoch) await refresh();
      if (lock.current === ticket) lock.current = null;
    }
  };

  const data = snapshot?.actor === actor ? snapshot : null;
  return {
    enabled: !!actor, ready: !!data && !data.error, links: data?.links || [],
    error: data?.error ? 'guard.loadError' : activity?.error,
    notice: activity?.notice, busy: activity?.key, refresh: () => { if (!lock.current) setActivity(null); return refresh(); },
    request: childId => mutate(childId, () => requestGuardianship(childId)),
    answer: (link, choice) => mutate(link.id, () => answerGuardianship(link, choice), choice === 'accept' ? 'guard.acceptedByYou' : 'guard.declinedByYou'),
  };
}
