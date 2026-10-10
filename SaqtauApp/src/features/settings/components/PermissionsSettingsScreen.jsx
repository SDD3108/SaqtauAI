import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AppState, Linking, Pressable, Text, View } from 'react-native';

import CameraIcon from '@/assets/images/camera.svg';
import ManageIcon from '@/assets/images/manage.svg';
import MicrophoneIcon from '@/assets/images/microphone.svg';
import MotionIcon from '@/assets/images/motion.svg';
import TimeIcon from '@/assets/images/time.svg';
import YourChoiceIcon from '@/assets/images/your choice.svg';
import useI18n from '@/src/features/localization/hooks/useI18n';
import SettingsPage from '@/src/features/settings/components/SettingsPage';
import SettingsRow from '@/src/features/settings/components/SettingsRow';
import { getDeviceScreenTimeStatus } from '@/src/features/screen-time/screen-time.native';
import {
  getCameraPermission,
  requestCameraPermission,
} from '@/src/services/permissions/camera';
import {
  getMicrophonePermission,
  requestMicrophonePermission,
} from '@/src/services/permissions/microphone';
import {
  getMotionPermission,
  isMotionAvailable,
  requestMotionPermission,
} from '@/src/services/permissions/motion';

function PermissionStatus({ allowed, unavailable, t }) {
  return (
    <View
      className={`rounded-full px-3 py-1.5 ${
        allowed ? 'bg-[#E6F1E8]' : unavailable ? 'bg-[#E9E7EC]' : 'bg-[#F4E7E8]'
      }`}
    >
      <Text
        className={`font-inter-semibold text-[11px] ${
          allowed ? 'text-[#39724B]' : unavailable ? 'text-[#777180]' : 'text-[#A3434B]'
        }`}
      >
        {allowed ? t('common.allowed') : unavailable ? t('common.unavailable') : t('common.off')}
      </Text>
    </View>
  );
}

export default function PermissionsSettingsScreen() {
  const { t } = useI18n();
  const [camera, setCamera] = useState(null);
  const [motion, setMotion] = useState(null);
  const [microphone, setMicrophone] = useState(null);
  const [screenTime, setScreenTime] = useState(null);
  const [motionAvailable, setMotionAvailable] = useState(true);
  const [busy, setBusy] = useState('');

  const permissionLabel = useCallback(
    (permission, unavailable = false) => {
      if (unavailable) return t('permissions.notAvailable');
      if (permission?.granted) return t('common.allowed');
      if (permission?.status === 'denied') return t('common.notAllowed');
      return t('common.notRequested');
    },
    [t],
  );

  const screenTimeLabel = useCallback(
    (value) => {
      if (!value?.available) return t('permissions.screenTimeBuild');
      const status = String(value.authorizationStatus || 'notDetermined');
      if (status.toLowerCase().includes('approved')) {
        return value.monitoring ? t('permissions.policyActive') : t('common.allowed');
      }
      if (status === 'denied') return t('common.notAllowed');
      return t('common.notRequested');
    },
    [t],
  );

  const refresh = useCallback(async () => {
    const [cameraPermission, microphonePermission, available, screenTimeStatus] =
      await Promise.all([
        getCameraPermission(),
        getMicrophonePermission(),
        isMotionAvailable(),
        getDeviceScreenTimeStatus(),
      ]);

    let motionPermission = null;
    if (available) motionPermission = await getMotionPermission();

    setCamera(cameraPermission);
    setMicrophone(microphonePermission);
    setMotion(motionPermission);
    setMotionAvailable(available);
    setScreenTime(screenTimeStatus);
  }, []);

  useEffect(() => {
    refresh().catch(() => {});
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh().catch(() => {});
    });
    return () => subscription.remove();
  }, [refresh]);

  async function request(kind) {
    setBusy(kind);
    try {
      if (kind === 'camera') setCamera(await requestCameraPermission());
      if (kind === 'motion') setMotion(await requestMotionPermission());
      if (kind === 'microphone') setMicrophone(await requestMicrophonePermission());
    } finally {
      setBusy('');
    }
  }

  const rows = [
    {
      key: 'camera',
      title: t('permissions.camera'),
      Icon: CameraIcon,
      permission: camera,
      unavailable: false,
      request: () => request('camera'),
    },
    {
      key: 'motion',
      title: t('permissions.motion'),
      Icon: MotionIcon,
      permission: motion,
      unavailable: !motionAvailable,
      request: () => request('motion'),
    },
    {
      key: 'microphone',
      title: t('permissions.microphone'),
      Icon: MicrophoneIcon,
      permission: microphone,
      unavailable: false,
      request: () => request('microphone'),
    },
  ];

  const screenTimeAllowed = String(screenTime?.authorizationStatus || '')
    .toLowerCase()
    .includes('approved');
  const screenTimeUnavailable = screenTime?.available === false;

  return (
    <SettingsPage
      title={t('permissions.title')}
      subtitle={t('permissions.subtitle')}
      footer={
        <View className="flex-row items-center justify-center gap-3 px-6">
          <YourChoiceIcon width={28} height={28} />
          <Text className="font-inter-medium text-[14px] text-[#696477]">
            {t('permissions.choice')}
          </Text>
        </View>
      }
    >
      <View className="rounded-[22px] bg-[#F7F7F8] px-2 py-1">
        {rows.map((row, index) => {
          const allowed = Boolean(row.permission?.granted);
          const canAsk = row.permission?.canAskAgain !== false;
          const subtitle = permissionLabel(row.permission, row.unavailable);
          const canRequest = !allowed && !row.unavailable && canAsk;

          return (
            <View key={row.key}>
              <SettingsRow
                title={row.title}
                subtitle={busy === row.key ? t('common.requesting') : subtitle}
                Icon={row.Icon}
                onPress={canRequest ? row.request : undefined}
                trailing={<PermissionStatus allowed={allowed} unavailable={row.unavailable} t={t} />}
                showChevron={false}
              />
              {index < rows.length - 1 ? <View className="mx-3 h-px bg-[#E7E5EA]" /> : null}
            </View>
          );
        })}
      </View>

      <View className="mt-4 rounded-[22px] bg-[#F7F7F8] px-2 py-1">
        <SettingsRow
          title={t('permissions.screenTime')}
          subtitle={screenTimeLabel(screenTime)}
          Icon={TimeIcon}
          onPress={() => router.push('/(app)/settings/screen-time')}
          trailing={
            <PermissionStatus allowed={screenTimeAllowed} unavailable={screenTimeUnavailable} t={t} />
          }
        />
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => Linking.openSettings()}
        className="mt-5 flex-row items-center justify-center gap-3 rounded-[18px] bg-white px-4 py-4 active:opacity-70"
      >
        <ManageIcon width={24} height={24} />
        <Text className="font-inter-semibold text-[15px] text-[#181027]">
          {t('permissions.manage')}
        </Text>
      </Pressable>

      <Text className="mt-4 px-4 text-center font-inter-medium text-[12px] leading-[18px] text-[#918B9D]">
        {t('permissions.explanation')}
      </Text>
    </SettingsPage>
  );
}
