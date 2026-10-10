import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';

import { useAuthStore } from '@/src/features/auth/auth.store';
import FamilyMemberScreen from '@/src/features/family/components/FamilyMemberScreen';

export default function FamilyMemberRoute() {
  const { accountId } = useLocalSearchParams();
  const value = Array.isArray(accountId) ? accountId[0] : accountId;
  const isReady = useAuthStore((state) => state.isReady);
  const isGuest = useAuthStore((state) => state.isGuest);

  useEffect(() => {
    if (isReady && isGuest) {
      router.replace('/(auth)/sign-in');
    }
  }, [isGuest, isReady]);

  if (!isReady || isGuest) {
    return null;
  }

  return <FamilyMemberScreen accountId={value} />;
}
