import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Share,
  Switch,
  Text,
  View,
} from 'react-native';

import DataStaysDeviceIcon from '@/assets/images/data_stays_device.svg';
import ManageIcon from '@/assets/images/manage.svg';
import TrashIcon from '@/assets/images/trash.svg';
import { updateCurrentAccount } from '@/src/features/auth/auth.api';
import { useAuthStore } from '@/src/features/auth/auth.store';
import useI18n from '@/src/features/localization/hooks/useI18n';
import { useOnboardingStore } from '@/src/features/onboarding/onboarding.store';
import SettingsPage from '@/src/features/settings/components/SettingsPage';
import SettingsRow from '@/src/features/settings/components/SettingsRow';
import {
  deleteAccountData,
  exportAccountData,
} from '@/src/features/settings/settings.api';
import {
  DEFAULT_PRIVACY_PREFERENCES,
  buildGuestDataExport,
  clearGuestProfileData,
  clearLocalMeasurementData,
  getLocalPrivacyPreferences,
  saveLocalPrivacyPreferences,
} from '@/src/features/settings/settings.storage';

function PrivacySwitch({ value, disabled, onValueChange, label }) {
  return (
    <Switch
      accessibilityLabel={label}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      value={value}
      disabled={disabled}
      onValueChange={onValueChange}
      trackColor={{ false: '#D6D3DB', true: '#181027' }}
      thumbColor="#F7F7F8"
      ios_backgroundColor="#D6D3DB"
    />
  );
}

export default function PrivacyDataScreen() {
  const { t } = useI18n();
  const isGuest = useAuthStore((state) => state.isGuest);
  const account = useAuthStore((state) => state.account);
  const replaceAccount = useAuthStore((state) => state.replaceAccount);

  const [preferences, setPreferences] = useState(DEFAULT_PRIVACY_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState('');
  const [actionBusy, setActionBusy] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;

    (async () => {
      const local = await getLocalPrivacyPreferences();
      if (!active) return;

      setPreferences({
        share_usage_data:
          account?.settings_data?.share_usage_data ?? local.share_usage_data,
        share_insights:
          account?.settings_data?.share_insights ?? local.share_insights,
      });
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [account?.id, account?.settings_data?.share_insights, account?.settings_data?.share_usage_data]);

  async function updatePreference(key, value) {
    const previous = preferences;
    const next = { ...preferences, [key]: value };
    setPreferences(next);
    setSavingKey(key);
    setMessage('');

    try {
      await saveLocalPrivacyPreferences(next);

      if (!isGuest) {
        const updated = await updateCurrentAccount({
          settings_data: {
            ...(account?.settings_data || {}),
            ...next,
            guest: false,
          },
        });
        await replaceAccount(updated);
      }
    } catch (error) {
      setPreferences(previous);
      setMessage(error?.message || t('privacy.saveError'));
    } finally {
      setSavingKey('');
    }
  }

  async function handleExport() {
    setActionBusy('export');
    setMessage('');

    try {
      const data = isGuest ? await buildGuestDataExport() : await exportAccountData();
      const json = JSON.stringify(data, null, 2);

      await Share.share({
        title: t('privacy.exportTitle'),
        message: json,
      });
    } catch (error) {
      setMessage(error?.message || t('privacy.exportError'));
    } finally {
      setActionBusy('');
    }
  }

  async function performDeleteData() {
    setActionBusy('delete');
    setMessage('');

    try {
      if (!isGuest) {
        await deleteAccountData();
      }

      await clearLocalMeasurementData(account?.id);

      if (isGuest) {
        await clearGuestProfileData();
        useOnboardingStore.setState({
          profileCompleted: false,
          firstCheckInCompleted: false,
          profile: {
            dateOfBirth: null,
            heightCm: null,
            weightKg: null,
            units: 'metric',
          },
        });
      } else {
        useOnboardingStore.setState({ firstCheckInCompleted: false });
      }

      setMessage(t('privacy.deleted'));
    } catch (error) {
      setMessage(error?.message || t('privacy.deleteError'));
    } finally {
      setActionBusy('');
    }
  }

  if (loading) {
    return (
      <SettingsPage title={t('privacy.title')} subtitle={t('privacy.subtitle')}>
        <View className="items-center py-16">
          <ActivityIndicator color="#181027" />
        </View>
      </SettingsPage>
    );
  }

  return (
    <SettingsPage
      title={t('privacy.title')}
      subtitle={t('privacy.subtitle')}
      footer={
        <View className="flex-row items-center justify-center gap-3 px-5">
          <DataStaysDeviceIcon width={28} height={28} />
          <Text className="max-w-[270px] font-inter-medium text-[14px] leading-[20px] text-[#696477]">
            {t('privacy.guestFooter')}
          </Text>
        </View>
      }
    >
      <Text accessibilityRole="header" className="mb-2 ml-1 font-inter-semibold text-[16px] text-[#181027]">
        {t('privacy.sharing')}
      </Text>
      <View className="mb-6 rounded-[22px] bg-[#F7F7F8] px-2 py-1">
        <SettingsRow
          title={t('privacy.shareUsage')}
          subtitle={t('privacy.shareUsageSubtitle')}
          trailing={
            <PrivacySwitch
              label={t('privacy.shareUsage')}
              value={preferences.share_usage_data}
              disabled={Boolean(savingKey)}
              onValueChange={(value) => updatePreference('share_usage_data', value)}
            />
          }
          showChevron={false}
        />
        <View className="mx-3 h-px bg-[#E7E5EA]" />
        <SettingsRow
          title={t('privacy.shareInsights')}
          subtitle={t('privacy.shareInsightsSubtitle')}
          trailing={
            <PrivacySwitch
              label={t('privacy.shareInsights')}
              value={preferences.share_insights}
              disabled={Boolean(savingKey)}
              onValueChange={(value) => updatePreference('share_insights', value)}
            />
          }
          showChevron={false}
        />
      </View>

      <Text accessibilityRole="header" className="mb-2 ml-1 font-inter-semibold text-[16px] text-[#181027]">
        {t('privacy.controls')}
      </Text>
      <View className="rounded-[22px] bg-[#F7F7F8] px-2 py-1">
        <SettingsRow
          title={t('privacy.appPermissions')}
          subtitle={t('privacy.appPermissionsSubtitle')}
          Icon={ManageIcon}
          onPress={() => router.push('/(app)/settings/permissions')}
        />
        <View className="mx-3 h-px bg-[#E7E5EA]" />
        <SettingsRow
          title={t('privacy.export')}
          subtitle={isGuest ? t('privacy.exportGuest') : t('privacy.exportAccount')}
          Icon={DataStaysDeviceIcon}
          disabled={Boolean(actionBusy)}
          onPress={handleExport}
          trailing={
            actionBusy === 'export' ? <ActivityIndicator color="#181027" /> : undefined
          }
        />
        <View className="mx-3 h-px bg-[#E7E5EA]" />
        <SettingsRow
          title={t('privacy.deleteData')}
          subtitle={isGuest ? t('privacy.deleteGuest') : t('privacy.deleteAccount')}
          Icon={TrashIcon}
          danger
          disabled={Boolean(actionBusy)}
          onPress={() => {
            Alert.alert(
              t('privacy.deleteTitle'),
              isGuest ? t('privacy.deleteGuestBody') : t('privacy.deleteAccountBody'),
              [
                { text: t('common.cancel'), style: 'cancel' },
                { text: t('common.delete'), style: 'destructive', onPress: performDeleteData },
              ],
            );
          }}
          trailing={
            actionBusy === 'delete' ? <ActivityIndicator color="#B83A45" /> : undefined
          }
        />
      </View>

      <View className="mt-5 rounded-[18px] bg-white px-4 py-4">
        <Text className="font-inter-medium text-[12px] leading-[18px] text-[#918B9D]">
          {t('privacy.switchNote')}
        </Text>
      </View>

      {message ? (
        <Text accessibilityLiveRegion="polite" className="mt-4 text-center font-inter-medium text-[13px] leading-[18px] text-[#696477]">
          {message}
        </Text>
      ) : null}
    </SettingsPage>
  );
}
