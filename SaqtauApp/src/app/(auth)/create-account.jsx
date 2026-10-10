import useI18n from '@/src/features/localization/hooks/useI18n';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { Pressable, Text } from 'react-native';

import AuthShell from '@/src/features/auth/components/AuthShell';
import CreateAccountForm from '@/src/features/auth/components/CreateAccountForm';
import { normalizeReturnTo } from '@/src/features/auth/navigation';
import { useAuthSignupStore } from '@/src/features/auth/auth-signup.store';

export default function CreateAccountScreen() {
  const { t } = useI18n();
  const params = useLocalSearchParams();
  const paramReturnTo = useMemo(
    () => normalizeReturnTo(params.returnTo),
    [params.returnTo],
  );
  const setCredentials = useAuthSignupStore((state) => state.setCredentials);
  const setReturnTo = useAuthSignupStore((state) => state.setReturnTo);
  const storedReturnTo = useAuthSignupStore((state) => state.returnTo);
  const returnTo = paramReturnTo || storedReturnTo;

  useEffect(() => {
    if (paramReturnTo) {
      setReturnTo(paramReturnTo);
    }
  }, [paramReturnTo, setReturnTo]);

  return (
    <AuthShell
      step={t('auth.step1')}
      title={t('auth.createTitle')}
      subtitle={t('auth.createSubtitle')}
      onBack={() => router.back()}
      footer={
        <Pressable
          accessibilityRole="button"
          className="items-center py-3"
          onPress={() =>
            router.replace({
              pathname: '/(auth)/sign-in',
              params: returnTo ? { returnTo } : undefined,
            })
          }
        >
          <Text className="font-inter text-[14px] text-[#807B89]">
            {t('auth.alreadyAccount')}{' '}
            <Text className="font-inter-semibold text-[#181027]">{t('auth.signIn')}</Text>
          </Text>
        </Pressable>
      }
    >
      <CreateAccountForm
        onContinue={(email, password) => {
          setCredentials(email, password);
          router.push('/(onboarding)/about-you');
        }}
      />
    </AuthShell>
  );
}
