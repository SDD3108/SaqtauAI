import useI18n from '@/src/features/localization/hooks/useI18n';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';

import SettingsPage from '@/src/features/settings/components/SettingsPage';
import { changePassword } from '@/src/features/settings/settings.api';

function PasswordField({ label, value, onChangeText, placeholder }) {
  return (
    <View className="mb-4">
      <Text className="mb-2 ml-1 font-inter-semibold text-[14px] text-[#181027]">
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#A6A1AD"
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        className="h-[54px] rounded-[16px] bg-white px-4 font-inter-medium text-[16px] text-[#181027]"
      />
    </View>
  );
}

export default function ChangePasswordScreen() {
  const { t } = useI18n();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit() {
    setError('');
    setSuccess('');

    if (!currentPassword) {
      setError(t('password.enterCurrent'));
      return;
    }

    if (newPassword.length < 8) {
      setError(t('password.min'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('password.mismatch'));
      return;
    }

    setSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess(t('password.success'));
    } catch (requestError) {
      setError(requestError?.message || t('password.error'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <SettingsPage
      title={t('password.title')}
      subtitle={t('password.subtitle')}
    >
      <View className="rounded-[22px] bg-[#F7F7F8] p-4">
        <PasswordField
          label={t('password.current')}
          value={currentPassword}
          onChangeText={setCurrentPassword}
          placeholder={t('password.currentPlaceholder')}
        />
        <PasswordField
          label={t('password.new')}
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder={t('auth.newPasswordPlaceholder')}
        />
        <PasswordField
          label={t('password.confirm')}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder={t('password.repeatPlaceholder')}
        />

        {error ? (
          <Text className="mb-3 font-inter-medium text-[13px] leading-[18px] text-[#B83A45]">
            {error}
          </Text>
        ) : null}
        {success ? (
          <Text className="mb-3 font-inter-medium text-[13px] leading-[18px] text-[#39724B]">
            {success}
          </Text>
        ) : null}

        <Pressable
          disabled={saving}
          onPress={handleSubmit}
          className="h-[54px] items-center justify-center rounded-[17px] bg-[#181027] active:opacity-80"
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="font-inter-semibold text-[16px] text-white">
              {t('password.save')}
            </Text>
          )}
        </Pressable>
      </View>
    </SettingsPage>
  );
}
