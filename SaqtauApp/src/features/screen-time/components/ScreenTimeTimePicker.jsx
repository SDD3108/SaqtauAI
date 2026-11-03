import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import useI18n from '@/src/features/localization/hooks/useI18n';

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

function timeString(date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function initialDate(value) {
  const match = TIME_PATTERN.exec(String(value || ''));
  // A fixed date avoids today's daylight-saving transition for a recurring time.
  return new Date(2000, 0, 15, match ? Number(match[1]) : 0, match ? Number(match[2]) : 0);
}

function OpenTimePicker({ title, value, onClose, onConfirm }) {
  const { t, locale } = useI18n();
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState(() => initialDate(value));
  const [text, setText] = useState(() => timeString(initialDate(value)));
  const nativePicker = Platform.OS === 'ios' || Platform.OS === 'android';
  const valid = nativePicker || TIME_PATTERN.test(text);

  if (Platform.OS === 'android') {
    return (
      <DateTimePicker
        value={draft}
        mode="time"
        display="default"
        is24Hour
        onChange={(event, date) => {
          if (event.type === 'set' && date) onConfirm(timeString(date));
          else onClose();
        }}
      />
    );
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/30">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.cancel')}
          onPress={onClose}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <View
          accessibilityViewIsModal
          className="w-full max-w-[560px] self-center rounded-t-[26px] bg-[#F7F7F8] px-5 pt-5"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
        >
          <Text accessibilityRole="header" className="font-inter-bold text-[21px] text-[#181027]">
            {title}
          </Text>
          {nativePicker ? (
            <DateTimePicker
              value={draft}
              mode="time"
              display="spinner"
              locale={locale}
              textColor="#181027"
              themeVariant="light"
              style={{ alignSelf: 'center', height: 200 }}
              onChange={(_, date) => { if (date) setDraft(date); }}
            />
          ) : (
            <TextInput
              accessibilityLabel={title}
              value={text}
              onChangeText={setText}
              placeholder="HH:MM"
              maxLength={5}
              autoCorrect={false}
              className="my-5 rounded-[16px] bg-white px-4 py-4 text-center font-inter-semibold text-[24px] text-[#181027]"
            />
          )}
          <View className="mt-3 flex-row gap-3">
            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              className="min-h-[50px] flex-1 items-center justify-center rounded-[16px] bg-white px-3 py-3"
            >
              <Text className="font-inter-semibold text-[15px] text-[#181027]">{t('common.cancel')}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: !valid }}
              disabled={!valid}
              onPress={() => { if (valid) onConfirm(nativePicker ? timeString(draft) : text); }}
              className="min-h-[50px] flex-1 items-center justify-center rounded-[16px] bg-[#181027] px-3 py-3 disabled:opacity-50"
            >
              <Text className="font-inter-semibold text-[15px] text-white">{t('common.save')}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// Hidden pickers render nothing; reopening starts with the current saved value.
export default function ScreenTimeTimePicker({ visible, title, value, onClose, onConfirm }) {
  if (!visible) return null;
  return <OpenTimePicker key={String(value)} title={title} value={value} onClose={onClose} onConfirm={onConfirm} />;
}
