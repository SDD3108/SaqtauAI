import { API_TIMEOUT, API_URL, FETCH_CONFIGURATION, NETWORK_REVISION } from '@/src/constants/config';

let accessToken = null;
const sessionDiagnostics = [];
let requestSequence = 0;

// Diagnostic correlation only; never an authentication/idempotency credential.
function newRequestId() {
  requestSequence += 1;
  return `saqtau-${Date.now().toString(36)}-${requestSequence.toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
function safeRequestId(value) {
  return typeof value === 'string' && /^[a-zA-Z0-9-]{8,80}$/.test(value) ? value : null;
}

// Only startup session requests are retained, in memory, until app termination.
export function getSessionDiagnostics() {
  return JSON.parse(JSON.stringify(sessionDiagnostics));
}

function safeUrl(value) {
  return String(value || '').split(/[?#]/)[0]
    .replace(/(https?:\/\/)[^/@]+@/gi, '$1[redacted]@')
    .replace(/(\/family\/invite-links\/)[^/]+/g, '$1[redacted]')
    .replace(/(\/auth\/password\/reset\/)(?!request\/|confirm\/)[^/]+/g, '$1[redacted]');
}

function redactText(value, secrets = []) {
  let text = String(value ?? '');
  for (const secret of secrets) {
    if (secret) text = text.split(String(secret)).join('[redacted]');
  }
  return text
    .replace(/https?:\/\/[^\s"'<>]+/gi, safeUrl)
    .replace(/\bBearer\s+[^\s"',;]+/gi, 'Bearer [redacted]')
    .replace(/(["']?(?:password|token|secret|authorization|cookie)["']?\s*[:=]\s*)("[^"]*"|'[^']*'|[^\s,;}]+)/gi, '$1[redacted]')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email]')
    .replace(/\b[A-Za-z0-9_=-]{32,}(?:\.[A-Za-z0-9_=-]+)*\b/g, '[redacted]')
    .slice(0, 1200);
}

function errorSummary(error, secrets) {
  if (!error) return null;
  return {
    name: redactText(error.name || typeof error, secrets),
    message: redactText(error.message || String(error), secrets),
    stack: error.stack ? redactText(error.stack, secrets) : null,
    nativeCodeIfExposed: error.code == null ? null : redactText(error.code, secrets),
    cause: error.cause ? {
      name: redactText(error.cause.name || '', secrets),
      message: redactText(error.cause.message || String(error.cause), secrets),
      code: error.cause.code == null ? null : redactText(error.cause.code, secrets),
    } : null,
  };
}

function errorBodyPreview(text, secrets) {
  if (!text) return null;
  // Never export an HTML debug page, a full account, or a successful token response.
  try {
    const data = JSON.parse(text);
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return '[Non-object response omitted]';
    }
    const preview = {};
    for (const key of Object.keys(data).slice(0, 20)) {
      if (['detail', 'message', 'code', 'error', 'non_field_errors'].includes(key)) {
        const value = data[key];
        preview[key] = typeof value === 'string' || typeof value === 'number'
          ? redactText(value, secrets)
          : Array.isArray(value)
            ? value.slice(0, 5).map(item => typeof item === 'string'
              ? redactText(item, secrets) : '[omitted]')
            : '[omitted]';
      } else {
        preview.otherFieldsOmitted = true;
      }
    }
    return preview;
  } catch {
    return '[Non-JSON body omitted; inspect server logs]';
  }
}

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
  { method = 'GET', body, headers = {}, auth = true, timeout = API_TIMEOUT, attempt = 1, diagnosticProbe = false } = {},
) {
  const startedAt = Date.now();
  const trackSession = (method === 'POST' && path === '/auth/guest/') ||
    (method === 'GET' && path === '/auth/me/') ||
    (diagnosticProbe && method === 'GET' && ['/health/', '/ready/'].includes(path));
  const requestId = trackSession ? newRequestId() : null;
  let response = null;
  let responseText = null;
  let stage = 'prepare';
  let timedOut = false;
  const safePath = path.replace(/(\/family\/invite-links\/)[^/]+/, '$1[redacted]');
  const controller = new AbortController();
  // Abort alone is insufficient if a native fetch/body promise never settles.
  // The same deadline covers both headers and body; late completions are ignored.
  let timeoutId;
  const deadline = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      timedOut = true;
      reject(new ApiError('Request timed out', response?.status || 0, null, 'TIMEOUT'));
      controller.abort();
    }, timeout);
  });
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  const requestHeaders = {
    Accept: 'application/json',
    ...headers,
  };

  if (requestId) requestHeaders['X-Client-Request-ID'] = requestId;

  if (!isFormData && body !== undefined) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  // Explicit Authorization headers must also be removed for public endpoints.
  const publicRequest = !auth || path.split('?')[0] === '/auth/guest/';
  if (publicRequest) {
    for (const key of Object.keys(requestHeaders)) {
      if (key.toLowerCase() === 'authorization') delete requestHeaders[key];
    }
  } else if (accessToken) {
    requestHeaders.Authorization = `Bearer ${accessToken}`;
  }

  const authHeader = Object.entries(requestHeaders)
    .find(([key]) => key.toLowerCase() === 'authorization')?.[1];
  const secrets = [accessToken, authHeader];
  const recordSession = (failure, originalError) => {
    if (!trackSession) return;
    const diagnostic = {
      schema: 1,
      requestId,
      serverRequestId: safeRequestId(response?.headers.get('x-request-id')),
      networkRevision: NETWORK_REVISION,
      fetchConfiguration: FETCH_CONFIGURATION,
      startedAtUtc: new Date(startedAt).toISOString(),
      endedAtUtc: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      url: safeUrl(`${API_URL}${path}`),
      method, attempt, stage, timeoutMs: timeout,
      authorizationPresent: Boolean(authHeader),
      responseReceived: Boolean(response),
      httpStatus: response?.status ?? null,
      finalUrl: response?.url ? safeUrl(response.url) : null,
      redirected: response?.redirected ?? null,
      contentType: response?.headers.get('content-type') || null,
      code: failure?.code || 'OK',
      timeoutSource: timedOut ? 'client-deadline' : null,
      originalError: errorSummary(originalError, secrets),
      errorBodyPreview: response && !response.ok
        ? errorBodyPreview(responseText, secrets) : null,
    };
    sessionDiagnostics.push(diagnostic);
    if (sessionDiagnostics.length > 8) sessionDiagnostics.shift();
    if (failure) {
      failure.diagnostic = diagnostic;
      console.warn('[SESSION DIAGNOSTIC]', JSON.stringify(diagnostic));
    }
  };

  try {
    const requestBody = body === undefined || isFormData || typeof body === 'string'
      ? body : JSON.stringify(body);
    stage = 'fetch';
    response = await Promise.race([deadline, fetch(`${API_URL}${path}`, {
      method,
      headers: requestHeaders,
      body: requestBody,
      signal: controller.signal,
    })]);

    const contentType = response.headers.get('content-type') || '';
    stage = 'read-body';
    const text = await Promise.race([deadline, response.text()]);
    responseText = text;
    stage = 'parse-response';
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

    stage = 'complete';
    recordSession(null, null);
    return data;
  } catch (error) {
    const failure = error instanceof ApiError
      ? error
      : new ApiError(
          timedOut || error?.name === 'AbortError' ? 'Request timed out' : 'Network request failed',
          response?.status || 0,
          null,
          timedOut || error?.name === 'AbortError' ? 'TIMEOUT' : 'NETWORK',
        );
    recordSession(failure, error);
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
      return await requestOnce(path, { ...options, method, attempt: attempt + 1 });
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


let connectivityProbe = null;
// Read-only probes run AFTER a failure, never as a prerequisite to sign-in.
export function probeStartupConnectivity() {
  if (connectivityProbe) return connectivityProbe;
  connectivityProbe = Promise.all(['/health/', '/ready/'].map(async path => {
    try {
      await apiRequest(path, { auth: false, timeout: 5000, diagnosticProbe: true });
    } catch {
      // 404 on an older backend is useful evidence, not a new startup failure.
    }
  })).finally(() => { connectivityProbe = null; });
  return connectivityProbe;
}
