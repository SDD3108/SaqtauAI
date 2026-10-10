import useI18n from '@/src/features/localization/hooks/useI18n';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';

import ProfileField from '@/src/components/ui/ProfileField';
import UnitSegmentedControl from '@/src/components/ui/UnitSegmentedControl';
import { useAuthStore } from '@/src/features/auth/auth.store';
import { updateCurrentAccount } from '@/src/features/auth/auth.api';
import {
  PROFILE_LIMITS,
  formatDate,
  heightFromCm,
  heightToCm,
  parseLocalDate,
  toLocalDateString,
  weightFromKg,
  weightToKg,
} from '@/src/features/check-in/utils/profile';
import { useOnboardingStore } from '@/src/features/onboarding/onboarding.store';
import SettingsPage from '@/src/features/settings/components/SettingsPage';

export default function ProfileSettingsScreen() {
  const { t } = useI18n();
  const fieldError = (number, limits, label) => {
    if (!Number.isFinite(number)) return t('profile.required', { label });
    if (number < limits.min || number > limits.max) return t('profile.range', { label, min: limits.min, max: limits.max });
    return '';
  };
  const isGuest = useAuthStore((state) => state.isGuest);
  const account = useAuthStore((state) => state.account);
  const replaceAccount = useAuthStore((state) => state.replaceAccount);
  const onboardingProfile = useOnboardingStore((state) => state.profile);
  const saveLocalProfile = useOnboardingStore((state) => state.saveProfile);

  const source = useMemo(() => {
    const accountProfile = account?.profile_data || {};
    return {
      dateOfBirth:
        accountProfile.dateOfBirth || onboardingProfile?.dateOfBirth || null,
      heightCm:
        accountProfile.heightCm ?? onboardingProfile?.heightCm ?? null,
      weightKg:
        accountProfile.weightKg ?? onboardingProfile?.weightKg ?? null,
      units:
        accountProfile.units ||
        account?.settings_data?.units ||
        onboardingProfile?.units ||
        'metric',
    };
  }, [account, onboardingProfile]);

  const [displayName, setDisplayName] = useState(account?.display_name || '');
  const [dateOfBirth, setDateOfBirth] = useState(source.dateOfBirth);
  const [units, setUnits] = useState(source.units);
  const [height, setHeight] = useState(heightFromCm(source.heightCm, source.units));
  const [weight, setWeight] = useState(weightFromKg(source.weightKg, source.units));
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [draftDate, setDraftDate] = useState(
    parseLocalDate(source.dateOfBirth) || new Date(2000, 0, 1, 12),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');

  useEffect(() => {
    setDisplayName(account?.display_name || '');
  }, [account?.display_name]);

  function handleUnits(nextUnits) {
    if (nextUnits === units) return;

    const heightCm = heightToCm(height, units);
    const weightKg = weightToKg(weight, units);

    setUnits(nextUnits);
    setHeight(heightFromCm(heightCm, nextUnits));
    setWeight(weightFromKg(weightKg, nextUnits));
  }

  async function handleSave() {
    setError('');
    setSaved('');

    const limits = PROFILE_LIMITS[units];
    const heightNumber = Number(height);
    const weightNumber = Number(weight);

    const heightError = fieldError(heightNumber, limits.height, t('profile.height'));
    if (heightError) {
      setError(heightError);
      return;
    }

    const weightError = fieldError(weightNumber, limits.weight, t('profile.weight'));
    if (weightError) {
      setError(weightError);
      return;
    }

    if (!dateOfBirth) {
      setError(t('profile.dobRequired'));
      return;
    }

    const nextProfile = {
      dateOfBirth,
      heightCm: heightToCm(heightNumber, units),
      weightKg: weightToKg(weightNumber, units),
      units,
    };

    setSaving(true);
    try {
      if (!isGuest) {
        const updated = await updateCurrentAccount({
          display_name: displayName.trim(),
          profile_data: {
            ...(account?.profile_data || {}),
            ...nextProfile,
          },
          settings_data: {
            ...(account?.settings_data || {}),
            units,
            guest: false,
          },
        });
        await replaceAccount(updated);
      }

      await saveLocalProfile(nextProfile);
      setSaved(t('profile.saved'));
    } catch (requestError) {
      setError(requestError?.message || t('profile.saveError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <SettingsPage
        title={t('profile.title')}
        subtitle={isGuest ? t('profile.guestSubtitle') : t('profile.accountSubtitle')}
      >
        <View className="rounded-[22px] bg-[#F7F7F8] p-4">
          {!isGuest ? (
            <View className="mb-4">
              <Text className="mb-2 ml-1 font-inter-semibold text-[14px] text-[#181027]">
                {t('profile.name')}
              </Text>
              <TextInput
                value={displayName}
                onChangeText={setDisplayName}
                placeholder={t('profile.yourName')}
                placeholderTextColor="#A6A1AD"
                className="h-[54px] rounded-[16px] bg-white px-4 font-inter-medium text-[16px] text-[#181027]"
              />
            </View>
          ) : null}

          <Pressable onPress={() => setDatePickerOpen(true)}>
            <ProfileField
              label={t('profile.dob')}
              value={dateOfBirth ? formatDate(dateOfBirth) : ''}
              placeholder={t('profile.chooseDate')}
              editable={false}
            />
          </Pressable>

          <View className="my-4">
            <UnitSegmentedControl value={units} onChange={handleUnits} />
          </View>

          <ProfileField
            label={units === 'metric' ? t('profile.heightCm') : t('profile.heightIn')}
            value={height}
            onChangeText={setHeight}
            keyboardType="decimal-pad"
            placeholder={units === 'metric' ? '175' : '69'}
          />

          <View className="h-4" />

          <ProfileField
            label={units === 'metric' ? t('profile.weightKg') : t('profile.weightLb')}
            value={weight}
            onChangeText={setWeight}
            keyboardType="decimal-pad"
            placeholder={units === 'metric' ? '70' : '154'}
          />

          {error ? (
            <Text className="mt-4 font-inter-medium text-[13px] leading-[18px] text-[#B83A45]">
              {error}
            </Text>
          ) : null}
          {saved ? (
            <Text className="mt-4 font-inter-medium text-[13px] leading-[18px] text-[#39724B]">
              {saved}
            </Text>
          ) : null}

          <Pressable
            disabled={saving}
            onPress={handleSave}
            className="mt-5 h-[54px] items-center justify-center rounded-[17px] bg-[#181027] active:opacity-80 disabled:opacity-60"
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="font-inter-semibold text-[16px] text-white">{t('common.saveChanges')}</Text>
            )}
          </Pressable>
        </View>
      </SettingsPage>

      <Modal
        visible={datePickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDatePickerOpen(false)}
      >
        <View className="flex-1 justify-end bg-black/25 px-4 pb-8">
          <View className="w-full max-w-[520px] self-center rounded-[26px] bg-[#F7F7F8] p-4">
            <View className="mb-2 flex-row items-center justify-between px-2">
              <Pressable onPress={() => setDatePickerOpen(false)}>
                <Text className="font-inter-semibold text-[15px] text-[#918B9D]">{t('common.cancel')}</Text>
              </Pressable>
              <Text className="font-inter-semibold text-[16px] text-[#181027]">{t('profile.dob')}</Text>
              <Pressable
                onPress={() => {
                  setDateOfBirth(toLocalDateString(draftDate));
                  setDatePickerOpen(false);
                }}
              >
                <Text className="font-inter-semibold text-[15px] text-[#181027]">{t('common.done')}</Text>
              </Pressable>
            </View>
            <DateTimePicker
              value={draftDate}
              mode="date"
              display="spinner"
              maximumDate={new Date()}
              onChange={(_, date) => date && setDraftDate(date)}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}
