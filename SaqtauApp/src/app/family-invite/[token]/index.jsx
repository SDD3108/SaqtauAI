import { useLocalSearchParams } from 'expo-router';

import InviteAcceptScreen from '@/src/features/family/components/InviteAcceptScreen';

export default function FamilyInviteAcceptRoute() {
  const { token } = useLocalSearchParams();
  const value = Array.isArray(token) ? token[0] : token;

  return <InviteAcceptScreen token={value} />;
}
