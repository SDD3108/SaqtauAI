import * as SecureStore from 'expo-secure-store';

export async function getSecureItem(key) {
  return SecureStore.getItemAsync(key);
}

export async function setSecureItem(key, value) {
  return SecureStore.setItemAsync(key, value, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function removeSecureItem(key) {
  return SecureStore.deleteItemAsync(key);
}