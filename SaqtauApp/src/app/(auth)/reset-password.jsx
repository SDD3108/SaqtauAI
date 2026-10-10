import useI18n from '@/src/features/localization/hooks/useI18n';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { confirmPasswordReset } from '@/src/features/auth/auth.api';
import AuthInput from '@/src/features/auth/components/AuthInput';
import AuthShell from '@/src/features/auth/components/AuthShell';

export default function ResetPasswordScreen() {
  const { t } = useI18n();
  const params = useLocalSearchParams();
  const token = Array.isArray(params.token) ? params.token[0] : params.token;
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const errors = useMemo(
    () => ({
      password: password.length < 8 ? t('auth.passwordMin') : '',
      confirmPassword:
        !confirmPassword || password !== confirmPassword
          ? t('auth.passwordMismatch')
          : '',
    }),
    [confirmPassword, password],
  );

  async function submit() {
    setSubmitted(true);
    setError('');

    if (!token || errors.password || errors.confirmPassword || busy) {
      return;
    }

    setBusy(true);

    try {
      await confirmPasswordReset(String(token), password);
      setDone(true);
    } catch (requestError) {
      setError(requestError?.message || t('auth.resetError'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title={t('auth.newPasswordTitle')}
      subtitle={t('auth.newPasswordSubtitle')}
      onBack={() => router.replace('/(auth)/sign-in')}
    >
      {!token ? (
        <View className="mt-6 rounded-[24px] bg-[#F7F7F8] px-5 py-6">
          <Text className="font-inter-bold text-[18px] text-[#181027]">
            {t('auth.resetLinkRequired')}
          </Text>
          <Text className="mt-2 font-inter text-[14px] leading-[21px] text-[#807B89]">
            {t('auth.resetLinkBody')}
          </Text>
        </View>
      ) : done ? (
        <View className="mt-6 rounded-[24px] bg-[#F7F7F8] px-5 py-6">
          <Text className="font-inter-bold text-[18px] text-[#181027]">
            {t('auth.passwordUpdated')}
          </Text>
          <Text className="mt-2 font-inter text-[14px] leading-[21px] text-[#807B89]">
            {t('auth.passwordUpdatedBody')}
          </Text>
          <Pressable
            accessibilityRole="button"
            className="mt-6 items-center rounded-2xl bg-[#181027] py-4"
            onPress={() => router.replace('/(auth)/sign-in')}
          >
            <Text className="font-inter-semibold text-[15px] text-[#ECECEC]">
              {t('auth.signIn')}
            </Text>
          </Pressable>
        </View>
      ) : (
        <>
          <AuthInput
            label={t('password.new')}
            value={password}
            onChangeText={setPassword}
            placeholder={t('auth.newPasswordPlaceholder')}
            autoComplete="new-password"
            textContentType="newPassword"
            secureTextEntry
            secureVisible={visible}
            onToggleSecure={() => setVisible((value) => !value)}
            error={submitted ? errors.password : ''}
          />
          <AuthInput
            label={t('auth.confirmPassword')}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder={t('auth.repeatPassword')}
            autoComplete="new-password"
            textContentType="newPassword"
            secureTextEntry
            secureVisible={visible}
            onToggleSecure={() => setVisible((value) => !value)}
            error={submitted ? errors.confirmPassword : ''}
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
                {t('password.save')}
              </Text>
            )}
          </Pressable>
        </>
      )}
    </AuthShell>
  );
}
