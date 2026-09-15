import { Camera } from 'expo-camera';

export async function getMicrophonePermission() {
  return Camera.getMicrophonePermissionsAsync();
}

export async function requestMicrophonePermission() {
  return Camera.requestMicrophonePermissionsAsync();
}

export async function hasMicrophonePermission() {
  const permission = await getMicrophonePermission();
  return permission.granted;
}
