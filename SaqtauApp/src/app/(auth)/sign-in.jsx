import useI18n from '@/src/features/localization/hooks/useI18n';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, Text } from 'react-native';

import AuthShell from '@/src/features/auth/components/AuthShell';
import SignInForm from '@/src/features/auth/components/SignInForm';
import { normalizeReturnTo } from '@/src/features/auth/navigation';
import { useAuthStore } from '@/src/features/auth/auth.store';

export default function SignInScreen() {
  const { t } = useI18n();
  const params = useLocalSearchParams();
  const returnTo = useMemo(() => normalizeReturnTo(params.returnTo), [params.returnTo]);
  const signIn = useAuthStore((state) => state.signIn);
  const busy = useAuthStore((state) => state.authBusy);

  return (
    <AuthShell
      title={t('auth.welcomeBack')}
      subtitle={t('auth.signInSubtitle')}
      onBack={() => router.back()}
      footer={
        <Pressable
          accessibilityRole="button"
          className="items-center py-3"
          onPress={() =>
            router.replace({
              pathname: '/(auth)/create-account',
              params: returnTo ? { returnTo } : undefined,
            })
          }
        >
          <Text className="font-inter text-[14px] text-[#807B89]">
            {t('auth.newHere')}{' '}
            <Text className="font-inter-semibold text-[#181027]">{t('auth.createAccount')}</Text>
          </Text>
        </Pressable>
      }
    >
      <SignInForm
        busy={busy}
        onForgotPassword={() => router.push('/(auth)/forgot-password')}
        onSubmit={async (email, password) => {
          await signIn(email, password);
          router.replace(returnTo || '/(app)/(tabs)');
        }}
      />
    </AuthShell>
  );
}
