import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import AppErrorBoundary from '@/src/components/error-boundary/AppErrorBoundary';
import NetworkGate from '@/src/features/connectivity/components/NetworkGate';
import { useLocalizationStore } from '@/src/features/localization/localization.store';
import NotificationRuntime from '@/src/features/notifications/components/NotificationRuntime';
import '@/global.css';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });
  const languageReady = useLocalizationStore((state) => state.ready);
  const initializeLanguage = useLocalizationStore((state) => state.initialize);

  useEffect(() => {
    initializeLanguage().catch(() => {});
  }, [initializeLanguage]);

  useEffect(() => {
    if ((fontsLoaded || fontError) && languageReady) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, languageReady]);

  if ((!fontsLoaded && !fontError) || !languageReady) return null;

  return (
    <AppErrorBoundary>
      <NetworkGate>
        <StatusBar style="dark" />
        <NotificationRuntime />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#ECECEC' },
          }}
        />
      </NetworkGate>
    </AppErrorBoundary>
  );
}
