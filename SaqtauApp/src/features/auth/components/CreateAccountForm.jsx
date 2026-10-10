import useI18n from '@/src/features/localization/hooks/useI18n';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import AuthInput from '@/src/features/auth/components/AuthInput';

export default function CreateAccountForm({ onContinue }) {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const errors = useMemo(() => {
    const normalizedEmail = email.trim();

    return {
      email:
        !normalizedEmail || !/^\S+@\S+\.\S+$/.test(normalizedEmail)
          ? t('auth.invalidEmail')
          : '',
      password:
        password.length < 8 ? t('auth.passwordMin') : '',
      confirmPassword:
        !confirmPassword || confirmPassword !== password
          ? t('auth.passwordMismatch')
          : '',
    };
  }, [confirmPassword, email, password]);

  const valid = !errors.email && !errors.password && !errors.confirmPassword;

  function submit() {
    setSubmitted(true);

    if (!valid) {
      return;
    }

    onContinue(email.trim().toLowerCase(), password);
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
        placeholder={t('auth.newPasswordPlaceholder')}
        autoComplete="new-password"
        textContentType="newPassword"
        secureTextEntry
        secureVisible={passwordVisible}
        onToggleSecure={() => setPasswordVisible((value) => !value)}
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
        secureVisible={passwordVisible}
        onToggleSecure={() => setPasswordVisible((value) => !value)}
        error={submitted ? errors.confirmPassword : ''}
        returnKeyType="done"
        onSubmitEditing={submit}
      />

      <Text className="mt-4 font-inter text-[12px] leading-[18px] text-[#918B9D]">
        {t('auth.guestCheckins')}
      </Text>

      <Pressable
        accessibilityRole="button"
        className="mt-7 h-14 items-center justify-center rounded-2xl bg-[#181027] active:opacity-90"
        onPress={submit}
      >
        <Text className="font-inter-semibold text-[16px] text-[#ECECEC]">
          {t('auth.continue')}
        </Text>
      </Pressable>
    </View>
  );
}
