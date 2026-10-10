import { useLocalSearchParams } from 'expo-router';

import ScreenTimeScreen from '@/src/features/family/components/ScreenTimeScreen';

export default function Route() {
  const { accountId } = useLocalSearchParams();
  const id = Array.isArray(accountId) ? accountId[0] : accountId;
  return <ScreenTimeScreen accountId={id} />;
}
