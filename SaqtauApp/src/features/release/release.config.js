import Constants from 'expo-constants';

// These values are embedded into the client bundle. They must never contain secrets.
const apiUrl = process.env.EXPO_PUBLIC_API_URL || '';
const inviteBaseUrl = process.env.EXPO_PUBLIC_INVITE_BASE_URL || '';
const privacyPolicyUrl = process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL || '';
const supportUrl = process.env.EXPO_PUBLIC_SUPPORT_URL || '';

export function safeHttpsUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    if (/^(localhost|127\.0\.0\.1|0\.0\.0\.0)$/i.test(url.hostname)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export const RELEASE_LINKS = Object.freeze({
  privacyPolicy: safeHttpsUrl(privacyPolicyUrl),
  support: safeHttpsUrl(supportUrl),
  inviteBase: safeHttpsUrl(inviteBaseUrl),
});

export const RELEASE_DETAILS = Object.freeze({
  name: 'SaqtauAI',
  version: Constants.nativeAppVersion || Constants.expoConfig?.version || '—',
  buildNumber: Constants.nativeBuildVersion || Constants.expoConfig?.ios?.buildNumber || '—',
  environment: __DEV__ ? 'development' : 'production',
});

export function getReleaseConfiguration() {
  return {
    apiConfigured: Boolean(safeHttpsUrl(apiUrl)),
    privacyConfigured: Boolean(RELEASE_LINKS.privacyPolicy),
    supportConfigured: Boolean(RELEASE_LINKS.support),
    invitationConfigured: Boolean(RELEASE_LINKS.inviteBase),
  };
}
