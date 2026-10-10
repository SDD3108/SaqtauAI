import { apiRequest } from '@/src/services/api/client';

const ACTIVITY_RANGES = new Set(['today', '7d', '30d', 'all']);

function encode(value) {
  return encodeURIComponent(String(value || ''));
}

export function getFamilyPermissions(accountId) {
  return apiRequest(`/family/${encode(accountId)}/permissions/`);
}

export function updateFamilyPermissions(accountId, patch) {
  return apiRequest(`/family/${encode(accountId)}/permissions/`, {
    method: 'PATCH',
    body: patch,
  });
}

export function getFamilyScreenTime(accountId) {
  return apiRequest(`/family/${encode(accountId)}/screen-time/`);
}

export function updateFamilyScreenTime(accountId, patch) {
  return apiRequest(`/family/${encode(accountId)}/screen-time/`, {
    method: 'PATCH',
    body: patch,
  });
}

export function getFamilyPrivacy(accountId) {
  return apiRequest(`/family/${encode(accountId)}/privacy/`);
}

export function updateFamilyPrivacy(accountId, patch) {
  return apiRequest(`/family/${encode(accountId)}/privacy/`, {
    method: 'PATCH',
    body: patch,
  });
}

export function getFamilyActivity(accountId, range = '7d') {
  const safeRange = ACTIVITY_RANGES.has(range) ? range : '7d';
  return apiRequest(
    `/family/${encode(accountId)}/activity/?range=${encodeURIComponent(safeRange)}`,
  );
}

export function createFamilyActivity(accountId, event) {
  return apiRequest(`/family/${encode(accountId)}/activity/`, {
    method: 'POST',
    body: event,
  });
}

export function deleteFamilyMemberData(accountId) {
  return apiRequest(`/family/${encode(accountId)}/data/`, {
    method: 'DELETE',
    body: {
      confirmation: 'DELETE_DATA',
    },
  });
}
