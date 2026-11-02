import { apiRequest } from '@/src/services/api/client';

const path = '/kids/guardianships/';

export async function listGuardianships() {
  const result = await apiRequest(path);
  if (!Array.isArray(result?.links)) throw new Error('Invalid guardianship list');
  return result.links;
}

export function requestGuardianship(childId) {
  return apiRequest(path, { method: 'POST', body: { child_id: childId, role: 'guardian' } });
}

export function answerGuardianship(link, decision) {
  if (!link?.id || link.direction !== 'as_child' || link.status !== 'pending'
      || link.role !== 'guardian' || !['accept', 'decline'].includes(decision)) {
    throw new Error('Invalid guardianship response');
  }
  return apiRequest(path + encodeURIComponent(link.id) + '/' + decision + '/', { method: 'POST', body: {} });
}
