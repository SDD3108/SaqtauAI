import { exportMeasurementReport } from '@/src/features/settings/export/exportReport';
import useI18n from '@/src/features/localization/hooks/useI18n';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/src/features/auth/auth.store';
import {
  deleteAccount,
  exportAccountData,
  logoutCurrentSession,
} from '@/src/features/settings/settings.api';
import { detachNotificationDevice } from '@/src/services/notifications/push';
// Screen-specific layout keeps the other settings screens unchanged.
function AccountPage({ title, children, backDisabled = false }) {
  const { t } = useI18n();
  return (
    <SafeAreaView className="flex-1 bg-[#ECECEC]" edges={['top', 'bottom', 'left', 'right']}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 18, paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ width: '100%', maxWidth: 560, flex: 1, alignSelf: 'center' }}>
          <View className="mb-7 mt-3 flex-row items-center">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('ai.goBack')}
              accessibilityState={{ disabled: backDisabled }}
              disabled={backDisabled}
              onPress={() => router.back()}
              className="h-11 w-11 items-center justify-center active:opacity-60 disabled:opacity-50"
            >
              <ChevronLeft size={30} strokeWidth={2.2} color="#8E879B" />
            </Pressable>
            <Text accessibilityRole="header" className="flex-1 text-center font-inter-bold text-[23px] leading-[30px] tracking-[-0.6px] text-[#181027]">
              {title}
            </Text>
            <View className="w-11" />
          </View>
          {children}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
function AccountRow({ title, subtitle, onPress, disabled = false, loading = false, accessibilityLabel }) {
  const Wrapper = onPress ? Pressable : View;
  return (
    <Wrapper
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={onPress ? { disabled, busy: loading } : undefined}
      disabled={onPress ? disabled : undefined}
      onPress={onPress}
      className="min-h-[85px] flex-row items-center gap-3 px-4 py-4 active:opacity-65 disabled:opacity-50"
    >
      <View className="min-w-0 flex-1">
        <Text className="font-inter-semibold text-[17px] leading-[23px] tracking-[-0.25px] text-[#302C3B]">
          {title}
        </Text>
        <Text selectable={!onPress} className="mt-2 font-inter-medium text-[14px] leading-[20px] text-[#A6A1AD]">
          {subtitle}
        </Text>
      </View>
      {loading ? <ActivityIndicator color="#8E879B" /> : onPress ? <ChevronRight size={21} strokeWidth={2.2} color="#8E879B" /> : null}
    </Wrapper>
  );
}
export default function AccountScreen() {
  const { t, language } = useI18n();
  const insets = useSafeAreaInsets();
  const account = useAuthStore((state) => state.account);
  const isGuest = useAuthStore((state) => state.isGuest);
  const token = useAuthStore((state) => state.token);
  const clearSession = useAuthStore((state) => state.clearSession);
  const createGuest = useAuthStore((state) => state.createGuest);
  const [busy, setBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const actionBusy = busy || exporting;
  if (isGuest) {
    return (
      <AccountPage title={t('account.title')}>
        <View className="rounded-[16px] bg-[#F7F7F8] p-5">
          <Text className="mb-5 font-inter-medium text-[15px] leading-[22px] text-[#8E879B]">
            {t('account.guestSubtitle')}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace('/(auth)/sign-in')}
            className="min-h-[54px] items-center justify-center rounded-[17px] bg-[#181027] px-4 py-3 active:opacity-75"
          >
            <Text className="font-inter-semibold text-[16px] text-white">{t('auth.signIn')}</Text>
          </Pressable>
        </View>
      </AccountPage>
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
  async function handleExport() {
    if (actionBusy) return;
    setExporting(true);
    setExportError('');
    try {
      // Reuse the same account export API and share format as PrivacyDataScreen.
      const data = await exportAccountData();
      await exportMeasurementReport(data, { language });
    } catch (error) {
      setExportError(error?.message || t('privacy.exportError'));
    } finally {
      setExporting(false);
    }
  }
  return (
    <>
      <AccountPage title={t('account.title')} backDisabled={actionBusy}>
        <Text accessibilityRole="header" className="mb-5 px-2 font-inter-semibold text-[17px] leading-[24px] tracking-[-0.25px] text-[#302C3B]">
          {t('account.information')}
        </Text>
        <View className="rounded-[16px] bg-[#F7F7F8] py-1">
          <AccountRow
            title={t('auth.email')}
            subtitle={account?.email || t('account.noEmail')}
            accessibilityLabel={`${t('auth.email')}: ${account?.email || t('account.noEmail')}`}
          />
          <AccountRow
            title={t('auth.password')}
            subtitle="••••••••••"
            accessibilityLabel={t('account.changePassword')}
            disabled={actionBusy}
            onPress={() => router.push('/(app)/settings/change-password')}
          />
        </View>
        <Text accessibilityRole="header" className="mb-5 mt-8 px-2 font-inter-semibold text-[17px] leading-[24px] tracking-[-0.25px] text-[#302C3B]">
          {t('account.actions')}
        </Text>
        <View className="rounded-[16px] bg-[#F3F3F5] py-1">
          <AccountRow
            title={t('privacy.export')}
            subtitle={t('account.exportDescription')}
            disabled={actionBusy}
            loading={exporting}
            onPress={handleExport}
          />
          <AccountRow
            title={t('account.signOut')}
            subtitle={t('account.signOutDescription')}
            disabled={actionBusy}
            loading={busy && !deleteOpen}
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
        </View>
        {exportError ? (
          <Text accessibilityLiveRegion="polite" className="mt-3 px-3 font-inter-medium text-[13px] leading-[19px] text-[#B83A45]">
            {exportError}
          </Text>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${t('account.delete')}. ${t('account.deleteWarning')}`}
          disabled={actionBusy}
          onPress={() => setDeleteOpen(true)}
          className="mt-9 min-h-[144px] flex-row items-center gap-3 rounded-[19px] border-2 border-[#ADA8B5] px-4 py-5 active:opacity-65 disabled:opacity-50"
        >
          <View className="min-w-0 flex-1">
            <Text className="font-inter-semibold text-[17px] leading-[23px] tracking-[-0.25px] text-[#302C3B]">
              {t('account.delete')}
            </Text>
            <Text className="mt-4 font-inter-medium text-[14px] leading-[20px] text-[#302C3B]">
              {t('account.deleteDescription')}
            </Text>
            <Text className="mt-4 font-inter-medium text-[14px] leading-[20px] text-[#302C3B]">
              {t('account.deleteWarning')}
            </Text>
          </View>
          <ChevronRight size={21} strokeWidth={2.2} color="#8E879B" />
        </Pressable>
      </AccountPage>
      <Modal
        visible={deleteOpen}
        transparent
        animationType="fade"
        onRequestClose={() => !busy && setDeleteOpen(false)}
      >
        <KeyboardAvoidingView className="flex-1 bg-black/30" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end', paddingHorizontal: 16, paddingTop: insets.top + 16, paddingBottom: Math.max(insets.bottom, 16) }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="w-full max-w-[520px] self-center rounded-[26px] bg-[#F7F7F8] p-5">
              <Text accessibilityRole="header" className="font-inter-bold text-[22px] leading-[29px] text-[#181027]">
                {t('account.deleteTitle')}
              </Text>
              <Text className="mt-2 font-inter-medium text-[14px] leading-[21px] text-[#7F7988]">
                {t('account.deleteConfirmBody')}
              </Text>
              <TextInput
                accessibilityLabel={t('account.passwordPlaceholder')}
                value={password}
                onChangeText={setPassword}
                placeholder={t('account.passwordPlaceholder')}
                placeholderTextColor="#A6A1AD"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!busy}
                className="mt-5 min-h-[54px] rounded-[16px] bg-white px-4 py-3 font-inter-medium text-[16px] text-[#181027]"
              />
              {deleteError ? (
                <Text accessibilityLiveRegion="polite" className="mt-3 font-inter-medium text-[13px] leading-[18px] text-[#B83A45]">
                  {deleteError}
                </Text>
              ) : null}
              <View className="mt-5 flex-row gap-3">
                <Pressable
                  accessibilityRole="button"
                  disabled={busy}
                  onPress={() => {
                    setDeleteOpen(false);
                    setPassword('');
                    setDeleteError('');
                  }}
                  className="min-h-[52px] flex-1 items-center justify-center rounded-[16px] bg-white px-2 py-3 active:opacity-70 disabled:opacity-50"
                >
                  <Text className="text-center font-inter-semibold text-[15px] text-[#181027]">{t('common.cancel')}</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  disabled={busy || !password}
                  onPress={handleDeleteAccount}
                  className="min-h-[52px] flex-1 items-center justify-center rounded-[16px] bg-[#B83A45] px-2 py-3 active:opacity-70 disabled:opacity-50"
                >
                  {busy ? <ActivityIndicator color="#FFFFFF" /> : <Text className="text-center font-inter-semibold text-[15px] text-white">{t('common.delete')}</Text>}
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}
