import { router } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import HistoryCheckInCard from '@/src/features/history/components/HistoryCheckInCard';
import PeriodSelector from '@/src/features/history/components/PeriodSelector';
import TrendChart from '@/src/features/history/components/TrendChart';
import useHistory from '@/src/features/history/hooks/useHistory';
import { formatNumber } from '@/src/features/history/history.utils';

function SummaryMetric({ label, value, unit }) {
  return (
    <View className="flex-1 rounded-[15px] border border-[#B7B2BD] px-4 py-4">
      <Text className="font-inter-medium text-[12px] text-[#8E879B]">
        {label}
      </Text>
      <View className="mt-2 flex-row items-end">
        <Text className="font-inter-extrabold text-[28px] leading-[32px] text-[#181027]">
          {value}
        </Text>
        {unit ? (
          <Text className="mb-0.5 ml-1 font-inter-medium text-[12px] text-[#807B89]">
            {unit}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export default function HistoryScreen() {
  const {
    period,
    setPeriod,
    measurements,
    chartPoints,
    stats,
    loading,
    refreshing,
    error,
    refresh,
    retry,
  } = useHistory();

  return (
    <SafeAreaView
      className="flex-1 bg-[#ECECEC]"
      edges={['top']}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 20,
          paddingBottom: 28,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor="#181027"
          />
        }
      >
        <View className="w-full max-w-[520px] self-center">
          <Text className="font-inter-extrabold text-[34px] leading-[40px] tracking-[-1.2px] text-[#181027]">
            History
          </Text>
          <Text className="mt-1 font-inter-medium text-[15px] leading-[21px] text-[#807B89]">
            See how your wellness signals change over time.
          </Text>

          <View className="mt-7">
            <PeriodSelector
              value={period}
              onChange={setPeriod}
            />
          </View>

          {loading ? (
            <View className="h-[270px] items-center justify-center">
              <ActivityIndicator color="#181027" />
            </View>
          ) : (
            <>
              <View className="mt-4 flex-row gap-3">
                <SummaryMetric
                  label="Average heart rate"
                  value={formatNumber(stats.averageBpm)}
                  unit="BPM"
                />
                <SummaryMetric
                  label="Average HRV"
                  value={formatNumber(stats.averageHrv, 1)}
                  unit="ms"
                />
              </View>

              <View className="mt-3 rounded-[15px] border border-[#B7B2BD] px-4 py-4">
                <View className="flex-row items-end justify-between">
                  <View>
                    <Text className="font-inter-semibold text-[17px] text-[#181027]">
                      Heart rate trend
                    </Text>
                    <Text className="mt-1 font-inter-medium text-[12px] text-[#8E879B]">
                      {stats.count} completed {stats.count === 1 ? 'check-in' : 'check-ins'} in this period
                    </Text>
                  </View>
                </View>

                <TrendChart points={chartPoints} />
              </View>

              {error ? (
                <View className="mt-3 rounded-[15px] border border-[#B7B2BD] px-4 py-3">
                  <Text className="font-inter-medium text-[13px] leading-[19px] text-[#807B89]">
                    {error}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    onPress={retry}
                    className="mt-2 self-start"
                  >
                    <Text className="font-inter-semibold text-[13px] text-[#181027]">
                      Try again
                    </Text>
                  </Pressable>
                </View>
              ) : null}

              <Text className="mt-7 font-inter-semibold text-[19px] text-[#181027]">
                Recent check-ins
              </Text>

              {measurements.length ? (
                measurements.map((measurement) => (
                  <HistoryCheckInCard
                    key={measurement.id}
                    measurement={measurement}
                  />
                ))
              ) : (
                <View className="mt-3 items-center rounded-[15px] border border-[#B7B2BD] px-5 py-8">
                  <Text className="text-center font-inter-semibold text-[17px] text-[#181027]">
                    No check-ins yet
                  </Text>
                  <Text className="mt-2 text-center font-inter-medium text-[13px] leading-[19px] text-[#8E879B]">
                    Your completed wellness check-ins will appear here.
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => router.push('/(check-in)/permissions')}
                    className="mt-5 h-[48px] w-full items-center justify-center rounded-[13px] bg-[#181027]"
                  >
                    <Text className="font-inter-semibold text-[15px] text-white">
                      Start check-in
                    </Text>
                  </Pressable>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
