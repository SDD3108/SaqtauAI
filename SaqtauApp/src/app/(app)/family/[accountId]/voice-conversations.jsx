import { useLocalSearchParams } from 'expo-router';

import VoiceConversationsScreen from '@/src/features/family/components/VoiceConversationsScreen';

export default function Route() {
  const { accountId } = useLocalSearchParams();
  const id = Array.isArray(accountId) ? accountId[0] : accountId;
  return <VoiceConversationsScreen accountId={id} />;
}
