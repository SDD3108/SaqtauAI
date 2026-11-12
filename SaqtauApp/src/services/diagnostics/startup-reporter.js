import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';
import * as Device from 'expo-device';
import * as Network from 'expo-network';
import { Platform } from 'react-native';

// PUBLIC collector URL only. Never put a Telegram token in EXPO_PUBLIC_*.
const ENDPOINT = process.env.EXPO_PUBLIC_DIAGNOSTICS_URL || '';
const KEY = 'saqtau.startup-diagnostics.v1';
const MAX_AGE = 24 * 60 * 60 * 1000;
let serial = Promise.resolve();
let lastFingerprint = '';
let lastQueuedAt = 0;

function exclusively(task) {
  const result = serial.then(task);
  serial = result.catch(() => {});
  return result;
}
function enabled() {
  try {
    const url = new URL(ENDPOINT);
    return url.protocol === 'https:' && !url.username && !url.password && !url.search && !url.hash;
  } catch { return false; }
}
async function readQueue() {
  try {
    const entries = JSON.parse(await AsyncStorage.getItem(KEY) || '[]');
    return Array.isArray(entries) ? entries.filter(entry => entry?.report?.id &&
      Number.isFinite(entry.savedAt) && Date.now() - entry.savedAt < MAX_AGE &&
      entry.attempts < 6).slice(-5) : [];
  } catch { return []; }
}
async function networkSnapshot() {
  let timer;
  try {
    const state = await Promise.race([
      Network.getNetworkStateAsync(),
      new Promise(resolve => { timer = setTimeout(() => resolve(null), 1500); }),
    ]);
    return state ? {
      type: state.type,
      isConnected: state.isConnected ?? null,
      isInternetReachable: state.isInternetReachable ?? null,
    } : null;
  } catch { return null; }
  finally { clearTimeout(timer); }
}

export async function reportStartupFailure(supportCode, requests) {
  if (!enabled() || !String(supportCode).startsWith('SESSION-')) return;
  try {
    const snapshot = requests.slice(-8);
    const last = snapshot[snapshot.length - 1];
    const fingerprint = `${supportCode}|${last?.url}|${last?.method}`;
    if (lastFingerprint === fingerprint && Date.now() - lastQueuedAt < 60000) return;
    lastFingerprint = fingerprint;
    lastQueuedAt = Date.now();
    const report = {
      schema: 1,
      id: `startup-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`,
      createdAtUtc: new Date().toISOString(),
      supportCode,
      app: {
        version: Application.nativeApplicationVersion || 'unknown',
        build: Application.nativeBuildVersion || 'unknown',
        platform: Platform.OS,
        osVersion: String(Platform.Version),
        model: Device.modelName || 'unknown',
      },
      network: await networkSnapshot(),
      requests: snapshot,
    };
    await exclusively(async () => {
      const queue = await readQueue();
      queue.push({ report, savedAt: Date.now(), attempts: 0, nextAttempt: 0 });
      await AsyncStorage.setItem(KEY, JSON.stringify(queue.slice(-5)));
    });
    await flushStartupReports();
  } catch {
    // Reporting must never replace the original failure or block authentication.
  }
}

export function flushStartupReports() {
  if (!enabled()) return Promise.resolve();
  return exclusively(async () => {
    const queue = await readQueue();
    const index = queue.findIndex(item => item.nextAttempt <= Date.now());
    if (index < 0) {
      await AsyncStorage.setItem(KEY, JSON.stringify(queue));
      return;
    }
    const item = queue[index];
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    let delivered = false;
    let discard = false;
    let retryAfter = 0;
    try {
      // Deliberately bypass apiRequest: no bearer token, no recursive reporting.
      const response = await fetch(ENDPOINT, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.report), signal: controller.signal,
      });
      delivered = response.ok;
      discard = [400, 404, 413, 415, 422].includes(response.status);
      retryAfter = Number(response.headers.get('retry-after')) * 1000 || 0;
    } catch {
      // Keep the report for the next foreground/network opportunity.
    } finally { clearTimeout(timer); }
    if (delivered || discard) queue.splice(index, 1);
    else {
      item.attempts += 1;
      item.nextAttempt = Date.now() + Math.min(3600000,
        Math.max(retryAfter, 60000 * 2 ** (item.attempts - 1)));
      if (item.attempts >= 6) queue.splice(index, 1);
    }
    await AsyncStorage.setItem(KEY, JSON.stringify(queue));
  }).catch(() => {});
}
