import { API_TIMEOUT, API_URL } from '@/src/constants/config';

let accessToken = null;

export class ApiError extends Error {
  constructor(message, status = 0, data = null, code = 'HTTP') {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.code = code;
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

async function requestOnce(
  path,
  { method = 'GET', body, headers = {}, auth = true, timeout = API_TIMEOUT } = {},
) {
  const safePath = path.replace(/(\/family\/invite-links\/)[^/]+/, '$1[redacted]');
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
    const text = await response.text();
    let data = text || null;
    if (text && contentType.includes('application/json')) {
      try {
        data = JSON.parse(text);
      } catch {
        // Preserve an HTTP failure even when a proxy returns malformed JSON.
        throw new ApiError(
          'Invalid server response', response.status, null,
          response.ok ? 'INVALID_RESPONSE' : 'HTTP',
        );
      }
    }

    if (!response.ok) {
      throw new ApiError(getErrorMessage(data, response.status), response.status, data);
    }

    return data;
  } catch (error) {
    const failure = error instanceof ApiError
      ? error
      : new ApiError(
          error?.name === 'AbortError' ? 'Request timed out' : 'Network request failed',
          0,
          null,
          error?.name === 'AbortError' ? 'TIMEOUT' : 'NETWORK',
        );
    // No headers, bodies, personal data, tokens, or server error text in logs.
    console.warn('[API ERROR]', {
      method,
      path: safePath.split('?')[0].replace(
        /(\/auth\/password\/reset\/)[^/]+/, '$1[redacted]',
      ),
      code: failure.code,
      status: failure.status,
    });
    throw failure;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Retries are opt-in, bounded, and restricted to safe reads. Never replay POSTs.
export async function apiRequest(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const retries = ['GET', 'HEAD'].includes(method) && options.retries === 1 ? 1 : 0;
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await requestOnce(path, { ...options, method });
    } catch (error) {
      const transient = error instanceof ApiError && (
        ['NETWORK', 'TIMEOUT'].includes(error.code) ||
        [502, 503, 504].includes(error.status)
      );
      if (attempt >= retries || !transient) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}
