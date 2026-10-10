import DateTimePicker from '@react-native-community/datetimepicker';
import { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import IntroductionLogo from '@/assets/images/check-in/introduction-logo.svg';
import PrivateIcon from '@/assets/images/private.svg';
import ProfileField from '@/src/components/ui/ProfileField';
import useI18n from '@/src/features/localization/hooks/useI18n';
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

function getDefaultDate() {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 18);
  date.setHours(12, 0, 0, 0);
  return date;
}

export default function BeforeStartForm({ profile, onContinue }) {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const [units, setUnits] = useState(profile.units || 'metric');
  const [dateOfBirth, setDateOfBirth] = useState(profile.dateOfBirth || '');
  const [height, setHeight] = useState(
    heightFromCm(profile.heightCm, profile.units || 'metric'),
  );
  const [weight, setWeight] = useState(
    weightFromKg(profile.weightKg, profile.units || 'metric'),
  );
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [draftDate, setDraftDate] = useState(
    parseLocalDate(profile.dateOfBirth) || getDefaultDate(),
  );
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!profile.dateOfBirth) {
      return;
    }

    const parsed = parseLocalDate(profile.dateOfBirth);

    if (parsed) {
      setDraftDate(parsed);
    }
  }, [profile.dateOfBirth]);

  const validation = useMemo(() => {
    const heightNumber = Number(height);
    const weightNumber = Number(weight);
    const limits = PROFILE_LIMITS[units];

    const dobDate = parseLocalDate(dateOfBirth);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    return {
      dateOfBirth:
        !dobDate || dobDate > today
          ? t('checkin.validDob')
          : null,
      height:
        !Number.isFinite(heightNumber) ||
        heightNumber < limits.height.min ||
        heightNumber > limits.height.max
          ? t('auth.heightRange', { min: limits.height.min, max: limits.height.max, unit: units === 'metric' ? 'cm' : 'in' })
          : null,
      weight:
        !Number.isFinite(weightNumber) ||
        weightNumber < limits.weight.min ||
        weightNumber > limits.weight.max
          ? t('auth.weightRange', { min: limits.weight.min, max: limits.weight.max, unit: units === 'metric' ? 'kg' : 'lb' })
          : null,
    };
  }, [dateOfBirth, height, t, units, weight]);

  const isValid = !validation.dateOfBirth && !validation.height && !validation.weight;

  const changeUnits = (nextUnits) => {
    if (nextUnits === units) {
      return;
    }

    const currentHeightCm = heightToCm(height, units);
    const currentWeightKg = weightToKg(weight, units);

    setUnits(nextUnits);
    setHeight(heightFromCm(currentHeightCm, nextUnits));
    setWeight(weightFromKg(currentWeightKg, nextUnits));
  };

  const openDatePicker = () => {
    setDraftDate(parseLocalDate(dateOfBirth) || getDefaultDate());
    setDatePickerOpen(true);
  };

  const saveDate = () => {
    setDateOfBirth(toLocalDateString(draftDate));
    setDatePickerOpen(false);
  };

  const handleContinue = () => {
    setSubmitted(true);

    if (!isValid) {
      return;
    }

    onContinue({
      dateOfBirth,
      heightCm: heightToCm(height, units),
      weightKg: weightToKg(weight, units),
      units,
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-[#ECECEC]" edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View className="flex-1 px-6 pb-4 pt-12" style={{ width: '100%', maxWidth: 560, alignSelf: 'center' }}>
            <Text accessibilityRole="header" className="font-inter-extrabold text-[37px] leading-[44px] tracking-[-1.9px] text-[#181027]">
              {t('checkin.beforeTitle')}
            </Text>
            <View className="mt-7 flex-row items-center gap-3">
              <View className="h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#181027]">
                <IntroductionLogo width={29} height={28} />
              </View>
              <View className="min-h-[52px] shrink rounded-[24px] rounded-bl-[3px] bg-[#D9D9D9] px-5 py-4">
                <Text className="font-inter-semibold text-[16px] leading-[22px] tracking-[-0.7px] text-[#181027]">
                  {t('checkin.tellAboutYou')}
                </Text>
              </View>
            </View>

            <View className="mt-8">
              <Text className="mb-1.5 font-inter-semibold text-[17px] leading-[23px] tracking-[-0.5px] text-black">
                {t('profile.dob')}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${t('profile.dob')}: ${dateOfBirth ? formatDate(dateOfBirth) : t('checkin.selectDate')}`}
                className={`min-h-[48px] justify-center rounded-[7px] border px-2.5 py-2.5 ${submitted && validation.dateOfBirth ? 'border-[#B84747]' : 'border-[#D2CFD6]'}`}
                onPress={openDatePicker}
              >
                <Text className={`font-inter-semibold text-[17px] leading-[23px] tracking-[-0.6px] ${dateOfBirth ? 'text-[#181027]' : 'text-[#807B89]'}`}>
                  {dateOfBirth ? formatDate(dateOfBirth) : t('checkin.selectDate')}
                </Text>
              </Pressable>
              {submitted && validation.dateOfBirth ? <Text accessibilityLiveRegion="polite" className="mt-2 font-inter text-[13px] text-[#B84747]">{validation.dateOfBirth}</Text> : null}
              <ProfileField
                appearance="beforeStart"
                label={t('profile.height')}
                value={height}
                onChangeText={setHeight}
                unit={units === 'metric' ? 'cm' : 'in'}
                placeholder={t('checkin.enterHeight')}
                error={submitted ? validation.height : null}
              />
              <ProfileField
                appearance="beforeStart"
                label={t('profile.weight')}
                value={weight}
                onChangeText={setWeight}
                unit={units === 'metric' ? 'kg' : 'lb'}
                placeholder={t('checkin.enterWeight')}
                error={submitted ? validation.weight : null}
              />
              <View className="mt-7">
                <UnitSegmentedControl appearance="beforeStart" value={units} onChange={changeUnits} />
              </View>
            </View>

            <View className="flex-1" />
            <View className="mb-10 mt-10 flex-row items-center justify-center gap-2">
              <PrivateIcon width={20} height={22} />
              <Text className="shrink text-center font-inter-semibold text-[15px] leading-[21px] tracking-[-0.6px] text-[#8E879B]">
                {t('checkin.informationPrivate')}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              className={`min-h-[60px] items-center justify-center rounded-[17px] bg-[#181027] px-4 py-3 active:opacity-90 ${submitted && !isValid ? 'opacity-50' : 'opacity-100'}`}
              onPress={handleContinue}
            >
              <Text className="text-center font-inter text-[20px] leading-[27px] tracking-[-0.8px] text-[#ECECEC]">
                {t('checkin.continue')}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        animationType="slide"
        transparent
        visible={datePickerOpen}
        onRequestClose={() => setDatePickerOpen(false)}
      >
        <View className="flex-1 justify-end bg-black/30">
          <Pressable
            className="flex-1"
            onPress={() => setDatePickerOpen(false)}
          />

          <View className="w-full max-w-[560px] self-center rounded-t-[28px] bg-[#F5F4F5] px-5 pt-4" style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
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
                {t('profile.dob')}
              </Text>

              <Pressable className="h-11 justify-center px-2" onPress={saveDate}>
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
    </SafeAreaView>
  );
}
