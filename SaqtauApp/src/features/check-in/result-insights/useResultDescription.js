import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { descriptionWaitMs, loadMeasurementDescription } from './description.api';

const MAX_CHECKS_PER_VISIT = 6;

export default function useResultDescription(measurementId, language, token, enabled) {
  const [state, setState] = useState({ status: enabled ? 'loading' : 'unavailable', description: '' });
  const [retryVersion, setRetryVersion] = useState(0);
  const [canRetry, setCanRetry] = useState(false);

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    let inFlight = false;
    let checks = 0;
    let timer;
    let pending = true;
    let retryable = false;
    let appState = AppState.currentState;
    const isActive = () => !appState || appState === 'active';

    function update(next) {
      if (!cancelled) setState(next);
    }

    function allowRetry() {
      clearTimeout(timer);
      if (cancelled || !isActive() || !retryable) return;
      try {
        const wait = descriptionWaitMs(measurementId, language, token);
        if (wait > 0) timer = setTimeout(allowRetry, wait);
        else setCanRetry(true);
      } catch {
        setCanRetry(false);
      }
    }

    async function run() {
      if (cancelled || inFlight || !isActive() || !pending) return;
      clearTimeout(timer);
      inFlight = true;
      try {
        if (descriptionWaitMs(measurementId, language, token) === 0) checks += 1;
        const result = await loadMeasurementDescription(measurementId, language, token);
        if (cancelled) return;
        if (result.status === 'pending') {
          update({ status: 'pending', description: '' });
          if (checks < MAX_CHECKS_PER_VISIT) {
            if (isActive()) timer = setTimeout(run, descriptionWaitMs(measurementId, language, token));
          } else {
            pending = false;
            retryable = true;
            update({ status: 'waiting', description: '' });
            allowRetry();
          }
        } else {
          pending = false;
          update(result);
          retryable = ['failed', 'unavailable'].includes(result.status);
          allowRetry();
        }
      } catch (error) {
        if (cancelled) return;
        pending = false;
        const forbidden = [401, 403].includes(error?.status);
        retryable = !forbidden;
        update({
          status: forbidden ? 'forbidden' : [404, 405, 410].includes(error?.status) ? 'unavailable' : 'error',
          description: '',
        });
        allowRetry();
      } finally {
        inFlight = false;
      }
    }

    setCanRetry(false);
    update({ status: 'loading', description: '' });
    run();
    const subscription = AppState.addEventListener('change', (next) => {
      appState = next;
      clearTimeout(timer);
      if (isActive()) {
        if (pending) run();
        else allowRetry();
      }
    });

    return () => {
      cancelled = true;
      clearTimeout(timer);
      subscription.remove();
    };
  }, [measurementId, language, token, enabled, retryVersion]);

  return {
    ...state,
    canRetry,
    retry: () => {
      if (!canRetry) return;
      setCanRetry(false);
      setRetryVersion((value) => value + 1);
    },
  };
}
