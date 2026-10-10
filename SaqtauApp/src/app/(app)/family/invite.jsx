import { router } from 'expo-router';
import { useEffect } from 'react';

import { useAuthStore } from '@/src/features/auth/auth.store';
import InviteFamilyScreen from '@/src/features/family/components/InviteFamilyScreen';

export default function InviteFamilyRoute() {
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

  return <InviteFamilyScreen />;
}
