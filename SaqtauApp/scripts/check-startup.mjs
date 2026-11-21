#!/usr/bin/env node
// Node 20+: no tokens, bodies or account details are printed.
// --create-guest intentionally creates ONE test account, then verifies auth/me.
import { randomUUID } from 'node:crypto';
const raw = process.env.EXPO_PUBLIC_API_URL;
if (!raw) throw new Error('Set EXPO_PUBLIC_API_URL to the production API URL');
const base = new URL(raw.replace(/\/+$/, '') + '/');
if (base.protocol !== 'https:' || base.username || base.password || base.search || base.hash) {
  throw new Error('Use an HTTPS API URL without credentials, query or fragment');
}
let failures = 0;
async function request(path, { method = 'GET', body, token, expected = 200 } = {}) {
  const id = `saqtau-${randomUUID()}`;
  const started = Date.now();
  const headers = { Accept: 'application/json', 'X-Client-Request-ID': id };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  try {
    const res = await fetch(new URL(path, base), {
      method, headers, body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(20000), redirect: 'error',
    });
    const data = await res.json();
    const passed = res.status === expected;
    if (!passed) failures++;
    console.log(JSON.stringify({ path, method, status: res.status, passed,
      durationMs: Date.now() - started, requestId: id,
      serverRequestId: /^[a-f0-9]{32}$/.test(res.headers.get('x-request-id') || '')
        ? res.headers.get('x-request-id') : null }));
    return passed ? data : null;
  } catch (error) {
    failures++;
    console.log(JSON.stringify({ path, method, passed: false, requestId: id,
      durationMs: Date.now() - started, error: error.name }));
    return null;
  }
}
await request('health/');
await request('ready/');
await request('auth/me/', { expected: 401 });
if (process.argv.includes('--create-guest')) {
  const guest = await request('auth/guest/', { method: 'POST', body: {}, expected: 201 });
  if (typeof guest?.token === 'string' && guest?.account?.id) {
    const account = await request('auth/me/', { token: guest.token });
    if (!account || account.id !== guest.account.id) {
      console.log('FAIL guest token did not resolve to the same account');
      failures++;
    }
  } else {
    console.log('FAIL invalid guest session response');
    failures++;
  }
}
console.log(failures ? `FAIL: ${failures} check(s)` : 'PASS');
process.exitCode = failures ? 1 : 0;
