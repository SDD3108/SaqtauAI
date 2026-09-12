import { API_TIMEOUT, API_URL } from '@/constants/config';

let accessToken = null;

export class ApiError extends Error {
  constructor(message, status = 0, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export function setApiToken(token) {
  accessToken = token || null;
}

export function getApiToken() {
  return accessToken;
}

function getErrorMessage(data, status) {
  if (typeof data === 'string' && data.trim()) {
    return data;
  }

  if (data?.detail) {
    return data.detail;
  }

  if (data?.message) {
    return data.message;
  }

  return `Request failed with status ${status}`;
}

export async function apiRequest(
  path,
  { method = 'GET', body, headers = {}, auth = true, timeout = API_TIMEOUT } = {},
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  const requestHeaders = {
    Accept: 'application/json',
    ...headers,
  };

  if (!isFormData && body !== undefined) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  if (auth && accessToken) {
    requestHeaders.Authorization = `Bearer ${accessToken}`;
  }

  try {
    const response = await fetch(`${API_URL}${path}`, {
      method,
      headers: requestHeaders,
      body:
        body === undefined || isFormData || typeof body === 'string'
          ? body
          : JSON.stringify(body),
      signal: controller.signal,
    });

    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json')
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      throw new ApiError(getErrorMessage(data, response.status), response.status, data);
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error?.name === 'AbortError') {
      throw new ApiError('Request timed out');
    }

    throw new ApiError('Network request failed');
  } finally {
    clearTimeout(timeoutId);
  }
}
