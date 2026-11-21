export const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'https://185-129-48-150.sslip.io/api/v1').replace(/\/$/, '');
export const API_TIMEOUT = 20000;
export const NETWORK_REVISION = 'v1.3.11-startup-r1';
// This records the requested Expo setting, not a runtime transport assertion.
export const FETCH_CONFIGURATION = ['1', 'true'].includes(process.env.EXPO_PUBLIC_USE_RN_FETCH)
  ? 'react-native-requested' : 'expo-default';
