import { apiRequest } from '@/src/services/api/client';

export function createGuestSession() {
  return apiRequest('/auth/guest/', {
    method: 'POST',
    auth: false,
  });
}

export function getCurrentAccount() {
  return apiRequest('/auth/me/');
}

export function updateCurrentAccount(body) {
  return apiRequest('/auth/me/', {
    method: 'PATCH',
    body,
  });
}

export function loginWithEmail(email, password) {
  return apiRequest('/auth/email/login/', {
    method: 'POST',
    auth: false,
    body: {
      email,
      password,
    },
  });
}

export function registerWithEmail(email, password) {
  return apiRequest('/auth/email/register/', {
    method: 'POST',
    auth: false,
    body: {
      email,
      password,
    },
  });
}

export function upgradeGuestWithEmail(email, password, displayName) {
  return apiRequest('/auth/guest/upgrade/', {
    method: 'POST',
    body: {
      email,
      password,
      display_name: displayName,
    },
  });
}

export function requestPasswordReset(email) {
  return apiRequest('/auth/password/reset/request/', {
    method: 'POST',
    auth: false,
    body: { email },
  });
}

export function confirmPasswordReset(token, newPassword) {
  return apiRequest('/auth/password/reset/confirm/', {
    method: 'POST',
    auth: false,
    body: {
      token,
      new_password: newPassword,
    },
  });
}
