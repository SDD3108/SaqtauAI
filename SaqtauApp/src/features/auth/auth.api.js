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