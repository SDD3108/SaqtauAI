import { Camera } from 'expo-camera';

export async function getCameraPermission() {
  return Camera.getCameraPermissionsAsync();
}

export async function requestCameraPermission() {
  return Camera.requestCameraPermissionsAsync();
}

export async function hasCameraPermission() {
  const permission = await getCameraPermission();
  return permission.granted;
}
