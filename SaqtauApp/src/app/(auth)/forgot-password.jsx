import useI18n from '@/src/features/localization/hooks/useI18n';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { requestPasswordReset } from '@/src/features/auth/auth.api';
import AuthInput from '@/src/features/auth/components/AuthInput';
import AuthShell from '@/src/features/auth/components/AuthShell';

export default function ForgotPasswordScreen() {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const emailError = useMemo(() => {
    const value = email.trim();
    return !value || !/^\S+@\S+\.\S+$/.test(value)
      ? t('auth.invalidEmail')
      : '';
  }, [email]);

  async function submit() {
    setSubmitted(true);
    setError('');

    if (emailError || busy) {
      return;
    }

    setBusy(true);

    try {
      await requestPasswordReset(email.trim().toLowerCase());
      setSent(true);
    } catch (requestError) {
      setError(requestError?.message || t('auth.resetSendError'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title={t('auth.resetTitle')}
      subtitle={t('auth.resetSubtitle')}
      onBack={() => router.back()}
    >
      {sent ? (
        <View className="mt-6 rounded-[24px] bg-[#F7F7F8] px-5 py-6">
          <Text className="font-inter-bold text-[19px] text-[#181027]">
            {t('auth.checkEmail')}
          </Text>
          <Text className="mt-2 font-inter text-[14px] leading-[21px] text-[#807B89]">
            {t('auth.resetSent', { email: email.trim() })}
          </Text>
          <Pressable
            accessibilityRole="button"
            className="mt-6 h-14 items-center justify-center rounded-2xl bg-[#181027] px-4 py-4"
            onPress={() => router.replace('/(auth)/sign-in')}
          >
            <Text className="font-inter-semibold text-[15px] text-[#ECECEC]">
              {t('auth.backToSignIn')}
            </Text>
          </Pressable>
        </View>
      ) : (
        <>
          <AuthInput
            label={t('auth.email')}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
            error={submitted ? emailError : ''}
            returnKeyType="done"
            onSubmitEditing={submit}
          />

          {error ? (
            <Text className="mt-3 font-inter text-[13px] text-[#B84747]">
              {error}
            </Text>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: busy }}
            className={`mt-7 h-14 items-center justify-center rounded-2xl bg-[#181027] ${
              busy ? 'opacity-60' : ''
            }`}
            disabled={busy}
            onPress={submit}
          >
            {busy ? (
              <ActivityIndicator color="#ECECEC" />
            ) : (
              <Text className="font-inter-semibold text-[16px] text-[#ECECEC]">
                {t('auth.sendReset')}
              </Text>
            )}
          </Pressable>
        </>
      )}
    </AuthShell>
  );
}
