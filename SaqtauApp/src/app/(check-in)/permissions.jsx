import {
  Activity,
  Camera,
  Mic,
  ShieldCheck,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Linking,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import PermissionRow from '@/src/features/check-in/components/PermissionRow';
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

function normalizePermission(permission) {
  if (!permission) {
    return {
      granted: false,
      status: 'undetermined',
      canAskAgain: true,
    };
  }

  return {
    granted: Boolean(permission.granted),
    status: permission.status || 'undetermined',
    canAskAgain:
      permission.canAskAgain !== false,
  };
}

export default function PermissionsScreen() {
  const [camera, setCamera] = useState(null);
  const [motion, setMotion] = useState(null);
  const [microphone, setMicrophone] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [message, setMessage] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);

    try {
      const [
        cameraPermission,
        microphonePermission,
        motionAvailable,
      ] = await Promise.all([
        getCameraPermission(),
        getMicrophonePermission(),
        isMotionAvailable(),
      ]);

      let motionPermission = null;

      if (motionAvailable) {
        motionPermission =
          await getMotionPermission();
      }

      setCamera(
        normalizePermission(cameraPermission),
      );

      setMicrophone(
        normalizePermission(
          microphonePermission,
        ),
      );

      setMotion(
        motionAvailable
          ? normalizePermission(motionPermission)
          : {
              granted: false,
              status: 'unavailable',
              canAskAgain: false,
              unavailable: true,
            },
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();

    const subscription = AppState.addEventListener(
      'change',
      (state) => {
        if (state === 'active') {
          refresh();
        }
      },
    );

    return () => subscription.remove();
  }, [refresh]);

  async function requestSingle(type) {
    setMessage('');

    const current = {
      camera,
      motion,
      microphone,
    }[type];

    if (
      current?.status === 'denied' &&
      current?.canAskAgain === false
    ) {
      await Linking.openSettings();
      return;
    }

    if (type === 'camera') {
      const result =
        await requestCameraPermission();
      setCamera(normalizePermission(result));
      return;
    }

    if (type === 'motion') {
      const available =
        await isMotionAvailable();

      if (!available) {
        setMotion({
          granted: false,
          status: 'unavailable',
          canAskAgain: false,
          unavailable: true,
        });
        return;
      }

      const result =
        await requestMotionPermission();
      setMotion(normalizePermission(result));
      return;
    }

    const result =
      await requestMicrophonePermission();
    setMicrophone(normalizePermission(result));
  }

  async function handleContinue() {
    setRequesting(true);
    setMessage('');

    try {
      let cameraResult = camera;
      let motionResult = motion;
      let microphoneResult = microphone;

      if (!cameraResult?.granted) {
        const result =
          await requestCameraPermission();
        cameraResult = normalizePermission(result);
        setCamera(cameraResult);
      }

      if (!motionResult?.granted) {
        const available =
          await isMotionAvailable();

        if (available) {
          const result =
            await requestMotionPermission();
          motionResult = normalizePermission(result);
          setMotion(motionResult);
        } else {
          motionResult = {
            granted: false,
            status: 'unavailable',
            canAskAgain: false,
            unavailable: true,
          };
          setMotion(motionResult);
        }
      }

      if (
        microphoneResult?.status ===
        'undetermined'
      ) {
        const result =
          await requestMicrophonePermission();
        microphoneResult =
          normalizePermission(result);
        setMicrophone(microphoneResult);
      }

      if (
        !cameraResult?.granted ||
        !motionResult?.granted
      ) {
        setMessage(
          'Camera and Motion access are required for this check-in.',
        );
        return;
      }

      router.push('/(check-in)/capture');
    } finally {
      setRequesting(false);
    }
  }

  const requiredGranted =
    camera?.granted && motion?.granted;

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#ECECEC]">
        <ActivityIndicator color="#181027" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      className="flex-1 bg-[#ECECEC]"
      edges={['top', 'bottom']}
    >
      <View className="flex-1 px-6">
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          className="h-11 w-11 items-start justify-center"
        >
          <Text className="font-inter-medium text-[16px] text-[#181027]">
            Back
          </Text>
        </Pressable>

        <View className="mt-8">
          <View className="h-14 w-14 items-center justify-center rounded-[20px] bg-white">
            <ShieldCheck
              size={26}
              strokeWidth={1.8}
              color="#181027"
            />
          </View>

          <Text className="mt-6 font-inter-extrabold text-[34px] leading-[40px] tracking-[-1.1px] text-[#181027]">
            Your permissions,{`\n`}your choice.
          </Text>

          <Text className="mt-4 max-w-[340px] font-inter text-[16px] leading-[23px] text-[#807B89]">
            SaqtauAI needs camera and motion access to run a 60-second check-in. Microphone access is optional for future voice features.
          </Text>
        </View>

        <View className="mt-8">
          <PermissionRow
            title="Camera"
            description="Used for your 60-second face check-in."
            Icon={Camera}
            permission={camera}
            onPress={() => requestSingle('camera')}
          />

          <PermissionRow
            title="Motion"
            description="Helps detect movement and keep the reading stable."
            Icon={Activity}
            permission={motion}
            onPress={() => requestSingle('motion')}
          />

          <PermissionRow
            title="Microphone"
            description="Optional. Used later for voice conversations, not this recording."
            Icon={Mic}
            permission={microphone}
            optional
            onPress={() =>
              requestSingle('microphone')
            }
          />
        </View>

        <View className="mt-auto pb-3">
          {message ? (
            <Text className="mb-3 text-center font-inter-medium text-[13px] leading-[18px] text-[#A45353]">
              {message}
            </Text>
          ) : null}

          <Pressable
            accessibilityRole="button"
            disabled={requesting}
            onPress={handleContinue}
            className="h-[58px] items-center justify-center rounded-[16px] bg-[#181027] active:opacity-90 disabled:opacity-60"
          >
            {requesting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="font-inter-semibold text-[16px] text-white">
                {requiredGranted
                  ? 'Continue'
                  : 'Allow & continue'}
              </Text>
            )}
          </Pressable>

          <Text className="mt-3 text-center font-inter text-[12px] leading-[17px] text-[#807B89]">
            You can change permissions later in iOS Settings.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}