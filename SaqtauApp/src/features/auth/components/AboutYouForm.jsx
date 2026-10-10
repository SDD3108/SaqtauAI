import useI18n from '@/src/features/localization/hooks/useI18n';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useMemo, useState } from 'react';
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

function defaultBirthDate() {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 18);
  date.setHours(12, 0, 0, 0);
  return date;
}

export default function AboutYouForm({ profile, onSubmit, busy = false }) {
  const { t } = useI18n();
  const initialUnits = profile?.units || 'metric';
  const [name, setName] = useState('');
  const [units, setUnits] = useState(initialUnits);
  const [dateOfBirth, setDateOfBirth] = useState(profile?.dateOfBirth || '');
  const [height, setHeight] = useState(heightFromCm(profile?.heightCm, initialUnits));
  const [weight, setWeight] = useState(weightFromKg(profile?.weightKg, initialUnits));
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [draftDate, setDraftDate] = useState(
    parseLocalDate(profile?.dateOfBirth) || defaultBirthDate(),
  );
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState('');

  const errors = useMemo(() => {
    const limits = PROFILE_LIMITS[units];
    const heightNumber = Number(height);
    const weightNumber = Number(weight);
    const dob = parseLocalDate(dateOfBirth);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    return {
      name: name.trim().length < 2 ? t('auth.enterName') : '',
      dateOfBirth: !dob || dob > today ? t('auth.invalidDob') : '',
      height:
        !Number.isFinite(heightNumber) ||
        heightNumber < limits.height.min ||
        heightNumber > limits.height.max
          ? t('auth.heightRange', { min: limits.height.min, max: limits.height.max, unit: units === 'metric' ? 'cm' : 'in' })
          : '',
      weight:
        !Number.isFinite(weightNumber) ||
        weightNumber < limits.weight.min ||
        weightNumber > limits.weight.max
          ? t('auth.weightRange', { min: limits.weight.min, max: limits.weight.max, unit: units === 'metric' ? 'kg' : 'lb' })
          : '',
    };
  }, [dateOfBirth, height, name, units, weight]);

  const valid = Object.values(errors).every((value) => !value);

  function changeUnits(nextUnits) {
    if (nextUnits === units) {
      return;
    }

    const heightCm = heightToCm(height, units);
    const weightKg = weightToKg(weight, units);

    setUnits(nextUnits);
    setHeight(heightFromCm(heightCm, nextUnits));
    setWeight(weightFromKg(weightKg, nextUnits));
  }

  async function submit() {
    setSubmitted(true);
    setServerError('');

    if (!valid || busy) {
      return;
    }

    try {
      await onSubmit({
        displayName: name.trim(),
        profile: {
          dateOfBirth,
          heightCm: heightToCm(height, units),
          weightKg: weightToKg(weight, units),
          units,
        },
      });
    } catch (error) {
      setServerError(error?.message || t('auth.createError'));
    }
  }

  return (
    <View>
      <View className="mt-5">
        <Text className="mb-2 font-inter-medium text-[15px] text-[#5F5967]">
          {t('auth.name')}
        </Text>
        <View
          className={`min-h-[58px] rounded-2xl border bg-[#F7F6F7] px-4 ${
            submitted && errors.name ? 'border-[#B84747]' : 'border-[#D9D6DC]'
          }`}
        >
          <TextInput
            accessibilityLabel={t('auth.name')}
            className="flex-1 py-4 font-inter text-[17px] text-[#181027]"
            value={name}
            onChangeText={setName}
            placeholder={t('auth.yourName')}
            placeholderTextColor="#A19CA6"
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
            returnKeyType="done"
          />
        </View>
        {submitted && errors.name ? (
          <Text className="mt-2 font-inter text-[13px] text-[#B84747]">
            {errors.name}
          </Text>
        ) : null}
      </View>

      <View className="mt-6">
        <UnitSegmentedControl value={units} onChange={changeUnits} />
      </View>

      <View className="mt-5">
        <Text className="mb-2 font-inter-medium text-[15px] text-[#5F5967]">
          {t('auth.dob')}
        </Text>
        <Pressable
          accessibilityRole="button"
          className={`h-[58px] justify-center rounded-2xl border bg-[#F7F6F7] px-4 ${
            submitted && errors.dateOfBirth ? 'border-[#B84747]' : 'border-[#D9D6DC]'
          }`}
          onPress={() => {
            setDraftDate(parseLocalDate(dateOfBirth) || defaultBirthDate());
            setDatePickerOpen(true);
          }}
        >
          <Text
            className={`font-inter text-[17px] ${
              dateOfBirth ? 'text-[#181027]' : 'text-[#A19CA6]'
            }`}
          >
            {dateOfBirth ? formatDate(dateOfBirth) : t('auth.selectDate')}
          </Text>
        </Pressable>
        {submitted && errors.dateOfBirth ? (
          <Text className="mt-2 font-inter text-[13px] text-[#B84747]">
            {errors.dateOfBirth}
          </Text>
        ) : null}
      </View>

      <ProfileField
        label={t('profile.height')}
        value={height}
        onChangeText={setHeight}
        unit={units === 'metric' ? 'cm' : 'in'}
        placeholder={units === 'metric' ? '170' : '67'}
        error={submitted ? errors.height : ''}
      />

      <ProfileField
        label={t('profile.weight')}
        value={weight}
        onChangeText={setWeight}
        unit={units === 'metric' ? 'kg' : 'lb'}
        placeholder={units === 'metric' ? '65' : '143'}
        error={submitted ? errors.weight : ''}
      />

      {serverError ? (
        <View className="mt-5 rounded-2xl bg-[#F6EAEA] px-4 py-3">
          <Text className="font-inter text-[13px] leading-[19px] text-[#9A3F3F]">
            {serverError}
          </Text>
        </View>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: busy }}
        className={`mt-8 h-14 items-center justify-center rounded-2xl bg-[#181027] active:opacity-90 ${
          busy ? 'opacity-60' : ''
        }`}
        disabled={busy}
        onPress={submit}
      >
        {busy ? (
          <ActivityIndicator color="#ECECEC" />
        ) : (
          <Text className="font-inter-semibold text-[16px] text-[#ECECEC]">
            {t('auth.createAccount')}
          </Text>
        )}
      </Pressable>

      <Modal
        animationType="slide"
        transparent
        visible={datePickerOpen}
        onRequestClose={() => setDatePickerOpen(false)}
      >
        <View className="flex-1 justify-end bg-black/30">
          <Pressable className="flex-1" onPress={() => setDatePickerOpen(false)} />
          <View className="rounded-t-[28px] bg-[#F5F4F5] px-5 pb-8 pt-4">
            <View className="mb-2 flex-row items-center justify-between">
              <Pressable
                className="h-11 justify-center px-2"
                onPress={() => setDatePickerOpen(false)}
              >
                <Text className="font-inter-medium text-[16px] text-[#807B89]">
                  {t('common.cancel')}
                </Text>
              </Pressable>
              <Text className="font-inter-semibold text-[17px] text-[#181027]">
                {t('auth.dob')}
              </Text>
              <Pressable
                className="h-11 justify-center px-2"
                onPress={() => {
                  setDateOfBirth(toLocalDateString(draftDate));
                  setDatePickerOpen(false);
                }}
              >
                <Text className="font-inter-semibold text-[16px] text-[#181027]">
                  {t('common.done')}
                </Text>
              </Pressable>
            </View>

            <DateTimePicker
              display="spinner"
              maximumDate={new Date()}
              mode="date"
              value={draftDate}
              onChange={(_, selectedDate) => {
                if (selectedDate) {
                  setDraftDate(selectedDate);
                }
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
