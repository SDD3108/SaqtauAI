import { router } from 'expo-router';
import { useEffect } from 'react';

import useI18n from '@/src/features/localization/hooks/useI18n';

import AboutYouForm from '@/src/features/auth/components/AboutYouForm';
import AuthShell from '@/src/features/auth/components/AuthShell';
import { normalizeReturnTo } from '@/src/features/auth/navigation';
import { useAuthSignupStore } from '@/src/features/auth/auth-signup.store';
import { useAuthStore } from '@/src/features/auth/auth.store';
import { useOnboardingStore } from '@/src/features/onboarding/onboarding.store';

export default function AboutYouScreen() {
  const { t } = useI18n();
  const email = useAuthSignupStore((state) => state.email);
  const password = useAuthSignupStore((state) => state.password);
  const hasCredentials = useAuthSignupStore((state) => state.hasCredentials);
  const returnTo = useAuthSignupStore((state) => state.returnTo);
  const clearSignup = useAuthSignupStore((state) => state.clear);
  const registerFromGuest = useAuthStore((state) => state.registerFromGuest);
  const busy = useAuthStore((state) => state.authBusy);
  const profile = useOnboardingStore((state) => state.profile);
  const saveProfile = useOnboardingStore((state) => state.saveProfile);

  useEffect(() => {
    if (!hasCredentials) {
      router.replace('/(auth)/create-account');
    }
  }, [hasCredentials]);

  if (!hasCredentials) {
    return null;
  }

  return (
    <AuthShell
      step={t('auth.step2')}
      title={t('auth.aboutYou')}
      subtitle={t('auth.aboutSubtitle')}
      onBack={() => router.back()}
    >
      <AboutYouForm
        profile={profile}
        busy={busy}
        onSubmit={async ({ displayName, profile: nextProfile }) => {
          await saveProfile(nextProfile);
          await registerFromGuest({
            email,
            password,
            displayName,
            profile: nextProfile,
          });

          const destination = normalizeReturnTo(returnTo);
          clearSignup();

          if (destination) {
            router.replace(destination);
            return;
          }

          router.replace('/(onboarding)/first-check-in');
        }}
      />
    </AuthShell>
  );
}
