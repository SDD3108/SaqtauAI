import { ApiError, apiRequest } from '@/src/services/api/client';

function normalizeNotification(item) {
  if (!item) return null;

  const rawData = item.data && typeof item.data === 'object' ? item.data : {};
  const kind = item.kind || item.type || rawData.type || rawData.kind || 'notification';

  return {
    ...item,
    id: String(item.id || ''),
    kind,
    title: item.title || 'SaqtauAI',
    body: item.body || item.message || item.text || '',
    data: rawData,
    read: Boolean(item.read ?? item.is_read),
    created_at: item.created_at || item.createdAt || null,
  };
}

function normalizeListResponse(data) {
  const source = Array.isArray(data)
    ? data
    : Array.isArray(data?.notifications)
      ? data.notifications
      : Array.isArray(data?.results)
        ? data.results
        : [];

  const notifications = source.map(normalizeNotification).filter(Boolean);
  const unreadCount = Number.isFinite(Number(data?.unread_count))
    ? Number(data.unread_count)
    : notifications.filter((item) => !item.read).length;

  return { notifications, unreadCount };
}

function routeUnavailable(error) {
  return error instanceof ApiError && [404, 405].includes(error.status);
}

async function requestWithFallback(primaryPath, fallbackPath, options) {
  try {
    return await apiRequest(primaryPath, options);
  } catch (error) {
    if (routeUnavailable(error)) {
      return apiRequest(fallbackPath, options);
    }
    throw error;
  }
}

export async function getNotifications() {
  const data = await requestWithFallback(
    '/notifications/',
    '/kids/notifications/',
  );
  return normalizeListResponse(data);
}

export async function markNotificationRead(notificationId) {
  const id = encodeURIComponent(String(notificationId));
  return requestWithFallback(
    `/notifications/${id}/read/`,
    `/kids/notifications/${id}/read/`,
    { method: 'POST', body: {} },
  );
}

export async function getNotificationPreferences() {
  try {
    return await apiRequest('/notifications/preferences/');
  } catch (error) {
    if (routeUnavailable(error)) return null;
    throw error;
  }
}

export async function updateNotificationPreferences(patch) {
  try {
    return await apiRequest('/notifications/preferences/', {
      method: 'PATCH',
      body: patch,
    });
  } catch (error) {
    if (routeUnavailable(error)) return null;
    throw error;
  }
}

function normalizeRegisterArgs(first, second, third) {
  // Compatibility with both historical signatures:
  // registerPushToken(expoToken, platform)
  // registerPushToken(authToken, expoToken, platform)
  if (third !== undefined) {
    return { expoToken: second, platform: third };
  }
  return { expoToken: first, platform: second };
}

export function registerPushToken(first, second, third) {
  const { expoToken, platform = 'ios' } = normalizeRegisterArgs(first, second, third);

  return requestWithFallback(
    '/notifications/push/register/',
    '/kids/push/register/',
    {
      method: 'POST',
      body: {
        expo_token: expoToken,
        platform,
      },
    },
  );
}

export function unregisterPushToken(first, second) {
  // Compatibility with unregisterPushToken(expoToken) and
  // unregisterPushToken(authToken, expoToken). The API client already holds
  // the active Bearer token, so the explicit authToken is not needed here.
  const expoToken = second !== undefined ? second : first;

  return requestWithFallback(
    '/notifications/push/unregister/',
    '/kids/push/unregister/',
    {
      method: 'POST',
      body: { expo_token: expoToken },
    },
  );
}
