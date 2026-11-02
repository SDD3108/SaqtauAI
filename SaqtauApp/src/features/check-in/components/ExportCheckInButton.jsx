import { FileDown } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { useAuthStore } from '@/src/features/auth/auth.store';
import useI18n from '@/src/features/localization/hooks/useI18n';
import { exportMeasurementReport } from '@/src/features/settings/export/exportReport';
import { STORAGE_KEYS } from '@/src/services/storage/keys';
import { getJSON } from '@/src/services/storage/storage';

export default function ExportCheckInButton({ measurement }) {
  const { language, t } = useI18n();
  const inFlight = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleExport() {
    if (inFlight.current || measurement?.status !== 'completed') return;
    inFlight.current = true;
    setBusy(true);
    setError('');
    try {
      const { account, isGuest } = useAuthStore.getState();
      const data = isGuest
        ? { profile: await getJSON(STORAGE_KEYS.PROFILE, null), checkins: [measurement] }
        : { account, measurements: [measurement] };
      await exportMeasurementReport(data, { language });
    } catch (cause) {
      setError(cause?.message || t('privacy.exportError'));
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  return (
    <View className="mt-5">
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ busy, disabled: busy }}
        disabled={busy}
        onPress={handleExport}
        className="min-h-[52px] flex-row items-center justify-center gap-3 rounded-[16px] bg-white px-4 py-3 active:opacity-75"
      >
        {busy ? <ActivityIndicator size="small" color="#181027" /> : <FileDown size={20} color="#181027" />}
        <Text className="shrink text-center font-inter-semibold text-[15px] text-[#181027]">
          {t('checkin.exportPdf')}
        </Text>
      </Pressable>
      {error ? (
        <Text accessibilityLiveRegion="polite" className="mt-2 font-inter text-[13px] leading-[19px] text-[#A3434B]">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
