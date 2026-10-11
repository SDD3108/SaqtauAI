// The Expo push token should be bound at most once per authenticated session.
// Repeated automatic failures are held back, but explicit user retries may bypass
// the cooldown (e.g. after fixing connectivity or server configuration).
export const PUSH_REGISTRATION_RETRY_COOLDOWN_MS = 5 * 60_000;

export function createPushRegistrationGate({ now = () => Date.now() } = {}) {
  let active = null;
  let successful = null;
  let failed = null;
  let generation = 0;

  function run(sessionKey, task, { force = false } = {}) {
    if (!sessionKey) {
      return Promise.resolve({
        ok: false,
        status: 'auth_missing',
        message: 'Sign in before registering for push notifications.',
      });
    }

    // Multiple callers share the one registration already in progress.
    if (active?.sessionKey === sessionKey) return active.promise;

    if (!force && successful?.sessionKey === sessionKey) {
      return Promise.resolve({
        ok: true,
        status: 'already_registered',
        token: successful.token,
      });
    }

    if (
      !force &&
      failed?.sessionKey === sessionKey &&
      now() - failed.at < PUSH_REGISTRATION_RETRY_COOLDOWN_MS
    ) {
      return Promise.resolve({
        ok: false,
        status: 'retry_later',
        message: 'Push registration failed recently. Retry from notification settings.',
      });
    }

    const startedInGeneration = generation;
    const promise = Promise.resolve()
      .then(task)
      .then(
        (result) => {
          if (startedInGeneration !== generation) return result;
          if (result?.ok) {
            successful = { sessionKey, token: result.token };
            failed = null;
          } else if (result?.status === 'backend_registration_failed') {
            failed = { sessionKey, at: now() };
          }
          return result;
        },
        (error) => {
          if (startedInGeneration === generation) {
            failed = { sessionKey, at: now() };
          }
          throw error;
        },
      )
      .finally(() => {
        if (active?.promise === promise) active = null;
      });

    active = { sessionKey, promise };
    return promise;
  }

  function reset() {
    generation += 1;
    successful = null;
    failed = null;
    active = null;
  }

  return { run, reset };
}
