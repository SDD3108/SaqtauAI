import { ChevronRight } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import ConnectedIcon from '@/assets/images/connected.svg';
import GuardianIcon from '@/assets/images/guardian.svg';
import {
  formatMeasurementTime,
  formatSignalQuality,
  initialsForName,
} from '@/src/features/family/family.utils';
import useI18n from '@/src/features/localization/hooks/useI18n';

export default function FamilyMemberCard({ member, onPress }) {
  const { t } = useI18n();
  const last = member?.last;
  const quality = formatSignalQuality(last?.quality);
  const isGuardian = ['guardian', 'adult', 'parent'].includes(member?.role);
  const StatusIcon = isGuardian ? GuardianIcon : ConnectedIcon;

  return (
    <Pressable
      onPress={onPress}
      className="mb-3 rounded-[24px] bg-white px-4 py-4 active:opacity-80"
      accessibilityRole="button"
      accessibilityLabel={member?.name || t('common.familyMember')}
    >
      <View className="flex-row items-center">
        <View className="h-14 w-14 items-center justify-center rounded-full bg-[#EEECEF]">
          <Text className="font-inter-bold text-[18px] text-[#181027]">
            {initialsForName(member?.name)}
          </Text>
        </View>

        <View className="ml-4 flex-1">
          <Text className="font-inter-bold text-[18px] tracking-[-0.35px] text-[#181027]">
            {member?.name || t('common.familyMember')}
          </Text>
          <View className="mt-1 flex-row items-center">
            <StatusIcon width={18} height={18} />
            <Text className="ml-2 font-inter-medium text-[14px] text-[#625D71]">
              {t('common.connected')}
            </Text>
          </View>
        </View>

        <ChevronRight size={22} color="#9C98A5" />
      </View>

      {last ? (
        <View className="mt-4 flex-row rounded-[18px] bg-[#F5F4F6] px-4 py-3">
          <View className="flex-1">
            <Text className="font-inter-medium text-[12px] text-[#807B89]">{t('family.heartRate')}</Text>
            <Text className="mt-1 font-inter-bold text-[16px] text-[#181027]">
              {last.bpm ? `${Math.round(Number(last.bpm))} BPM` : '—'}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="font-inter-medium text-[12px] text-[#807B89]">{t('family.stress')}</Text>
            <Text className="mt-1 font-inter-bold text-[16px] capitalize text-[#181027]">
              {last.stress || '—'}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="font-inter-medium text-[12px] text-[#807B89]">{t('family.signal')}</Text>
            <Text className="mt-1 font-inter-bold text-[16px] text-[#181027]">
              {quality || '—'}
            </Text>
          </View>
        </View>
      ) : null}

      {last?.at ? (
        <Text className="mt-3 font-inter-medium text-[12px] text-[#9C98A5]">
          {t('dashboard.lastCheckIn')} · {formatMeasurementTime(last.at)}
        </Text>
      ) : null}
    </Pressable>
  );
}
