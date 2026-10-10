import {
  Activity,
  Bell,
  CheckCircle2,
  HeartPulse,
  MessageCircle,
  Settings2,
} from 'lucide-react-native';
import { Text, View } from 'react-native';

import { formatActivityTime } from '@/src/features/family/family-controls.utils';

function iconForKind(kind) {
  const value = String(kind || '').toLowerCase();
  if (value.includes('check') || value.includes('measure')) return HeartPulse;
  if (value.includes('voice') || value.includes('chat') || value.includes('ai')) return MessageCircle;
  if (value.includes('notification') || value.includes('reminder')) return Bell;
  if (value.includes('setting') || value.includes('permission')) return Settings2;
  if (value.includes('complete') || value.includes('ready')) return CheckCircle2;
  return Activity;
}

export default function ActivityEventCard({ event }) {
  const Icon = iconForKind(event.kind);
  const when = formatActivityTime(event.occurredAt);

  return (
    <View className="mb-3 flex-row rounded-[22px] bg-white px-4 py-4">
      <View className="h-12 w-12 items-center justify-center rounded-full bg-[#EEECEF]">
        <Icon size={21} color="#181027" />
      </View>
      <View className="ml-4 flex-1">
        <View className="flex-row items-start justify-between">
          <Text className="flex-1 pr-3 font-inter-bold text-[15px] leading-[20px] text-[#181027]">
            {event.title}
          </Text>
          {when ? (
            <Text className="font-inter-medium text-[10px] text-[#9C98A5]">{when}</Text>
          ) : null}
        </View>
        {event.detail ? (
          <Text className="mt-1 font-inter-medium text-[12px] leading-[18px] text-[#807B89]">
            {event.detail}
          </Text>
        ) : null}
        <Text className="mt-2 self-start rounded-full bg-[#F3F2F5] px-2.5 py-1 font-inter-semibold text-[10px] capitalize text-[#625D71]">
          {String(event.kind || 'activity').replace(/_/g, ' ')}
        </Text>
      </View>
    </View>
  );
}
