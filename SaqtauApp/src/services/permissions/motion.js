import { Accelerometer } from 'expo-sensors';

export async function getMotionPermission() {
  return Accelerometer.getPermissionsAsync();
}

export async function requestMotionPermission() {
  return Accelerometer.requestPermissionsAsync();
}

export async function hasMotionPermission() {
  const available = await Accelerometer.isAvailableAsync();

  if (!available) {
    return false;
  }

  const permission = await getMotionPermission();
  return permission.granted;
}

export async function isMotionAvailable() {
  return Accelerometer.isAvailableAsync();
}
