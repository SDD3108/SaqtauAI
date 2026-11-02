import { ApiError, apiRequest } from '@/src/services/api/client';

const FALLBACK_STATUSES = new Set([404, 405]);

function encode(value) {
  return encodeURIComponent(String(value || ''));
}

export function isRouteUnavailable(error) {
  return error instanceof ApiError && FALLBACK_STATUSES.has(error.status);
}

export function getFamily() {
  return apiRequest('/family/');
}

export async function getFamilyMember(accountId) {
  try {
    return await apiRequest(`/family/${encode(accountId)}/`);
  } catch (error) {
    if (!isRouteUnavailable(error)) {
      throw error;
    }

    const family = await getFamily();
    const member = (family?.members || []).find(
      (item) => String(item?.account_id ?? item?.id) === String(accountId),
    );

    if (member) {
      return member;
    }

    throw error;
  }
}

export function removeFamilyMember(accountId) {
  return apiRequest(`/family/${encode(accountId)}/`, {
    method: 'DELETE',
  });
}

export function createInviteLink() {
  return apiRequest('/family/invite-links/', { method: 'POST', body: { expires_in_hours: 24 } });
}

export function setFamilySharing(id, enabled) {
  return apiRequest(`/family/${encode(id)}/sharing/`, { method: 'PATCH', body: { share_my_results: enabled } });
}

export function leaveFamily() {
  return apiRequest('/family/leave/', { method: 'POST', body: {} });
}

export function inspectInviteLink(token) {
  return apiRequest(`/family/invite-links/${encode(token)}/`, {
    auth: false,
  });
}

export function acceptInviteLink(token) {
  return apiRequest(`/family/invite-links/${encode(token)}/accept/`, {
    method: 'POST',
    body: {},
  });
}

export function searchFamilyAccounts(query) {
  const normalized = String(query || '').trim();
  return apiRequest(`/family/search/?q=${encode(normalized)}`);
}

export function createDirectInvite(accountId) {
  return apiRequest('/family/invites/', {
    method: 'POST',
    body: {
      account_id: accountId,
    },
  });
}

export async function getPendingInvites() {
  try {
    return await apiRequest('/family/invites/');
  } catch (error) {
    if (isRouteUnavailable(error)) {
      return { invites: [], unavailable: true };
    }
    throw error;
  }
}

export function respondToPendingInvite(inviteId, action) {
  if (!['accept', 'decline'].includes(action)) {
    throw new Error(`Unsupported family invite action: ${action}`);
  }

  return apiRequest(`/family/invites/${encode(inviteId)}/${action}/`, {
    method: 'POST',
    body: {},
  });
}
