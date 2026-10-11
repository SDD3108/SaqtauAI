import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createPushRegistrationGate,
  PUSH_REGISTRATION_RETRY_COOLDOWN_MS,
} from '../../src/services/notifications/pushRegistrationGate.js';

test('simultaneous automatic attempts issue only one registration', async () => {
  const gate = createPushRegistrationGate();
  let calls = 0;
  let release;
  const task = () => {
    calls += 1;
    return new Promise((resolve) => { release = resolve; });
  };
  const first = gate.run('session-a', task);
  const second = gate.run('session-a', task);
  assert.equal(first, second);
  await Promise.resolve();
  assert.equal(calls, 1);
  release({ ok: true, token: 'expo-test-token' });
  await Promise.all([first, second]);
  const cached = await gate.run('session-a', task);
  assert.equal(cached.status, 'already_registered');
  assert.equal(calls, 1);
});

test('a failed backend request cannot be retried automatically each second', async () => {
  let now = 1_700_000_000_000;
  const gate = createPushRegistrationGate({ now: () => now });
  let calls = 0;
  const task = async () => {
    calls += 1;
    return { ok: false, status: 'backend_registration_failed' };
  };
  assert.equal((await gate.run('session-a', task)).status, 'backend_registration_failed');
  for (let i = 0; i < 100; i += 1) {
    now += 1_000;
    assert.equal((await gate.run('session-a', task)).status, 'retry_later');
  }
  assert.equal(calls, 1);
  now += PUSH_REGISTRATION_RETRY_COOLDOWN_MS;
  assert.equal((await gate.run('session-a', task)).status, 'backend_registration_failed');
  assert.equal(calls, 2);
});

test('explicit retry bypasses cooldown, account change re-registers', async () => {
  const gate = createPushRegistrationGate();
  let calls = 0;
  const task = async () => {
    calls += 1;
    if (calls === 1) return { ok: false, status: 'backend_registration_failed' };
    return { ok: true, token: 'expo-test-token' };
  };
  await gate.run('session-a', task);
  assert.equal((await gate.run('session-a', task, { force: true })).ok, true);
  assert.equal((await gate.run('session-a', task)).status, 'already_registered');
  assert.equal((await gate.run('session-b', task)).ok, true);
  assert.equal(calls, 3);
});

test('reset clears cached registrations on logout', async () => {
  const gate = createPushRegistrationGate();
  let calls = 0;
  const task = async () => {
    calls += 1;
    return { ok: true, token: 'expo-test-token' };
  };
  await gate.run('session-a', task);
  gate.reset();
  await gate.run('session-a', task);
  assert.equal(calls, 2);
});
