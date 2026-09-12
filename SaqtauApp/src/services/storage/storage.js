import AsyncStorage from '@react-native-async-storage/async-storage';

export async function getString(key) {
  return AsyncStorage.getItem(key);
}

export async function setString(key, value) {
  return AsyncStorage.setItem(key, value);
}

export async function getJSON(key, fallback = null) {
  const value = await AsyncStorage.getItem(key);

  if (value === null) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export async function setJSON(key, value) {
  return AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function removeStorageItem(key) {
  return AsyncStorage.removeItem(key);
}

export async function removeStorageItems(keys) {
  return AsyncStorage.multiRemove(keys);
}