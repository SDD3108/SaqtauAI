import assert from 'node:assert/strict';
import test from 'node:test';

import { processingPercent, uploadPercent, processingCopy } from '../../src/features/check-in/utils/processingProgress.utils.js';
import { takeMeasurementPollSlot, POLL_INTERVAL_MS } from '../../src/features/check-in/services/measurementPolling.js';

test('upload percentage is clamped', () => {
  assert.equal(uploadPercent(0.48), 48);
  assert.equal(uploadPercent(-3), 0);
  assert.equal(uploadPercent(3), 100);
});

test('analysis percentage is never fabricated', () => {
  assert.equal(processingPercent({ status: 'processing' }), null);
  assert.equal(processingPercent({ status: 'processing', progress_percent: 42 }), 42);
  assert.equal(processingPercent({ status: 'processing', processing_progress: 0.35 }), 35);
  assert.equal(processingPercent({ status: 'processing', progress: { percent: 62 } }), 62);
  assert.equal(processingPercent({ status: 'processing', progress_percent: 900 }), 100);
  assert.equal(processingPercent({ status: 'processing', progress_percent: 'invalid' }), null);
  assert.equal(processingPercent({ status: 'completed' }), 100);
});

test('translation fallback', () => {
  assert.equal(processingCopy('ru-RU').upload, 'Загрузка видео');
  assert.equal(processingCopy('de').upload, 'Uploading video');
});

test('measurement polls are throttled to one request every 60 seconds per ID', () => {
  assert.equal(POLL_INTERVAL_MS, 60_000);
  const originalNow = Date.now;
  let now = 1_800_000_000_000;
  Date.now = () => now;
  try {
    const id = 'sample-progress-one-minute';
    assert.equal(takeMeasurementPollSlot(id), 0); // first request allowed
    assert.equal(takeMeasurementPollSlot(id), 60_000); // duplicate request prevented
    now += 10_000;
    assert.equal(takeMeasurementPollSlot(id), 50_000);
    now += 49_999;
    assert.equal(takeMeasurementPollSlot(id), 1);
    now += 1;
    assert.equal(takeMeasurementPollSlot(id), 0); // next request at 60s
    assert.equal(takeMeasurementPollSlot(id), 60_000);
    assert.equal(takeMeasurementPollSlot('another-measurement'), 0);
  } finally {
    Date.now = originalNow;
  }
});
