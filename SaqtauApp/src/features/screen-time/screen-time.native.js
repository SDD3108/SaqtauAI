import * as ExpoModulesCore from 'expo-modules-core';
import { Platform } from 'react-native';

function resolveNativeModule() {
  if (Platform.OS !== 'ios') return null;

  try {
    if (typeof ExpoModulesCore.requireOptionalNativeModule === 'function') {
      return ExpoModulesCore.requireOptionalNativeModule('SaqtauScreenTime');
    }
    return ExpoModulesCore.requireNativeModule('SaqtauScreenTime');
  } catch {
    return null;
  }
}

const NativeScreenTime = resolveNativeModule();

function unavailableStatus() {
  return {
    available: false,
    authorizationStatus: 'unavailable',
    authorizationMode: null,
    monitoring: false,
    activities: [],
    selection: {
      applications: 0,
      categories: 0,
      webDomains: 0,
      total: 0,
    },
    policy: null,
  };
}

function requireNative() {
  if (!NativeScreenTime) {
    const error = new Error(
      'Apple Screen Time native module is not installed in this build. Rebuild the iOS development app after adding the Part 12 config plugin.',
    );
    error.code = 'SCREEN_TIME_NATIVE_UNAVAILABLE';
    throw error;
  }
  return NativeScreenTime;
}

export async function getDeviceScreenTimeStatus() {
  if (!NativeScreenTime) return unavailableStatus();
  return NativeScreenTime.getStatus();
}

export async function requestDeviceScreenTimeAuthorization(mode = 'individual') {
  const native = requireNative();
  return native.requestAuthorization(mode === 'child' ? 'child' : 'individual');
}

export async function presentDeviceScreenTimePicker() {
  const native = requireNative();
  return native.presentPicker();
}

export async function configureDeviceScreenTimePolicy({
  dailyLimitMinutes,
  quietHours,
}) {
  const native = requireNative();
  return native.configurePolicy(
    Number(dailyLimitMinutes),
    Boolean(quietHours?.enabled),
    String(quietHours?.from || '22:00'),
    String(quietHours?.to || '07:00'),
  );
}

export async function clearDeviceScreenTimePolicy() {
  const native = requireNative();
  return native.clearPolicy();
}

export async function clearDeviceScreenTimeSelection() {
  const native = requireNative();
  return native.clearSelection();
}
