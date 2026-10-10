import { useLocalSearchParams } from 'expo-router';

import FamilyPrivacyScreen from '@/src/features/family/components/FamilyPrivacyScreen';

export default function Route() {
  const { accountId } = useLocalSearchParams();
  const id = Array.isArray(accountId) ? accountId[0] : accountId;
  return <FamilyPrivacyScreen accountId={id} />;
}
