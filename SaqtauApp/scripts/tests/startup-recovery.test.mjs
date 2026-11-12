import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

// Run the production modules with mocked native boundaries; no live API calls.
function load(relativePath, globals, names) {
  const source = fs.readFileSync(new URL(`../../${relativePath}`, import.meta.url), 'utf8')
    .replace(/^import[\s\S]*?from ['"][^'"]+['"];\s*/gm, '')
    .replace(/^export /gm, '');
  return vm.runInNewContext(`${source}\n;({${names.join(',')}})`, globals);
}
function create(init) {
  let state;
  const set = (patch) => { state = { ...state, ...(typeof patch === 'function' ? patch(state) : patch) }; };
  const store = { getState: () => state, setState: set };
  state = init(set, store.getState);
  return store;
}
function client(fetch) {
  const logs = [];
  const api = load('src/services/api/client.js', {
    API_URL: 'https://api.example.test/api/v1', API_TIMEOUT: 20000,
    fetch, AbortController, FormData,
    setTimeout: (fn, delay) => setTimeout(fn, delay === 1000 ? 0 : delay),
    clearTimeout, console: { warn: (...args) => logs.push(args) },
  }, ['apiRequest', 'ApiError', 'setApiToken', 'getApiToken', 'getSessionDiagnostics']);
  return { ...api, logs };
}
function response(status, data = {}, contentType = 'application/json') {
  return { ok: status >= 200 && status < 300, status,
    headers: { get: () => contentType },
    text: async () => typeof data === 'string' ? data : JSON.stringify(data) };
}
function deferred() {
  let resolve, reject;
  const promise = new Promise((a, b) => { resolve = a; reject = b; });
  return { promise, resolve, reject };
}
const ok = async () => {};
function appStore(ApiError, auth, onboarding = ok, checkin = ok) {
  return load('src/store/app.store.js', {
    create, ApiError, console: { warn() {} },
    useAuthStore: { getState: () => auth },
    useOnboardingStore: { getState: () => ({ hydrate: onboarding }) },
    useCheckInStore: { getState: () => ({ hydrate: checkin }) },
  }, ['useAppStore']).useAppStore;
}
function authStore(api, overrides = {}) {
  const disk = new Map();
  const { useAuthStore } = load('src/features/auth/auth.store.js', {
    create, ...api, console: { log() {} },
    SECURE_STORAGE_KEYS: { ACCESS_TOKEN: 'token', SESSION_TYPE: 'type' },
    STORAGE_KEYS: { ACCOUNT_SNAPSHOT: 'account' },
    getSecureItem: async key => disk.get(key), getJSON: async key => disk.get(key),
    setSecureItem: async (key, value) => disk.set(key, value),
    setJSON: async (key, value) => disk.set(key, value),
    removeSecureItem: async key => disk.delete(key),
    removeStorageItem: async key => disk.delete(key),
    detachNotificationDevice: ok, readLocalProfile: async () => ({}),
    preserveGuestCheckInsForAccount: ok, buildAccountPatch: () => ({}),
    ...overrides,
  }, ['useAuthStore']);
  return { store: useAuthStore, disk };
}

test('a transient GET is retried once and returns the recovered response', async () => {
  let calls = 0;
  const api = client(async () => ++calls === 1 ? response(503) : response(200, { id: 'account' }));
  assert.equal((await api.apiRequest('/auth/me/', { retries: 1 })).id, 'account');
  assert.equal(calls, 2);
});
test('persistent network failure is bounded to two GET attempts', async () => {
  let calls = 0;
  const api = client(async () => { calls++; throw new TypeError('fetch failed'); });
  await assert.rejects(api.apiRequest('/auth/me/', { retries: 1 }), e => e.code === 'NETWORK');
  assert.equal(calls, 2);
});
test('POST is never automatically replayed, even with retries requested', async () => {
  let calls = 0;
  const api = client(async () => { calls++; throw new TypeError('connection lost'); });
  await assert.rejects(api.apiRequest('/auth/guest/', { method: 'POST', retries: 1 }));
  assert.equal(calls, 1);
});
test('401, 403 and 429 are not retried', async () => {
  for (const status of [401, 403, 429]) {
    let calls = 0;
    const api = client(async () => { calls++; return response(status); });
    await assert.rejects(api.apiRequest('/auth/me/', { retries: 1 }), e => e.status === status);
    assert.equal(calls, 1);
  }
});
test('timeout is distinguished from transport and JSON errors', async () => {
  const api = client((_url, options) => new Promise((_, reject) => {
    options.signal.addEventListener('abort', () => reject(Object.assign(new Error(), { name: 'AbortError' })));
  }));
  await assert.rejects(api.apiRequest('/auth/me/', { timeout: 5 }), e => e.code === 'TIMEOUT');
  const malformed = client(async () => response(200, '{invalid'));
  await assert.rejects(malformed.apiRequest('/auth/me/'), e => e.code === 'INVALID_RESPONSE');
});
test('malformed JSON on 503 preserves HTTP status and can recover', async () => {
  let calls = 0;
  const api = client(async () => ++calls === 1 ? response(503, '{broken') : response(200, { id: 1 }));
  assert.equal((await api.apiRequest('/auth/me/', { retries: 1 })).id, 1);
});
test('empty 204 responses are accepted', async () => {
  const api = client(async () => response(204, ''));
  assert.equal(await api.apiRequest('/anything/', { method: 'DELETE' }), null);
});
test('diagnostics do not log secrets, bodies or raw server messages', async () => {
  const api = client(async () => response(503, { detail: 'private-response' }));
  api.setApiToken('secret-token');
  await assert.rejects(api.apiRequest('/family/invite-links/invite-secret/?email=secret-email', {
    method: 'POST', body: { password: 'secret-password' },
  }));
  const log = JSON.stringify(api.logs);
  for (const secret of ['secret-token', 'invite-secret', 'secret-email', 'secret-password', 'private-response']) {
    assert.equal(log.includes(secret), false);
  }
});
test('concurrent bootstrap/retry waits for the same work, including local hydration', async () => {
  const api = client(); const local = deferred(); let calls = 0;
  const store = appStore(api.ApiError, { restoreSession: async () => {
    calls++; throw new api.ApiError('unavailable', 503);
  } }, () => local.promise);
  const first = store.getState().bootstrap();
  const second = store.getState().retryBootstrap();
  assert.equal(first, second);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(store.getState().isBootstrapping, true);
  assert.equal(store.getState().bootstrapError, null);
  local.resolve();
  assert.equal(await first, false);
  assert.equal(calls, 1);
  assert.equal(store.getState().localReady, true);
  assert.equal(store.getState().bootstrapError.diagnostic, 'SESSION-HTTP-503');
});
test('local failure cannot be misreported as a network error or permit recovery sign-in', async () => {
  const api = client();
  const store = appStore(api.ApiError, { restoreSession: ok }, async () => { throw new Error('disk'); });
  assert.equal(await store.getState().bootstrap(), false);
  assert.equal(store.getState().localReady, false);
  assert.equal(store.getState().bootstrapError.messageKey, 'onboarding.startupUnexpected');
});
test('retry after failure succeeds and clears the error', async () => {
  const api = client(); let calls = 0;
  const store = appStore(api.ApiError, { restoreSession: async () => {
    if (++calls === 1) throw new api.ApiError('network', 0, null, 'NETWORK');
  } });
  assert.equal(await store.getState().bootstrap(), false);
  assert.equal(await store.getState().retryBootstrap(), true);
  assert.equal(store.getState().bootstrapError, null);
  assert.equal(store.getState().isBootstrapping, false);
});
test('a session obtained by recovery sign-in is not replaced with a guest', async () => {
  const api = client();
  const store = appStore(api.ApiError, {
    isReady: true, token: 'valid', account: { id: 'real-user' },
    restoreSession: () => { throw new Error('must not run'); },
  });
  assert.equal(await store.getState().bootstrap(), true);
});
test('first launch creates and persists a genuine server guest session', async () => {
  const api = client(); let calls = 0;
  const { store, disk } = authStore(api, { createGuestSession: async () => {
    calls++; return { token: 'guest-token', account: { id: 'guest', settings_data: { guest: true } } };
  } });
  await store.getState().restoreSession();
  assert.equal(calls, 1);
  assert.equal(store.getState().isReady, true);
  assert.equal(store.getState().isGuest, true);
  assert.equal(disk.get('token'), 'guest-token');
});
test('malformed guest responses cannot authorize a user', async () => {
  for (const response of [null, {}, '<html>Error</html>', { token: '', account: { id: 1 } }]) {
    const api = client();
    const { store, disk } = authStore(api, { createGuestSession: async () => response });
    await assert.rejects(store.getState().createGuest(), e => e.code === 'INVALID_RESPONSE');
    assert.equal(store.getState().isReady, false);
    assert.equal(disk.has('token'), false);
  }
});
test('an HTTP 401 clears stale credentials and creates a real replacement guest', async () => {
  const api = client();
  const { store, disk } = authStore(api, {
    getCurrentAccount: async () => { throw new api.ApiError('expired', 401); },
    createGuestSession: async () => ({ token: 'new', account: { id: 'guest', settings_data: { guest: true } } }),
  });
  disk.set('token', 'old'); disk.set('type', 'account');
  await store.getState().restoreSession();
  assert.equal(disk.get('token'), 'new');
  assert.equal(store.getState().isGuest, true);
});
test('network outage retains saved credentials but does not fake successful authentication', async () => {
  const api = client();
  const { store, disk } = authStore(api, {
    getCurrentAccount: async () => { throw new api.ApiError('offline', 0, null, 'NETWORK'); },
  });
  disk.set('token', 'saved'); disk.set('type', 'account'); disk.set('account', { id: 'user' });
  await assert.rejects(store.getState().restoreSession());
  assert.equal(disk.get('token'), 'saved');
  assert.equal(store.getState().isReady, false);
});
test('failed push detachment does not block valid account authentication', async () => {
  const api = client();
  const { store } = authStore(api, { detachNotificationDevice: async () => { throw new Error('offline'); } });
  store.setState({ token: 'old', account: { id: 'guest' } });
  await store.getState().setSession({ token: 'new', account: { id: 'user', settings_data: { guest: false } } });
  assert.equal(store.getState().token, 'new');
  assert.equal(store.getState().isGuest, false);
});

test('actual guest API never sends a stored bearer', async () => {
  const api = client(async (_url, options) => {
    assert.equal(Object.keys(options.headers).some(k => k.toLowerCase() === 'authorization'), false);
    return response(200, { token: 'server-issued-token', account: { id: 'guest' } });
  });
  api.setApiToken('stale-bearer');
  const auth = load('src/features/auth/auth.api.js', { apiRequest: api.apiRequest }, ['createGuestSession']);
  await auth.createGuestSession();
  assert.equal(api.getApiToken(), 'stale-bearer'); // Do not clear real credentials globally.
  assert.equal(api.getSessionDiagnostics()[0].authorizationPresent, false);
  assert.equal(JSON.stringify(api.getSessionDiagnostics()).includes('server-issued-token'), false);
});
test('public requests remove explicit authorization in every casing', async () => {
  const api = client(async (_url, options) => {
    assert.equal(Object.keys(options.headers).some(k => k.toLowerCase() === 'authorization'), false);
    return response(204, '');
  });
  api.setApiToken('saved');
  await api.apiRequest('/auth/guest/', { method: 'POST', headers: { authorization: 'Bearer old', Authorization: 'Bearer other' } });
  await api.apiRequest('/auth/email/login/', { method: 'POST', auth: false, headers: { AUTHORIZATION: 'Bearer old' } });
});
test('a network failure retains available original error and correlation metadata', async () => {
  const api = client(async () => { throw Object.assign(new TypeError('Connection unexpectedly closed'), { code: -1200 }); });
  await assert.rejects(api.apiRequest('/auth/guest/', { method: 'POST', auth: false }), e => {
    assert.equal(e.diagnostic.originalError.message, 'Connection unexpectedly closed');
    assert.equal(e.diagnostic.originalError.nativeCodeIfExposed, '-1200');
    assert.equal(e.diagnostic.responseReceived, false);
    assert.equal(e.diagnostic.httpStatus, null);
    assert.equal(e.diagnostic.url, 'https://api.example.test/api/v1/auth/guest/');
    assert.equal(e.diagnostic.stage, 'fetch');
    assert.ok(e.diagnostic.startedAtUtc.endsWith('Z'));
    assert.ok(e.diagnostic.durationMs >= 0);
    return true;
  });
});
test('response-body read failure preserves received HTTP status', async () => {
  const api = client(async () => ({ ...response(502), text: async () => { throw new TypeError('Connection lost while reading'); } }));
  await assert.rejects(api.apiRequest('/auth/me/'), e => {
    assert.equal(e.status, 502);
    assert.equal(e.diagnostic.httpStatus, 502);
    assert.equal(e.diagnostic.responseReceived, true);
    assert.equal(e.diagnostic.stage, 'read-body');
    return true;
  });
});
test('HTTP previews redact token, email, cookies, query strings and account fields', async () => {
  const api = client(async () => response(401, {
    detail: 'Rejected Bearer stale-bearer for person@example.com token=abc cookie="hidden" https://server.test/error?token=hidden',
    token: 'private-token', account: { display_name: 'private-name' }, password: 'private-password',
  }));
  api.setApiToken('stale-bearer');
  await assert.rejects(api.apiRequest('/auth/me/'));
  const entry = api.getSessionDiagnostics()[0];
  assert.equal(entry.authorizationPresent, true);
  assert.equal(entry.httpStatus, 401);
  assert.equal(entry.errorBodyPreview.otherFieldsOmitted, true);
  const text = JSON.stringify(api.getSessionDiagnostics());
  for (const secret of ['stale-bearer','person@example.com','private-token','private-name','private-password','hidden','token=abc']) {
    assert.equal(text.includes(secret), false, secret);
  }
});
test('diagnostics retain both attempts, distinguish success and bound memory', async () => {
  let calls = 0;
  const api = client(async () => ++calls === 1 ? response(503) : response(200, { id: 'private-id' }));
  await api.apiRequest('/auth/me/', { retries: 1 });
  const first = api.getSessionDiagnostics();
  assert.equal(first[0].attempt, 1);
  assert.equal(first[0].code, 'HTTP');
  assert.equal(first[1].attempt, 2);
  assert.equal(first[1].code, 'OK');
  first[0].code = 'MUTATED';
  assert.equal(api.getSessionDiagnostics()[0].code, 'HTTP');
  for (let i = 0; i < 10; i++) await api.apiRequest('/auth/me/');
  assert.equal(api.getSessionDiagnostics().length, 8);
  assert.equal(JSON.stringify(api.getSessionDiagnostics()).includes('private-id'), false);
});
test('timeouts stay TIMEOUT even when fetch rejects with TypeError after abort', async () => {
  const api = client((_url, options) => new Promise((_, reject) => {
    options.signal.addEventListener('abort', () => reject(new TypeError('Network request failed')));
  }));
  await assert.rejects(api.apiRequest('/auth/guest/', { method: 'POST', auth: false, timeout: 5 }), e => {
    assert.equal(e.code, 'TIMEOUT');
    assert.equal(e.diagnostic.originalError.name, 'TypeError');
    return true;
  });
});
