import { tNow } from '@/src/features/localization/localization.store';
import useI18n from '@/src/features/localization/hooks/useI18n';
import { router } from 'expo-router';
import {
  CheckCircle2,
  HeartPulse,
} from 'lucide-react-native';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getMeasurement } from '@/src/features/check-in/check-in.api';
import MetricCard from '@/src/features/check-in/components/MetricCard';
import {
  getLastMeasurementId,
  getLocalGuestCheckIn,
} from '@/src/features/check-in/check-in.storage';
import { useCheckInStore } from '@/src/features/check-in/check-in.store';
import { useAuthStore } from '@/src/features/auth/auth.store';

function round(value, digits = 0) {
  if (
    value === null ||
    value === undefined ||
    Number.isNaN(Number(value))
  ) {
    return '—';
  }

  const factor = 10 ** digits;
  return String(
    Math.round(Number(value) * factor) /
      factor,
  );
}

function formatStress(level) {
  if (!level) {
    return '—';
  }

  const key = ['low', 'medium', 'high'].includes(String(level).toLowerCase()) ? `history.${String(level).toLowerCase()}` : null;
  return key ? tNow(key) : String(level);
}

function formatSignalQuality(value) {
  if (
    value === null ||
    value === undefined ||
    Number.isNaN(Number(value))
  ) {
    return '—';
  }

  const numeric = Number(value);
  const percent =
    numeric <= 1 ? numeric * 100 : numeric;

  return `${Math.round(percent)}%`;
}

export default function ResultScreen() {
  const { t } = useI18n();
  const storedMeasurement = useCheckInStore(
    (state) => state.measurement,
  );
  const setMeasurement = useCheckInStore(
    (state) => state.setMeasurement,
  );
  const resetAll = useCheckInStore(
    (state) => state.resetAll,
  );
  const isGuest = useAuthStore(
    (state) => state.isGuest,
  );

  const [loading, setLoading] = useState(
    !storedMeasurement,
  );
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (storedMeasurement) {
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const id = await getLastMeasurementId();

        if (!id) {
          throw new Error(
            t('checkin.noCompleted'),
          );
        }

        let measurement = null;

        if (isGuest) {
          measurement =
            await getLocalGuestCheckIn(id);
        }

        if (!measurement) {
          measurement = await getMeasurement(id);
        }

        if (cancelled) {
          return;
        }

        if (measurement?.status !== 'completed') {
          router.replace(
            '/(check-in)/processing',
          );
          return;
        }

        setMeasurement(measurement);
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error?.message ||
              t('checkin.loadError'),
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [
    isGuest,
    setMeasurement,
    storedMeasurement,
  ]);

  const measurement =
    storedMeasurement ||
    useCheckInStore.getState().measurement;

  function finish() {
    resetAll();
    router.replace('/(app)/(tabs)');
  }

  function checkInAgain() {
    resetAll();
    router.replace('/(check-in)/permissions');
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#ECECEC]">
        <ActivityIndicator color="#181027" />
      </SafeAreaView>
    );
  }

  if (loadError || !measurement) {
    return (
      <SafeAreaView className="flex-1 bg-[#ECECEC] px-6">
        <View className="flex-1 items-center justify-center">
          <Text className="text-center font-inter-bold text-[24px] text-[#181027]">
            {t('checkin.resultUnavailable')}
          </Text>
          <Text className="mt-3 text-center font-inter text-[15px] leading-[22px] text-[#807B89]">
            {loadError ||
              t('checkin.resultUnavailableBody')}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={finish}
          className="mb-4 h-[58px] items-center justify-center rounded-[16px] bg-[#181027]"
        >
          <Text className="font-inter-semibold text-[16px] text-white">
            {t('checkin.backHome')}
          </Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const warnings = Array.isArray(
    measurement.warnings,
  )
    ? measurement.warnings.filter(Boolean)
    : [];

  return (
    <SafeAreaView
      className="flex-1 bg-[#ECECEC]"
      edges={['top', 'bottom']}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: 32,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mt-5 flex-row items-center">
          <View className="h-12 w-12 items-center justify-center rounded-[18px] bg-white">
            <CheckCircle2
              size={24}
              strokeWidth={1.8}
              color="#397A5A"
            />
          </View>

          <Text className="ml-3 font-inter-semibold text-[14px] text-[#397A5A]">
            {t('checkin.complete')}
          </Text>
        </View>

        <Text className="mt-7 font-inter-extrabold text-[34px] leading-[40px] tracking-[-1.1px] text-[#181027]">
          {t('checkin.resultTitle')}
        </Text>

        <Text className="mt-3 font-inter text-[16px] leading-[23px] text-[#807B89]">
          {t('checkin.resultBody')}
        </Text>

        <View className="mt-8 flex-row flex-wrap justify-between gap-y-3">
          <MetricCard
            label={t('checkin.heartRate')}
            value={round(measurement.bpm)}
            unit="BPM"
          />

          <MetricCard
            label={t('checkin.hrv')}
            value={round(
              measurement.hrv_rmssd_ms,
              1,
            )}
            unit="ms"
            helper="RMSSD"
          />

          <MetricCard
            label={t('checkin.hrv')}
            value={round(
              measurement.hrv_sdnn_ms,
              1,
            )}
            unit="ms"
            helper="SDNN"
          />

          <MetricCard
            label={t('checkin.breathing')}
            value={round(
              measurement.breathing_rate_bpm,
              1,
            )}
            unit="/min"
          />

          <MetricCard
            label={t('checkin.stress')}
            value={formatStress(
              measurement.stress_level,
            )}
            helper={
              measurement.stress_index != null
                ? t('checkin.index', { value: round(measurement.stress_index) })
                : null
            }
          />

          <MetricCard
            label={t('checkin.signalQuality')}
            value={formatSignalQuality(
              measurement.signal_quality,
            )}
            helper={
              measurement.face_coverage != null
                ? t('checkin.faceCoverage', { value: formatSignalQuality(measurement.face_coverage) })
                : null
            }
          />
        </View>

        {warnings.length ? (
          <View className="mt-5 rounded-[20px] bg-white px-4 py-4">
            <Text className="font-inter-semibold text-[14px] text-[#181027]">
              {t('checkin.readingNotes')}
            </Text>

            {warnings.slice(0, 3).map((warning) => (
              <Text
                key={String(warning)}
                className="mt-2 font-inter text-[13px] leading-[19px] text-[#807B89]"
              >
                • {String(warning)}
              </Text>
            ))}
          </View>
        ) : null}

        <View className="mt-5 flex-row items-start rounded-[20px] bg-[#181027] px-4 py-4">
          <HeartPulse
            size={20}
            strokeWidth={1.8}
            color="#FFFFFF"
          />

          <Text className="ml-3 flex-1 font-inter text-[12px] leading-[18px] text-white/80">
            {t('checkin.wellnessDisclaimer')}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={finish}
          className="mt-8 h-[58px] items-center justify-center rounded-[16px] bg-[#181027] active:opacity-90"
        >
          <Text className="font-inter-semibold text-[16px] text-white">
            {t('checkin.finish')}
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={checkInAgain}
          className="mt-2 h-12 items-center justify-center"
        >
          <Text className="font-inter-semibold text-[15px] text-[#181027]">
            {t('checkin.checkInAgain')}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
