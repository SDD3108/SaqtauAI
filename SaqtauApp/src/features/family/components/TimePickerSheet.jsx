import useI18n from '@/src/features/localization/hooks/useI18n';
import { Clock3, MoonStar, Smartphone } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Switch, Text, View } from 'react-native';

import FamilySubpageShell from '@/src/features/family/components/FamilySubpageShell';
import TimePickerSheet from '@/src/features/family/components/TimePickerSheet';
import UpdatedAtLabel from '@/src/features/family/components/UpdatedAtLabel';
import { formatMinutes } from '@/src/features/family/family-controls.utils';
import useFamilyScreenTime from '@/src/features/family/hooks/useFamilyScreenTime';

const LIMIT_OPTIONS = [60, 90, 120, 180, 240];

export default function ScreenTimeScreen({ accountId }) {
  const { t } = useI18n();
  const {
    screenTime,
    updatedAt,
    loading,
    savingKey,
    error,
    available,
    reload,
    setDailyLimit,
    setQuietHours,
  } = useFamilyScreenTime(accountId);
  const [picker, setPicker] = useState(null);

  const quiet = screenTime.quiet_hours;
  const selectedLabel = useMemo(
    () => formatMinutes(screenTime.daily_limit_minutes),
    [screenTime.daily_limit_minutes],
  );

  return (
    <FamilySubpageShell
      title={t('screenTime.title')}
      subtitle={t('family.screenTimeSubtitle')}
      loading={loading}
      error={error}
      onRetry={reload}
    >
      <View className="rounded-[26px] bg-[#181027] px-5 py-5">
        <View className="h-11 w-11 items-center justify-center rounded-full bg-white/10">
          <Clock3 size={23} color="#FFFFFF" />
        </View>
        <Text className="mt-4 font-inter-extrabold text-[20px] tracking-[-0.4px] text-white">
          {t('screenTime.dailyLimit')}
        </Text>
        <Text className="mt-1 font-inter-extrabold text-[31px] tracking-[-1px] text-white">
          {selectedLabel}
        </Text>
        <Text className="mt-2 font-inter-medium text-[12px] leading-[18px] text-[#D8D4DE]">
          {t('screenTime.policyBody')}
        </Text>
      </View>

      <View className="mt-4 flex-row items-start gap-3 rounded-[20px] bg-[#E9E7EC] px-4 py-4">
        <Smartphone size={21} color="#625C6B" />
        <View className="min-w-0 flex-1">
          <Text className="font-inter-bold text-[14px] text-[#4F4958]">
            {t('screenTime.deviceTitle')}
          </Text>
          <Text className="mt-1 font-inter-medium text-[12px] leading-[18px] text-[#716B78]">
            {t('screenTime.deviceBody')}
          </Text>
        </View>
      </View>

      <Text className="mb-3 mt-6 font-inter-bold text-[18px] text-[#181027]">{t('screenTime.dailyLimit')}</Text>
      <View className="flex-row flex-wrap gap-2">
        {LIMIT_OPTIONS.map((minutes) => {
          const selected = screenTime.daily_limit_minutes === minutes;
          return (
            <Pressable
              key={minutes}
              disabled={!available || Boolean(savingKey)}
              onPress={() => setDailyLimit(minutes)}
              className={`rounded-full px-4 py-3 ${selected ? 'bg-[#181027]' : 'bg-white'} active:opacity-80`}
            >
              {savingKey === 'daily_limit_minutes' && selected ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text
                  className={`font-inter-semibold text-[13px] ${selected ? 'text-white' : 'text-[#181027]'}`}
                >
                  {formatMinutes(minutes)}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>

      <Text className="mb-3 mt-7 font-inter-bold text-[18px] text-[#181027]">{t('screenTime.quietHours')}</Text>
      <View className="overflow-hidden rounded-[24px] bg-white">
        <View className="flex-row items-center border-b border-[#ECE9EE] px-4 py-4">
          <View className="h-11 w-11 items-center justify-center rounded-full bg-[#EEECEF]">
            <MoonStar size={21} color="#181027" />
          </View>
          <View className="ml-3 flex-1 pr-3">
            <Text className="font-inter-bold text-[15px] text-[#181027]">{t('screenTime.quietHours')}</Text>
            <Text className="mt-1 font-inter-medium text-[12px] leading-[17px] text-[#807B89]">
              {t('screenTime.quietBody')}
            </Text>
          </View>
          {savingKey === 'quiet_hours' ? (
            <ActivityIndicator color="#181027" size="small" />
          ) : (
            <Switch
              value={quiet.enabled}
              disabled={!available || Boolean(savingKey)}
              onValueChange={(enabled) => setQuietHours({ enabled })}
              trackColor={{ false: '#D3D0D7', true: '#181027' }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#D3D0D7"
            />
          )}
        </View>

        <Pressable
          disabled={!available || !quiet.enabled || Boolean(savingKey)}
          onPress={() => setPicker('from')}
          className="flex-row items-center justify-between border-b border-[#ECE9EE] px-4 py-4 active:opacity-80"
        >
          <Text className={`font-inter-semibold text-[14px] ${quiet.enabled ? 'text-[#181027]' : 'text-[#AAA6B0]'}`}>
            {t('screenTime.starts')}
          </Text>
          <Text className={`font-inter-bold text-[15px] ${quiet.enabled ? 'text-[#181027]' : 'text-[#AAA6B0]'}`}>
            {quiet.from}
          </Text>
        </Pressable>

        <Pressable
          disabled={!available || !quiet.enabled || Boolean(savingKey)}
          onPress={() => setPicker('to')}
          className="flex-row items-center justify-between px-4 py-4 active:opacity-80"
        >
          <Text className={`font-inter-semibold text-[14px] ${quiet.enabled ? 'text-[#181027]' : 'text-[#AAA6B0]'}`}>
            {t('screenTime.ends')}
          </Text>
          <Text className={`font-inter-bold text-[15px] ${quiet.enabled ? 'text-[#181027]' : 'text-[#AAA6B0]'}`}>
            {quiet.to}
          </Text>
        </Pressable>
      </View>

      <UpdatedAtLabel value={updatedAt} />

      <TimePickerSheet
        visible={picker === 'from'}
        title={t('screenTime.start')}
        value={quiet.from}
        onClose={() => setPicker(null)}
        onConfirm={(from) => {
          setPicker(null);
          setQuietHours({ from });
        }}
      />
      <TimePickerSheet
        visible={picker === 'to'}
        title={t('screenTime.end')}
        value={quiet.to}
        onClose={() => setPicker(null)}
        onConfirm={(to) => {
          setPicker(null);
          setQuietHours({ to });
        }}
      />
    </FamilySubpageShell>
  );
}
