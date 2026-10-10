import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AppState, Linking, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { ChevronLeft, ChevronRight, Clock3 } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import CameraIcon from '@/assets/images/camera.svg';
import ManageIcon from '@/assets/images/manage.svg';
import MicrophoneIcon from '@/assets/images/microphone.svg';
import MotionIcon from '@/assets/images/motion.svg';
import YourChoiceIcon from '@/assets/images/your choice.svg';
import useI18n from '@/src/features/localization/hooks/useI18n';
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

// Keep this row local so other settings screens retain their current appearance.
function PermissionRow({ title, description, status, Icon, iconWidth = 24, iconHeight = 24, onPress }) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${title}. ${description}. ${status}`}
      disabled={!onPress}
      onPress={onPress}
      className="min-h-[102px] flex-row items-center gap-4 px-3 py-5 active:opacity-70"
    >
      <View className="h-12 p-4 w-12 shrink-0 items-center justify-center rounded-[13px] bg-[#181027]">
        <Icon width={iconWidth} height={iconHeight} />
      </View>
      <View className="min-w-0 flex-1">
        <View className="flex-row flex-wrap items-center justify-between gap-x-2 gap-y-1">
          <Text className="shrink font-inter-semibold text-[17px] leading-[23px] tracking-[-0.3px] text-[#181027]">
            {title}
          </Text>
          <Text className="shrink font-inter-medium text-[13px] leading-[19px] text-[#181027]">
            {status}
          </Text>
        </View>
        <Text className="mt-2 font-inter-medium text-[14px] leading-[19px] text-[#181027]">
          {description}
        </Text>
      </View>
      <ChevronRight size={19} strokeWidth={2.2} color="#8E879B" />
    </Pressable>
  );
}

function ScreenTimeIcon() {
  return <Clock3 size={24} color="#ECECEC" strokeWidth={2} />;
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
      description: t('permissions.cameraDescription'),
      iconWidth: 24,
      iconHeight: 20,
      title: t('permissions.camera'),
      Icon: CameraIcon,
      permission: camera,
      unavailable: false,
      request: () => request('camera'),
    },
    {
      key: 'motion',
      description: t('permissions.motionDescription'),
      iconWidth: 23,
      iconHeight: 24,
      title: t('permissions.motion'),
      Icon: MotionIcon,
      permission: motion,
      unavailable: !motionAvailable,
      request: () => request('motion'),
    },
    {
      key: 'microphone',
      description: t('permissions.microphoneDescription'),
      iconWidth: 20,
      iconHeight: 25,
      title: t('permissions.microphone'),
      Icon: MicrophoneIcon,
      permission: microphone,
      unavailable: false,
      request: () => request('microphone'),
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-[#ECECEC]" edges={['top', 'bottom', 'left', 'right']}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 18, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ width: '100%', maxWidth: 560, flex: 1, alignSelf: 'center' }}>
          <View className="mt-3 flex-row items-center">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('ai.goBack')}
              onPress={() => router.back()}
              className="h-11 w-11 items-center justify-center active:opacity-60"
            >
              <ChevronLeft size={30} strokeWidth={2.2} color="#8E879B" />
            </Pressable>
            <Text className="flex-1 text-center font-inter-bold text-[23px] leading-[30px] tracking-[-0.6px] text-[#181027]">
              {t('permissions.title')}
            </Text>
            <View className="w-11" />
          </View>

          <Text className="mb-9 mt-7 px-3 font-inter-medium text-[15px] leading-[21px] text-[#181027]">
            {t('permissions.designIntro')}
          </Text>

          <View className="rounded-[14px] bg-[#F7F7F8] px-0.5 py-2">
            {rows.map((row) => {
              const allowed = Boolean(row.permission?.granted);
              const canAsk = row.permission?.canAskAgain !== false;
              const subtitle = permissionLabel(row.permission, row.unavailable);
              const canRequest = !allowed && !row.unavailable && canAsk;

              return (
                <PermissionRow
                  key={row.key}
                  title={row.title}
                  description={row.description}
                  status={busy === row.key ? t('common.requesting') : subtitle}
                  Icon={row.Icon}
                  iconWidth={row.iconWidth}
                  iconHeight={row.iconHeight}
                  onPress={canRequest ? row.request : undefined}
                />
              );
            })}
          </View>

          <View className="mt-3 rounded-[14px] bg-[#F7F7F8] px-0.5">
            <PermissionRow
              title={t('permissions.screenTime')}
              description={t('permissions.screenTimeDescription')}
              status={screenTimeLabel(screenTime)}
              Icon={ScreenTimeIcon}
              onPress={() => router.push('/(app)/settings/screen-time')}
            />
          </View>

          <Text className="mt-8 px-3 text-center font-inter-medium text-[14px] leading-[20px] text-[#181027]">
            {t('permissions.changeAnytime')}
          </Text>

          <Pressable
            accessibilityRole="button"
            onPress={() => Linking.openSettings()}
            className="mt-8 min-h-[58px] flex-row items-center gap-3 rounded-[18px] border-[1.5px] border-[#8E879B] px-5 py-3 active:opacity-60"
          >
            <Text className="flex-1 text-center font-inter-semibold text-[16px] leading-[23px] text-[#8E879B]">
              {Platform.OS === 'ios' ? t('permissions.manage') : t('permissions.manageSystem')}
            </Text>
            <ManageIcon width={20} height={20} />
          </Pressable>

          <View className="mt-4 flex-row items-start gap-4 rounded-[20px] border border-[#EEEEF0] bg-[#F3F3F5] px-4 py-4">
            <YourChoiceIcon width={32} height={42} />
            <View className="min-w-0 flex-1">
              <Text className="font-inter-semibold text-[14px] leading-[20px] text-[#181027]">
                {t('permissions.choice')}
              </Text>
              <Text className="mt-2 font-inter-medium text-[14px] leading-[20px] text-[#8E879B]">
                {t('permissions.choiceBody')}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
