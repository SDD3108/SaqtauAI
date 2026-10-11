// One measurement-status request per minute at most, including AppState and push callbacks.
// No timer runs in the background; the server sends remote push on completion.
export const POLL_INTERVAL_MS = 60_000;
const lastChecked = new Map();

export function takeMeasurementPollSlot(id) {
  if (!id) return POLL_INTERVAL_MS;
  const key = String(id);
  const now = Date.now();
  const last = lastChecked.get(key);
  const delay = last === undefined ? 0 : Math.max(0, POLL_INTERVAL_MS - (now - last));
  if (delay === 0) {
    lastChecked.delete(key);
    lastChecked.set(key, now);
    // Prevent unbounded growth when many measurements are taken.
    if (lastChecked.size > 80) lastChecked.delete(lastChecked.keys().next().value);
  }
  return delay;
}
