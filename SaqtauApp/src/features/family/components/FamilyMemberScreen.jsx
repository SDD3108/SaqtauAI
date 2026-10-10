import useI18n from '@/src/features/localization/hooks/useI18n';
import { router } from 'expo-router';
import { ChevronLeft, RefreshCw } from 'lucide-react-native';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ActivityIcon from '@/assets/images/activity.svg';
import OnlineIcon from '@/assets/images/online.svg';
import PrivacyIcon from '@/assets/images/privacy (1).svg';
import RemoveIcon from '@/assets/images/remove.svg';
import SafetyIcon from '@/assets/images/safety.svg';
import TimeIcon from '@/assets/images/time.svg';
import VoiceIcon from '@/assets/images/voice.svg';
import FamilyActionRow from '@/src/features/family/components/FamilyActionRow';
import useFamilyMember from '@/src/features/family/hooks/useFamilyMember';
import {
  formatMeasurementTime,
  formatSignalQuality,
  initialsForName,
} from '@/src/features/family/family.utils';

export default function FamilyMemberScreen({ accountId }) {
  const { t } = useI18n();
  const { member, loading, removing, error, reload, remove } = useFamilyMember(accountId);

  const open = (screen) => {
    router.push(`/(app)/family/${encodeURIComponent(String(accountId))}/${screen}`);
  };

  const confirmRemove = () => {
    Alert.alert(
      t('family.removeTitle', { name: member?.name || t('common.familyMember') }),
      t('family.removeBody'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('family.remove'),
          style: 'destructive',
          onPress: async () => {
            const removed = await remove();
            if (removed) {
              router.replace('/(app)/(tabs)/family');
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#ECECEC]">
        <ActivityIndicator color="#181027" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#ECECEC]" edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 45 }} showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center px-5 pt-2">
          <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel={t('common.back')} className="h-11 w-11 items-center justify-center rounded-full bg-white">
            <ChevronLeft size={23} color="#181027" />
          </Pressable>
          <Text className="ml-4 font-inter-extrabold text-[24px] tracking-[-0.6px] text-[#181027]">
            {t('common.familyMember')}
          </Text>
        </View>

        {error && !member ? (
          <View className="mt-14 items-center px-6">
            <Text className="text-center font-inter-medium text-[15px] leading-[22px] text-[#807B89]">
              {error}
            </Text>
            <Pressable onPress={reload} className="mt-5 flex-row items-center rounded-full bg-white px-5 py-3">
              <RefreshCw size={18} color="#181027" />
              <Text className="ml-2 font-inter-semibold text-[14px] text-[#181027]">{t('common.retry')}</Text>
            </Pressable>
          </View>
        ) : null}

        {member ? (
          <View className="px-5 pt-7">
            <View className="items-center rounded-[30px] bg-white px-5 py-6">
              <View className="h-20 w-20 items-center justify-center rounded-full bg-[#EEECEF]">
                <Text className="font-inter-extrabold text-[24px] text-[#181027]">
                  {initialsForName(member.name)}
                </Text>
              </View>
              <Text className="mt-4 font-inter-extrabold text-[25px] tracking-[-0.7px] text-[#181027]">
                {member.name}
              </Text>
              <View className="mt-2 flex-row items-center">
                <OnlineIcon width={20} height={20} />
                <Text className="ml-2 font-inter-medium text-[14px] text-[#625D71]">{t('common.connected')}</Text>
              </View>

              {member.last ? (
                <View className="mt-5 w-full flex-row rounded-[20px] bg-[#F4F3F5] px-4 py-4">
                  <View className="flex-1 items-center">
                    <Text className="font-inter-medium text-[12px] text-[#807B89]">{t('family.heartRate')}</Text>
                    <Text className="mt-1 font-inter-bold text-[17px] text-[#181027]">
                      {member.last.bpm ? `${Math.round(Number(member.last.bpm))} BPM` : '—'}
                    </Text>
                  </View>
                  <View className="flex-1 items-center">
                    <Text className="font-inter-medium text-[12px] text-[#807B89]">{t('family.stress')}</Text>
                    <Text className="mt-1 font-inter-bold text-[17px] capitalize text-[#181027]">
                      {member.last.stress || '—'}
                    </Text>
                  </View>
                  <View className="flex-1 items-center">
                    <Text className="font-inter-medium text-[12px] text-[#807B89]">{t('family.signal')}</Text>
                    <Text className="mt-1 font-inter-bold text-[17px] text-[#181027]">
                      {formatSignalQuality(member.last.quality) || '—'}
                    </Text>
                  </View>
                </View>
              ) : null}

              {member.last?.at ? (
                <Text className="mt-3 font-inter-medium text-[12px] text-[#9C98A5]">
                  {t('dashboard.lastCheckIn')} · {formatMeasurementTime(member.last.at)}
                </Text>
              ) : null}
            </View>

            <Text className="mb-3 mt-6 font-inter-bold text-[20px] tracking-[-0.4px] text-[#181027]">
              {t('family.title')}
            </Text>

            <FamilyActionRow
              Icon={VoiceIcon}
              title={t('family.voice')}
              subtitle={t('family.voiceSubtitle')}
              onPress={() => open('voice-conversations')}
            />
            <FamilyActionRow
              Icon={SafetyIcon}
              title={t('family.contentSafety')}
              subtitle={t('family.contentSafetySubtitle')}
              onPress={() => open('content-safety')}
            />
            <FamilyActionRow
              Icon={TimeIcon}
              title={t('family.screenTime')}
              subtitle={t('family.screenTimeSubtitle')}
              onPress={() => open('screen-time')}
            />
            <FamilyActionRow
              Icon={PrivacyIcon}
              title={t('family.dataPrivacy')}
              subtitle={t('family.privacySubtitle')}
              onPress={() => open('privacy')}
            />
            <FamilyActionRow
              Icon={ActivityIcon}
              title={t('family.viewActivity')}
              subtitle={t('family.activitySubtitle')}
              onPress={() => open('activity')}
            />

            <Pressable
              disabled={removing}
              onPress={confirmRemove}
              className="mt-3 flex-row items-center rounded-[22px] bg-white px-4 py-4 active:opacity-80"
            >
              <View className="h-12 w-12 items-center justify-center rounded-full bg-[#F5ECEE]">
                <RemoveIcon width={28} height={28} />
              </View>
              <Text className="ml-4 flex-1 font-inter-bold text-[16px] text-[#9A3C49]">
                {t('family.remove')}
              </Text>
              {removing ? <ActivityIndicator color="#9A3C49" /> : null}
            </Pressable>

            {error ? (
              <Text className="mt-4 text-center font-inter-medium text-[13px] leading-[19px] text-[#9A3C49]">
                {error}
              </Text>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
