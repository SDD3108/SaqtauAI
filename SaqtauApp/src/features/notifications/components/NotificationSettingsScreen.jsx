import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Bell,
  ChevronRight,
  FileCheck2,
  MessageSquareMore,
  ShieldCheck,
  UsersRound,
  Waves,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import useI18n from '@/src/features/localization/hooks/useI18n';
import PreferenceRow from '@/src/features/notifications/components/PreferenceRow';
import useNotificationPreferences from '@/src/features/notifications/hooks/useNotificationPreferences';

function CircleIcon({ children }) {
  return <View className="h-14 w-14 items-center justify-center rounded-full bg-[#E5E4E7]">{children}</View>;
}

function timeStringToDate(value) {
  const [hours = 19, minutes = 0] = String(value || '19:00').split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function dateToTimeString(date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export default function NotificationSettingsScreen() {
  const { locale, t } = useI18n();
  const { preferences, loading, savingKey, error, retry, updatePreference } = useNotificationPreferences();
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [draftTime, setDraftTime] = useState(timeStringToDate(preferences.reminder_time));

  useEffect(() => setDraftTime(timeStringToDate(preferences.reminder_time)), [preferences.reminder_time]);

  const displayTime = new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(
    timeStringToDate(preferences.reminder_time),
  );

  if (loading) {
    return <SafeAreaView className="flex-1 items-center justify-center bg-[#ECECEC]"><ActivityIndicator color="#181027" /></SafeAreaView>;
  }

  return (
    <SafeAreaView className="flex-1 bg-[#ECECEC]" edges={['top']}>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 34 }} showsVerticalScrollIndicator={false}>
        <View className="relative mt-2 min-h-[110px] items-center justify-center">
          <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')} hitSlop={8} onPress={() => router.back()} className="absolute left-0 top-4 h-12 w-12 items-start justify-center active:opacity-60">
            <ArrowLeft size={31} color="#181027" strokeWidth={2.1} />
          </Pressable>
          <Text accessibilityRole="header" className="font-inter-semibold text-[25px] tracking-[-0.7px] text-[#181027]">{t('notifications.settingsTitle')}</Text>
          <Text className="mt-3 max-w-[300px] text-center font-inter-semibold text-[15px] leading-[21px] text-[#8E8997]">{t('notifications.settingsSubtitle')}</Text>
        </View>

        <Text className="mt-5 font-inter-medium text-[19px] text-[#181027]">{t('notifications.checkInReminders')}</Text>
        <View className="mt-3 overflow-hidden rounded-[22px] bg-white">
          <PreferenceRow
            title={t('notifications.checkInReminders')}
            description={t('notifications.remindersDesc')}
            value={preferences.checkin_reminders}
            saving={savingKey === 'checkin_reminders'}
            onValueChange={(value) => updatePreference('checkin_reminders', value)}
            icon={<CircleIcon><Waves size={28} color="#5F5B75" /></CircleIcon>}
          />
          <Pressable accessibilityRole="button" accessibilityState={{ disabled: !preferences.checkin_reminders }} disabled={!preferences.checkin_reminders} onPress={() => setShowTimePicker(true)} className="flex-row items-center px-5 pb-5 pt-2 active:opacity-70">
            <Text className="flex-1 font-inter-medium text-[15px] text-[#8E8997]">{t('notifications.reminderTime')}</Text>
            <Text className="font-inter-medium text-[15px] text-[#8E8997]">{displayTime}</Text>
            <ChevronRight size={22} color="#8E8997" />
          </Pressable>
        </View>

        <Text className="mt-7 font-inter-medium text-[19px] text-[#181027]">{t('notifications.familyActivity')}</Text>
        <View className="mt-3 overflow-hidden rounded-[22px] bg-white">
          <PreferenceRow title={t('notifications.familyActivity')} description={t('notifications.familyDesc')} value={preferences.family_activity} saving={savingKey === 'family_activity'} onValueChange={(value) => updatePreference('family_activity', value)} icon={<CircleIcon><UsersRound size={28} color="#5F5B75" /></CircleIcon>} />
        </View>

        <View className="mt-4 overflow-hidden rounded-[22px] bg-white">
          <PreferenceRow title={t('notifications.reportReady')} description={t('notifications.reportDesc')} value={preferences.report_ready} saving={savingKey === 'report_ready'} onValueChange={(value) => updatePreference('report_ready', value)} icon={<CircleIcon><FileCheck2 size={28} color="#5F5B75" /></CircleIcon>} />
        </View>

        <Text className="mt-7 font-inter-medium text-[19px] text-[#181027]">{t('notifications.delivery')}</Text>
        <View className="mt-3 overflow-hidden rounded-[22px] bg-white">
          <Pressable accessibilityRole="button" onPress={() => router.push('/(app)/notifications')} className="flex-row items-center px-4 py-4 active:opacity-75">
            <CircleIcon><Bell size={27} color="#5F5B75" fill="#5F5B75" /></CircleIcon>
            <View className="ml-4 flex-1">
              <Text className="font-inter-semibold text-[16px] text-[#181027]">{t('notifications.inApp')}</Text>
              <Text className="mt-1 font-inter-medium text-[13px] text-[#8E8997]">{t('notifications.alwaysDelivered')}</Text>
            </View>
            <ChevronRight size={22} color="#8E8997" />
          </Pressable>
          <PreferenceRow title={t('notifications.email')} description={t('notifications.emailDesc')} value={preferences.email_notifications} saving={savingKey === 'email_notifications'} onValueChange={(value) => updatePreference('email_notifications', value)} icon={<CircleIcon><MessageSquareMore size={27} color="#5F5B75" fill="#5F5B75" /></CircleIcon>} />
        </View>

        {error ? (
          <View accessibilityLiveRegion="polite" className="mt-5 rounded-[18px] bg-white px-4 py-4">
            <Text className="font-inter-medium text-[13px] leading-[18px] text-[#8E8997]">{error}</Text>
            <Pressable accessibilityRole="button" onPress={retry} className="mt-2 self-start" hitSlop={8}>
              <Text className="font-inter-semibold text-[13px] text-[#181027]">{t('common.retry')}</Text>
            </Pressable>
          </View>
        ) : null}

        <View className="mt-12 flex-row items-center justify-center gap-3 pb-4">
          <ShieldCheck size={25} color="#5F5B75" fill="#5F5B75" />
          <Text className="font-inter-medium text-[15px] text-[#5F5B75]">{t('notifications.changeAnytime')}</Text>
        </View>
      </ScrollView>

      <Modal visible={showTimePicker} transparent animationType="fade" onRequestClose={() => setShowTimePicker(false)}>
        <Pressable onPress={() => setShowTimePicker(false)} className="flex-1 justify-end bg-black/25">
          <Pressable onPress={() => {}} className="rounded-t-[28px] bg-[#F7F6F8] px-5 pb-8 pt-4">
            <View className="mb-2 flex-row items-center justify-between">
              <Pressable accessibilityRole="button" onPress={() => setShowTimePicker(false)}><Text className="font-inter-medium text-[15px] text-[#807B89]">{t('common.cancel')}</Text></Pressable>
              <Text className="font-inter-semibold text-[15px] text-[#181027]">{t('notifications.reminderTime')}</Text>
              <Pressable accessibilityRole="button" onPress={async () => { await updatePreference('reminder_time', dateToTimeString(draftTime)); setShowTimePicker(false); }}><Text className="font-inter-semibold text-[15px] text-[#181027]">{t('common.done')}</Text></Pressable>
            </View>
            <DateTimePicker value={draftTime} mode="time" display="spinner" onChange={(_, date) => date && setDraftTime(date)} textColor="#181027" />
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
