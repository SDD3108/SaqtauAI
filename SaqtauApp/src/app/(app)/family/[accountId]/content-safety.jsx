import { useLocalSearchParams } from 'expo-router';

import ContentSafetyScreen from '@/src/features/family/components/ContentSafetyScreen';

export default function Route() {
  const { accountId } = useLocalSearchParams();
  const id = Array.isArray(accountId) ? accountId[0] : accountId;
  return <ContentSafetyScreen accountId={id} />;
}
