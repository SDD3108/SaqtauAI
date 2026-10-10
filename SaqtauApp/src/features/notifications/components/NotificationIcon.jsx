import { View } from 'react-native';
import { Bell } from 'lucide-react-native';

import InviteIcon from '@/assets/images/invite.svg';
import ReminderIcon from '@/assets/images/reminder.svg';
import ResultsIcon from '@/assets/images/results.svg';
import { getNotificationKind } from '@/src/features/notifications/notifications.utils';

export default function NotificationIcon({ notification, size = 46 }) {
  const kind = getNotificationKind(notification);
  let Icon = null;

  if (kind.includes('result') || kind === 'measurement_ready') {
    Icon = ResultsIcon;
  } else if (kind.includes('invite') || kind.includes('family')) {
    Icon = InviteIcon;
  } else if (kind.includes('reminder') || kind.includes('checkin')) {
    Icon = ReminderIcon;
  }

  return (
    <View
      className="items-center justify-center rounded-full bg-[#F7F6F8]"
      style={{ width: size, height: size }}
    >
      {Icon ? (
        <Icon width={24} height={24} />
      ) : (
        <Bell size={22} color="#181027" strokeWidth={1.8} />
      )}
    </View>
  );
}
