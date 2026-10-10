import * as Network from 'expo-network';
import { useCallback, useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import OfflineScreen from '@/src/features/connectivity/components/OfflineScreen';
import { useNetworkStore } from '@/src/features/connectivity/network.store';
import useI18n from '@/src/features/localization/hooks/useI18n';

export default function NetworkGate({ children }) {
  const checked = useNetworkStore((state) => state.checked);
  const checking = useNetworkStore((state) => state.checking);
  const offline = useNetworkStore((state) => state.offline);
  const message = useNetworkStore((state) => state.message);
  const apply = useNetworkStore((state) => state.apply);
  const check = useNetworkStore((state) => state.check);
  const setMessage = useNetworkStore((state) => state.setMessage);
  const { t } = useI18n();

  useEffect(() => {
    check();
    const subscription = Network.addNetworkStateListener(apply);
    return () => subscription.remove();
  }, [apply, check]);

  const retry = useCallback(async () => {
    const state = await check();
    if (state?.isConnected === false || state?.isInternetReachable === false) {
      setMessage(t('offline.stillOffline'));
    }
  }, [check, setMessage, t]);

  if (!checked) {
    return (
      <View
        accessibilityLiveRegion="polite"
        className="flex-1 items-center justify-center bg-[#ECECEC]"
      >
        <ActivityIndicator color="#181027" />
        <Text className="mt-3 font-inter-medium text-[13px] text-[#807B89]">
          {t('offline.checking')}
        </Text>
      </View>
    );
  }

  if (offline) {
    return <OfflineScreen checking={checking} message={message} onRetry={retry} />;
  }

  return children;
}
