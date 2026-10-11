import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, Text, View } from 'react-native';
import { BellRing, ChevronRight, Check } from 'lucide-react-native';
import { router } from 'expo-router';

import useI18n from '@/src/features/localization/hooks/useI18n';
import { useAuthStore } from '@/src/features/auth/auth.store';
import { processingCopy } from '@/src/features/check-in/utils/processingProgress.utils';
import { getLocalNotificationPreferences, saveLocalNotificationPreferences } from '@/src/features/notifications/notification-preferences.storage';
import { updateNotificationPreferences } from '@/src/features/notifications/notifications.api';
import {
  getPushPermissionStatus,
  isPushRegisteredOnThisDevice,
  openNotificationSettings,
  registerForPushNotifications,
} from '@/src/services/notifications/push';

export default function ReadyNotificationCard() {
  const { language } = useI18n();
  const copy = processingCopy(language);
  const isGuest = useAuthStore((state) => state.isGuest);
  const token = useAuthStore((state) => state.token);
  const [state, setState] = useState('loading');
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    try {
      const permission = await getPushPermissionStatus();
      if (permission.status === 'native_build_required') {
        setState('unavailable');
      } else if (permission.status === 'denied' && !permission.canAskAgain) {
        setState('denied');
      } else if (permission.granted && await isPushRegisteredOnThisDevice() &&
          (await getLocalNotificationPreferences()).report_ready) {
        setState('enabled');
      } else {
        setState('disabled');
      }
    } catch {
      setState('disabled');
    }
  }, []);

  useEffect(() => {
    let active = true;
    if (Platform.OS !== 'ios') { setState('unavailable'); return undefined; }
    if (!isGuest && token) {
      refresh().catch(() => { if (active) setState('disabled'); });
    } else setState('disabled');
    return () => { active = false; };
  }, [isGuest, token, refresh]);

  async function enable() {
    if (isGuest || !token) {
      router.push('/(auth)/sign-in');
      return;
    }
    if (state === 'denied') {
      await openNotificationSettings();
      return;
    }
    setError('');
    setState('loading');
    try {
      const result = await registerForPushNotifications({ requestPermission: true, force: true });
      if (!result.ok) {
        setError(result.message || copy.notificationProblem);
        await refresh();
        return;
      }
      // Enabling result-ready notifications also opts into that preference.
      const preferences = await getLocalNotificationPreferences();
      await saveLocalNotificationPreferences({ ...preferences, report_ready: true });
      // On backends with preferences support, honor the user's explicit opt-in.
      await updateNotificationPreferences({ report_ready: true });
      setState('enabled');
    } catch (err) {
      setError(err?.message || copy.notificationProblem);
      await refresh();
    }
  }

  if (Platform.OS !== 'ios') return null;
  const active = state === 'enabled';
  const disabled = state === 'loading';

  return (
    <View className="mt-4 w-full max-w-[360px] rounded-[22px] bg-[#EAE7F1] px-4 py-4">
      <View className="flex-row items-start">
        <View className="h-11 w-11 items-center justify-center rounded-[14px] bg-white">
          {active ? <Check size={22} color="#397A5A" strokeWidth={2.5} /> : <BellRing size={22} color="#654E9A" strokeWidth={1.9} />}
        </View>
        <View className="ml-3 flex-1">
          <Text className="font-inter-semibold text-[14px] leading-[19px] text-[#181027]">
            {active ? copy.notificationActive : copy.notificationTitle}
          </Text>
          <Text className="mt-1 font-inter text-[12px] leading-[18px] text-[#716B7E]">
            {isGuest ? copy.notificationGuest : state === 'denied' ? copy.notificationDisabled : state === 'unavailable' ? copy.notificationUnavailable : copy.notificationBody}
          </Text>
        </View>
      </View>
      {!active && state !== 'unavailable' ? (
        <Pressable
          accessibilityRole="button"
          disabled={disabled}
          onPress={enable}
          className="mt-4 min-h-[43px] flex-row items-center justify-center rounded-[13px] bg-[#181027] px-4 active:opacity-80 disabled:opacity-60"
        >
          {disabled ? <ActivityIndicator size="small" color="white" /> : (
            <>
              <Text className="font-inter-semibold text-[13px] text-white">
                {isGuest ? copy.notificationGuestButton : state === 'denied' ? copy.notificationSettings : copy.notificationButton}
              </Text>
              <ChevronRight size={16} color="white" style={{ marginLeft: 3 }} />
            </>
          )}
        </Pressable>
      ) : null}
      {!!error && <Text className="mt-3 font-inter text-[12px] text-[#9A3535]">{error}</Text>}
    </View>
  );
}
