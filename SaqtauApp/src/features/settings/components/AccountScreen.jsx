import useI18n from '@/src/features/localization/hooks/useI18n';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';

import ProfileIcon from '@/assets/images/profile.svg';
import TrashIcon from '@/assets/images/trash.svg';
import { useAuthStore } from '@/src/features/auth/auth.store';
import SettingsPage from '@/src/features/settings/components/SettingsPage';
import SettingsRow from '@/src/features/settings/components/SettingsRow';
import {
  deleteAccount,
  logoutCurrentSession,
} from '@/src/features/settings/settings.api';
import { detachNotificationDevice } from '@/src/services/notifications/push';

export default function AccountScreen() {
  const { t } = useI18n();
  const account = useAuthStore((state) => state.account);
  const isGuest = useAuthStore((state) => state.isGuest);
  const token = useAuthStore((state) => state.token);
  const clearSession = useAuthStore((state) => state.clearSession);
  const createGuest = useAuthStore((state) => state.createGuest);

  const [busy, setBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  if (isGuest) {
    return (
      <SettingsPage
        title={t('account.title')}
        subtitle={t('account.guestSubtitle')}
      >
        <Pressable
          onPress={() => router.replace('/(auth)/sign-in')}
          className="h-[54px] items-center justify-center rounded-[17px] bg-[#181027]"
        >
          <Text className="font-inter-semibold text-[16px] text-white">{t('auth.signIn')}</Text>
        </Pressable>
      </SettingsPage>
    );
  }

  async function becomeFreshGuest({ detach = true } = {}) {
    if (detach && token) {
      try {
        await detachNotificationDevice(token, account?.id);
      } catch {
        // Signing out locally must still work if the network is unavailable.
      }
    }

    await clearSession({ detachDevice: false });
    await createGuest();
    router.replace('/(app)/(tabs)');
  }

  async function handleSignOut() {
    if (busy) return;

    setBusy(true);
    try {
      if (token) {
        try {
          await detachNotificationDevice(token, account?.id);
        } catch {
          // Best effort. A future push registration re-binds the device token.
        }
      }

      try {
        await logoutCurrentSession();
      } catch {
        // Offline logout still clears the local credential.
      }

      await clearSession({ detachDevice: false });
      await createGuest();
      router.replace('/(app)/(tabs)');
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteAccount() {
    if (busy) return;

    setDeleteError('');
    setBusy(true);

    try {
      await deleteAccount(password);
      setDeleteOpen(false);
      setPassword('');
      await becomeFreshGuest({ detach: false });
    } catch (error) {
      setDeleteError(error?.message || t('account.deleteError'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <SettingsPage
        title={t('account.title')}
        subtitle={t('settings.accountSubtitle')}
      >
        <Text className="mb-2 ml-1 font-inter-semibold text-[15px] text-[#181027]">
          {t('account.yourAccount')}
        </Text>
        <View className="mb-6 rounded-[22px] bg-[#F7F7F8] px-2 py-1">
          <SettingsRow
            title={account?.display_name || t('account.saqtauAccount')}
            subtitle={account?.email || t('account.noEmail')}
            Icon={ProfileIcon}
            showChevron={false}
          />
        </View>

        <Text className="mb-2 ml-1 font-inter-semibold text-[15px] text-[#181027]">
          {t('account.security')}
        </Text>
        <View className="mb-6 rounded-[22px] bg-[#F7F7F8] px-2 py-1">
          <SettingsRow
            title={t('account.changePassword')}
            subtitle={t('account.changePasswordSubtitle')}
            Icon={ProfileIcon}
            onPress={() => router.push('/(app)/settings/change-password')}
          />
        </View>

        <Text className="mb-2 ml-1 font-inter-semibold text-[15px] text-[#181027]">
          {t('account.actions')}
        </Text>
        <View className="rounded-[22px] bg-[#F7F7F8] px-2 py-1">
          <SettingsRow
            title={t('account.signOut')}
            subtitle={t('account.signOutSubtitle')}
            Icon={ProfileIcon}
            disabled={busy}
            onPress={() => {
              Alert.alert(
                t('account.signOutTitle'),
                t('account.signOutBody'),
                [
                  { text: t('common.cancel'), style: 'cancel' },
                  { text: t('account.signOut'), onPress: handleSignOut },
                ],
              );
            }}
          />
          <View className="mx-3 h-px bg-[#E7E5EA]" />
          <SettingsRow
            title={t('account.delete')}
            subtitle={t('account.deleteSubtitle')}
            Icon={TrashIcon}
            danger
            disabled={busy}
            onPress={() => setDeleteOpen(true)}
          />
        </View>
      </SettingsPage>

      <Modal
        visible={deleteOpen}
        transparent
        animationType="fade"
        onRequestClose={() => !busy && setDeleteOpen(false)}
      >
        <View className="flex-1 justify-end bg-black/30 px-4 pb-8">
          <View className="w-full max-w-[520px] self-center rounded-[26px] bg-[#F7F7F8] p-5">
            <Text className="font-inter-bold text-[22px] text-[#181027]">
              {t('account.deleteTitle')}
            </Text>
            <Text className="mt-2 font-inter-medium text-[14px] leading-[21px] text-[#7F7988]">
              {t('account.deleteConfirmBody')}
            </Text>

            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder={t('account.passwordPlaceholder')}
              placeholderTextColor="#A6A1AD"
              secureTextEntry
              autoCapitalize="none"
              className="mt-5 h-[54px] rounded-[16px] bg-white px-4 font-inter-medium text-[16px] text-[#181027]"
            />

            {deleteError ? (
              <Text className="mt-3 font-inter-medium text-[13px] leading-[18px] text-[#B83A45]">
                {deleteError}
              </Text>
            ) : null}

            <View className="mt-5 flex-row gap-3">
              <Pressable
                disabled={busy}
                onPress={() => {
                  setDeleteOpen(false);
                  setPassword('');
                  setDeleteError('');
                }}
                className="h-[52px] flex-1 items-center justify-center rounded-[16px] bg-white"
              >
                <Text className="font-inter-semibold text-[15px] text-[#181027]">{t('common.cancel')}</Text>
              </Pressable>
              <Pressable
                disabled={busy || !password}
                onPress={handleDeleteAccount}
                className="h-[52px] flex-1 items-center justify-center rounded-[16px] bg-[#B83A45] disabled:opacity-50"
              >
                {busy ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="font-inter-semibold text-[15px] text-white">{t('common.delete')}</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
