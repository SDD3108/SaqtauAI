import useI18n from '@/src/features/localization/hooks/useI18n';
import { Activity, ChevronLeft, RefreshCw } from 'lucide-react-native';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import ActivityEventCard from '@/src/features/family/components/ActivityEventCard';
import FamilyRangeSelector from '@/src/features/family/components/FamilyRangeSelector';
import useFamilyActivity from '@/src/features/family/hooks/useFamilyActivity';

export default function FamilyActivityScreen({ accountId }) {
  const { t } = useI18n();
  const {
    range,
    setRange,
    events,
    loading,
    refreshing,
    error,
    reload,
    refresh,
  } = useFamilyActivity(accountId);

  return (
    <SafeAreaView className="flex-1 bg-[#ECECEC]" edges={['top']}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#181027" />}
        contentContainerStyle={{ paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center px-5 pt-2">
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
            className="h-11 w-11 items-center justify-center rounded-full bg-white active:opacity-80"
          >
            <ChevronLeft size={23} color="#181027" />
          </Pressable>
          <View className="ml-4 flex-1">
            <Text className="font-inter-extrabold text-[24px] tracking-[-0.6px] text-[#181027]">
              {t('family.activity')}
            </Text>
            <Text className="mt-1 font-inter-medium text-[13px] text-[#807B89]">
              {t('family.recentActivity')}
            </Text>
          </View>
        </View>

        <View className="px-5 pt-6">
          <FamilyRangeSelector value={range} onChange={setRange} />

          {error ? (
            <View className="mt-4 rounded-[20px] bg-[#F8ECEE] px-4 py-4">
              <Text className="font-inter-medium text-[13px] leading-[19px] text-[#8F4250]">
                {error}
              </Text>
              <Pressable
                onPress={reload}
                className="mt-3 flex-row items-center self-start rounded-full bg-white px-4 py-2.5"
              >
                <RefreshCw size={16} color="#181027" />
                <Text className="ml-2 font-inter-semibold text-[13px] text-[#181027]">{t('common.retry')}</Text>
              </Pressable>
            </View>
          ) : null}

          {loading ? (
            <View className="min-h-[360px] items-center justify-center">
              <ActivityIndicator color="#181027" />
            </View>
          ) : events.length ? (
            <View className="pt-5">
              {events.map((event) => (
                <ActivityEventCard key={event.id} event={event} />
              ))}
            </View>
          ) : (
            <View className="mt-8 items-center rounded-[28px] bg-white px-6 py-10">
              <View className="h-14 w-14 items-center justify-center rounded-full bg-[#EEECEF]">
                <Activity size={24} color="#181027" />
              </View>
              <Text className="mt-4 font-inter-bold text-[17px] text-[#181027]">{t('family.noActivityShort')}</Text>
              <Text className="mt-2 text-center font-inter-medium text-[13px] leading-[19px] text-[#807B89]">
                {t('family.noActivityBackend')}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
