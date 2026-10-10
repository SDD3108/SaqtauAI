import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuthStore } from '@/src/features/auth/auth.store';
import { tNow } from '@/src/features/localization/localization.store';
import { getFamilyScreenTime } from '@/src/features/family/family-controls.api';
import {
  DEFAULT_SCREEN_TIME,
  normalizeScreenTimeResponse,
} from '@/src/features/family/family-controls.utils';
import {
  clearDeviceScreenTimePolicy,
  clearDeviceScreenTimeSelection,
  configureDeviceScreenTimePolicy,
  getDeviceScreenTimeStatus,
  presentDeviceScreenTimePicker,
  requestDeviceScreenTimeAuthorization,
} from '@/src/features/screen-time/screen-time.native';

function cloneDefaultPolicy() {
  return {
    daily_limit_minutes: 120,
    quiet_hours: { ...DEFAULT_SCREEN_TIME.quiet_hours },
  };
}

function policyFromNative(status) {
  const native = status?.policy;
  if (!native || typeof native !== 'object') return null;

  return normalizeScreenTimeResponse({
    screen_time: {
      daily_limit_minutes: native.dailyLimitMinutes,
      quiet_hours: native.quietHours,
    },
  }).screenTime;
}

function parseBirthDate(account) {
  const profile = account?.profile_data || {};
  const raw = profile.dateOfBirth || profile.date_of_birth || null;
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

function ageFromDate(date) {
  if (!date) return null;
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDelta = today.getMonth() - date.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < date.getDate())) {
    age -= 1;
  }
  return age;
}

export default function useDeviceScreenTime() {
  const account = useAuthStore((state) => state.account);
  const isGuest = useAuthStore((state) => state.isGuest);

  const [status, setStatus] = useState(null);
  const [policy, setPolicy] = useState(cloneDefaultPolicy);
  const [policySource, setPolicySource] = useState('local');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [serverNote, setServerNote] = useState('');

  const birthDate = useMemo(() => parseBirthDate(account), [account]);
  const age = useMemo(() => ageFromDate(birthDate), [birthDate]);
  const recommendedMode = age !== null && age < 18 ? 'child' : 'individual';

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const nativeStatus = await getDeviceScreenTimeStatus();
      setStatus(nativeStatus);

      const localPolicy = policyFromNative(nativeStatus);
      if (localPolicy) {
        setPolicy(localPolicy);
        setPolicySource('device');
      }

      if (!isGuest && account?.id) {
        try {
          const response = await getFamilyScreenTime(account.id);
          const normalized = normalizeScreenTimeResponse(response).screenTime;
          setPolicy({
            daily_limit_minutes:
              normalized.daily_limit_minutes ?? localPolicy?.daily_limit_minutes ?? 120,
            quiet_hours: normalized.quiet_hours,
          });
          setPolicySource('family');
          setServerNote(tNow('screenTime.loadedFamily'));
        } catch (serverError) {
          if ([403, 404, 405].includes(serverError?.status)) {
            setServerNote(tNow('screenTime.selfReadUnavailable'));
          } else if (serverError?.message) {
            setServerNote(tNow('screenTime.familyLoadError', { message: serverError.message }));
          }
        }
      }
    } catch (nativeError) {
      setError(nativeError?.message || tNow('screenTime.statusError'));
    } finally {
      setLoading(false);
    }
  }, [account?.id, isGuest]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const run = useCallback(
    async (key, action) => {
      setBusy(key);
      setError('');
      try {
        const result = await action();
        if (result) setStatus(result);
        return result;
      } catch (actionError) {
        setError(actionError?.message || tNow('screenTime.actionError'));
        throw actionError;
      } finally {
        setBusy('');
      }
    },
    [],
  );

  const requestAccess = useCallback(
    async (mode = recommendedMode) => {
      const result = await run('authorization', () =>
        requestDeviceScreenTimeAuthorization(mode),
      );
      return result;
    },
    [recommendedMode, run],
  );

  const chooseApps = useCallback(async () => {
    const result = await run('picker', presentDeviceScreenTimePicker);
    return result;
  }, [run]);

  const applyPolicy = useCallback(async () => {
    const limit = Number(policy.daily_limit_minutes);
    if (!Number.isFinite(limit) || limit <= 0) {
      setError(tNow('screenTime.chooseDailyLimit')); 
      return null;
    }

    const result = await run('apply', () =>
      configureDeviceScreenTimePolicy({
        dailyLimitMinutes: Math.round(limit),
        quietHours: policy.quiet_hours,
      }),
    );
    setPolicySource('device');
    return result;
  }, [policy, run]);

  const clearPolicy = useCallback(async () => {
    const result = await run('clear', clearDeviceScreenTimePolicy);
    setPolicySource('local');
    return result;
  }, [run]);

  const clearSelection = useCallback(async () => {
    const result = await run('selection', clearDeviceScreenTimeSelection);
    return result;
  }, [run]);

  const setDailyLimit = useCallback((minutes) => {
    setPolicy((current) => ({
      ...current,
      daily_limit_minutes: Number(minutes),
    }));
  }, []);

  const setQuietHours = useCallback((patch) => {
    setPolicy((current) => ({
      ...current,
      quiet_hours: {
        ...current.quiet_hours,
        ...patch,
      },
    }));
  }, []);

  return {
    status,
    policy,
    policySource,
    serverNote,
    loading,
    busy,
    error,
    age,
    recommendedMode,
    refresh,
    requestAccess,
    chooseApps,
    applyPolicy,
    clearPolicy,
    clearSelection,
    setDailyLimit,
    setQuietHours,
  };
}