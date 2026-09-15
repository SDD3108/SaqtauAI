import {
  Activity,
  HeartPulse,
  Waves,
} from 'lucide-react-native';
import { Text, View } from 'react-native';

import {
  formatMeasurementDate,
  formatMeasurementTime,
  formatNumber,
  signalPercent,
  stressLabel,
} from '@/src/features/history/history.utils';

function Metric({ icon: Icon, label, value }) {
  return (
    <View className="flex-1">
      <View className="flex-row items-center">
        <Icon
          size={15}
          strokeWidth={1.8}
          color="#807B89"
        />
        <Text className="ml-1 font-inter-medium text-[11px] text-[#8E879B]">
          {label}
        </Text>
      </View>
      <Text className="mt-1 font-inter-semibold text-[14px] text-[#181027]">
        {value}
      </Text>
    </View>
  );
}

export default function HistoryCheckInCard({ measurement }) {
  const quality = signalPercent(measurement.signal_quality);

  return (
    <View className="mt-3 rounded-[15px] border border-[#B7B2BD] px-4 py-4">
      <View className="flex-row items-start justify-between">
        <View>
          <Text className="font-inter-semibold text-[16px] text-[#181027]">
            {formatMeasurementDate(measurement)}
          </Text>
          <Text className="mt-1 font-inter-medium text-[12px] text-[#8E879B]">
            {formatMeasurementTime(measurement)} · 60-second check-in
          </Text>
        </View>

        <View className="rounded-full bg-[#DEDDDF] px-3 py-1.5">
          <Text className="font-inter-semibold text-[11px] text-[#181027]">
            {stressLabel(measurement.stress_level)} stress
          </Text>
        </View>
      </View>

      <View className="mt-4 flex-row gap-3">
        <Metric
          icon={HeartPulse}
          label="Heart rate"
          value={`${formatNumber(measurement.bpm)} BPM`}
        />
        <Metric
          icon={Waves}
          label="HRV"
          value={`${formatNumber(measurement.hrv_rmssd_ms, 1)} ms`}
        />
        <Metric
          icon={Activity}
          label="Signal"
          value={quality === null ? '—' : `${quality}%`}
        />
      </View>
    </View>
  );
}
