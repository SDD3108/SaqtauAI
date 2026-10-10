import useI18n from '@/src/features/localization/hooks/useI18n';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import AuthInput from '@/src/features/auth/components/AuthInput';

export default function SignInForm({ onSubmit, onForgotPassword, busy = false }) {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState('');

  const errors = useMemo(() => {
    const normalizedEmail = email.trim();

    return {
      email:
        !normalizedEmail || !/^\S+@\S+\.\S+$/.test(normalizedEmail)
          ? t('auth.invalidEmail')
          : '',
      password: password ? '' : t('auth.enterPassword'),
    };
  }, [email, password]);

  const valid = !errors.email && !errors.password;

  async function submit() {
    setSubmitted(true);
    setServerError('');

    if (!valid || busy) {
      return;
    }

    try {
      await onSubmit(email.trim().toLowerCase(), password);
    } catch (error) {
      setServerError(error?.message || t('auth.signInError'));
    }
  }

  return (
    <View>
      <AuthInput
        label={t('auth.email')}
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoComplete="email"
        textContentType="emailAddress"
        error={submitted ? errors.email : ''}
      />

      <AuthInput
        label={t('auth.password')}
        value={password}
        onChangeText={setPassword}
        placeholder={t('auth.passwordPlaceholder')}
        autoComplete="current-password"
        textContentType="password"
        secureTextEntry
        secureVisible={passwordVisible}
        onToggleSecure={() => setPasswordVisible((value) => !value)}
        error={submitted ? errors.password : ''}
        returnKeyType="done"
        onSubmitEditing={submit}
      />

      <Pressable
        accessibilityRole="button"
        className="self-end py-3"
        onPress={onForgotPassword}
      >
        <Text className="font-inter-semibold text-[14px] text-[#5F5967]">
          {t('auth.forgotPassword')}
        </Text>
      </Pressable>

      {serverError ? (
        <View className="mt-2 rounded-2xl bg-[#F6EAEA] px-4 py-3">
          <Text className="font-inter text-[13px] leading-[19px] text-[#9A3F3F]">
            {serverError}
          </Text>
        </View>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: busy }}
        className={`mt-5 h-14 items-center justify-center rounded-2xl bg-[#181027] active:opacity-90 ${
          busy ? 'opacity-60' : ''
        }`}
        disabled={busy}
        onPress={submit}
      >
        {busy ? (
          <ActivityIndicator color="#ECECEC" />
        ) : (
          <Text className="font-inter-semibold text-[16px] text-[#ECECEC]">
            {t('auth.signIn')}
          </Text>
        )}
      </Pressable>
    </View>
  );
}
