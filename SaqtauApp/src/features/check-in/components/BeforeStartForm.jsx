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
import { SafeAreaView } from 'react-native-safe-area-context';

import ProfileField from '@/src/components/ui/ProfileField';
import UnitSegmentedControl from '@/src/components/ui/SegmentedControl';
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
          ? 'Choose a valid date of birth'
          : null,
      height:
        !Number.isFinite(heightNumber) ||
        heightNumber < limits.height.min ||
        heightNumber > limits.height.max
          ? `Enter ${limits.height.min}–${limits.height.max} ${
              units === 'metric' ? 'cm' : 'in'
            }`
          : null,
      weight:
        !Number.isFinite(weightNumber) ||
        weightNumber < limits.weight.min ||
        weightNumber > limits.weight.max
          ? `Enter ${limits.weight.min}–${limits.weight.max} ${
              units === 'metric' ? 'kg' : 'lb'
            }`
          : null,
    };
  }, [dateOfBirth, height, units, weight]);

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
    <SafeAreaView className="flex-1 bg-[#ECECEC]" edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 px-6 pb-5 pt-8">
            <View>
              <Text className="font-inter-extrabold text-[34px] leading-[40px] tracking-[-1.1px] text-[#181027]">
                Before we start
              </Text>

              <Text className="font-inter mt-3 max-w-[340px] text-[17px] leading-6 text-[#807B89]">
                A few details help SaqtauAI make your check-in more personal.
              </Text>
            </View>

            <View className="mt-9">
              <UnitSegmentedControl value={units} onChange={changeUnits} />

              <View className="mt-5">
                <Text className="font-inter-medium mb-2 text-[15px] text-[#5F5967]">
                  Date of birth
                </Text>

                <Pressable
                  accessibilityRole="button"
                  className={`h-[58px] justify-center rounded-2xl border bg-[#F5F4F5] px-4 ${
                    submitted && validation.dateOfBirth
                      ? 'border-[#B84747]'
                      : 'border-[#D9D6DC]'
                  }`}
                  onPress={openDatePicker}
                >
                  <Text
                    className={`font-inter text-[17px] ${
                      dateOfBirth ? 'text-[#181027]' : 'text-[#A19CA6]'
                    }`}
                  >
                    {dateOfBirth ? formatDate(dateOfBirth) : 'Select date'}
                  </Text>
                </Pressable>

                {submitted && validation.dateOfBirth ? (
                  <Text className="font-inter mt-2 text-[13px] text-[#B84747]">
                    {validation.dateOfBirth}
                  </Text>
                ) : null}
              </View>

              <ProfileField
                label="Height"
                value={height}
                onChangeText={setHeight}
                unit={units === 'metric' ? 'cm' : 'in'}
                placeholder={units === 'metric' ? '170' : '67'}
                error={submitted ? validation.height : null}
              />

              <ProfileField
                label="Weight"
                value={weight}
                onChangeText={setWeight}
                unit={units === 'metric' ? 'kg' : 'lb'}
                placeholder={units === 'metric' ? '65' : '143'}
                error={submitted ? validation.weight : null}
              />
            </View>

            <View className="flex-1" />

            <Pressable
              accessibilityRole="button"
              className={`mt-10 h-14 items-center justify-center rounded-2xl bg-[#181027] active:opacity-90 ${
                submitted && !isValid ? 'opacity-50' : 'opacity-100'
              }`}
              onPress={handleContinue}
            >
              <Text className="font-inter-medium text-[16px] text-[#ECECEC]">
                Continue
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

          <View className="rounded-t-[28px] bg-[#F5F4F5] px-5 pb-8 pt-4">
            <View className="mb-2 flex-row items-center justify-between">
              <Pressable
                className="h-11 justify-center px-2"
                onPress={() => setDatePickerOpen(false)}
              >
                <Text className="font-inter-medium text-[16px] text-[#807B89]">
                  Cancel
                </Text>
              </Pressable>

              <Text className="font-inter-semibold text-[17px] text-[#181027]">
                Date of birth
              </Text>

              <Pressable className="h-11 justify-center px-2" onPress={saveDate}>
                <Text className="font-inter-semibold text-[16px] text-[#181027]">
                  Done
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
