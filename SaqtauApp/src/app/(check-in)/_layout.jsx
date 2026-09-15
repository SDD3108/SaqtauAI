import { Stack } from 'expo-router';

export default function CheckInLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        gestureEnabled: true,
      }}
    />
  );
}
