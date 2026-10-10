import { getCurrentLocale } from '@/src/features/localization/localization.store';
import useI18n from '@/src/features/localization/hooks/useI18n';
import { router } from 'expo-router';
import { AlertTriangle, Check, Users } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthStore } from '@/src/features/auth/auth.store';
import {
  acceptInviteLink,
  inspectInviteLink,
  isRouteUnavailable,
} from '@/src/features/family/family.api';

export default function InviteAcceptScreen({ token }) {
  const { t } = useI18n();
  const isGuest = useAuthStore((state) => state.isGuest);
  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState('');
  const [routeUnavailable, setRouteUnavailable] = useState(false);

  const returnTo = useMemo(
    () => `/family-invite/${encodeURIComponent(String(token || ''))}`,
    [token],
  );

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const result = await inspectInviteLink(token);
        if (active) setInvite(result);
      } catch (loadError) {
        if (!active) return;
        if (isRouteUnavailable(loadError)) {
          setRouteUnavailable(true);
          setError(t('family.legacyFallback'));
        } else {
          setError(loadError?.message || t('family.inviteInvalid'));
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    if (token) {
      load();
    } else {
      setLoading(false);
      setError(t('family.inviteInvalid'));
    }

    return () => {
      active = false;
    };
  }, [token]);

  const accept = async () => {
    if (isGuest) {
      router.push({
        pathname: '/(auth)/sign-in',
        params: { returnTo },
      });
      return;
    }

    setAccepting(true);
    setError('');
    try {
      await acceptInviteLink(token);
      setAccepted(true);
    } catch (acceptError) {
      setError(acceptError?.message || t('family.inviteInvalid'));
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#ECECEC]">
        <ActivityIndicator color="#181027" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#ECECEC]">
      <View className="flex-1 items-center justify-center px-6">
        <View className="h-24 w-24 items-center justify-center rounded-full bg-white">
          {accepted ? (
            <Check size={42} color="#181027" />
          ) : routeUnavailable || error ? (
            <AlertTriangle size={40} color="#181027" />
          ) : (
            <Users size={42} color="#181027" />
          )}
        </View>

        <Text className="mt-6 text-center font-inter-extrabold text-[29px] tracking-[-0.9px] text-[#181027]">
          {accepted ? t('common.connected') : t('family.inviteTitle')}
        </Text>

        <Text className="mt-3 max-w-[340px] text-center font-inter-medium text-[15px] leading-[22px] text-[#807B89]">
          {accepted
            ? t('family.private')
            : error ||
              `${invite?.inviter?.display_name || invite?.inviter_name || t('common.familyMember')} · ${t('family.invitedYou')}`}
        </Text>

        {!accepted && invite?.expires_at ? (
          <Text className="mt-3 font-inter-medium text-[12px] text-[#9C98A5]">
            {new Date(invite.expires_at).toLocaleString(getCurrentLocale())}
          </Text>
        ) : null}

        {accepted ? (
          <Pressable
            onPress={() => router.replace('/(app)/(tabs)/family')}
            className="mt-8 h-14 w-full max-w-[360px] items-center justify-center rounded-full bg-[#181027] active:opacity-80"
          >
            <Text className="font-inter-bold text-[16px] text-white">{t('tabs.family')}</Text>
          </Pressable>
        ) : routeUnavailable ? (
          <Pressable
            onPress={() => router.replace('/(app)/(tabs)/family')}
            className="mt-8 h-14 w-full max-w-[360px] items-center justify-center rounded-full bg-white active:opacity-80"
          >
            <Text className="font-inter-bold text-[16px] text-[#181027]">{t('tabs.family')}</Text>
          </Pressable>
        ) : (
          <Pressable
            disabled={accepting}
            onPress={accept}
            className="mt-8 h-14 w-full max-w-[360px] items-center justify-center rounded-full bg-[#181027] active:opacity-80"
          >
            {accepting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="font-inter-bold text-[16px] text-white">
                {isGuest ? t('family.signInToAccept') : t('family.accept')}
              </Text>
            )}
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}
