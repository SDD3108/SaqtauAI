import { useLocalSearchParams } from 'expo-router';

import FamilyActivityScreen from '@/src/features/family/components/FamilyActivityScreen';

export default function Route() {
  const { accountId } = useLocalSearchParams();
  const id = Array.isArray(accountId) ? accountId[0] : accountId;
  return <FamilyActivityScreen accountId={id} />;
}
