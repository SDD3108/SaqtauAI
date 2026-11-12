import { useEffect } from 'react';
import { AppState } from 'react-native';
import * as Network from 'expo-network';
import { flushStartupReports } from '@/src/services/diagnostics/startup-reporter';

export default function StartupReporterRuntime() {
  useEffect(() => {
    const flush = () => { void flushStartupReports(); };
    flush();
    const app = AppState.addEventListener('change', state => {
      if (state === 'active') flush();
    });
    const network = Network.addNetworkStateListener(state => {
      if (state.isConnected && state.isInternetReachable !== false) flush();
    });
    const timer = setInterval(() => {
      if (AppState.currentState === 'active') flush();
    }, 60000);
    return () => { app.remove(); network.remove(); clearInterval(timer); };
  }, []);
  return null;
}
