import { apiRequest } from '@/src/services/api/client';

export function logoutCurrentSession() {
  return apiRequest('/auth/logout/', {
    method: 'POST',
    body: {},
  });
}

export function changePassword(currentPassword, newPassword) {
  return apiRequest('/auth/password/change/', {
    method: 'POST',
    body: {
      current_password: currentPassword,
      new_password: newPassword,
    },
  });
}

export function exportAccountData() {
  return apiRequest('/auth/export-data/', {
    method: 'POST',
    body: {},
  });
}

export function deleteAccountData() {
  return apiRequest('/auth/me/data/', {
    method: 'DELETE',
    body: {
      confirmation: 'DELETE_DATA',
    },
  });
}

export function deleteAccount(password) {
  return apiRequest('/auth/account/', {
    method: 'DELETE',
    body: {
      confirmation: 'DELETE',
      password,
    },
  });
}
