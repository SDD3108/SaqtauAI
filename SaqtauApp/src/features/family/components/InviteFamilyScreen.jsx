import useI18n from '@/src/features/localization/hooks/useI18n';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { ChevronLeft, Search, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  Share,
  Text,
  TextInput,
  View,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import CopyIcon from '@/assets/images/copy.svg';
import InviteFamilyPicture from '@/assets/images/invite_family_pic_1.png';
import ShareIcon from '@/assets/images/share.svg';
import {
  createDirectInvite,
  createInviteLink,
  isRouteUnavailable,
  searchFamilyAccounts,
} from '@/src/features/family/family.api';

function inviteUrlFromResponse(invite) {
  const token = String(invite?.token || '').trim();
  const configuredBase = String(process.env.EXPO_PUBLIC_INVITE_BASE_URL || '')
    .trim()
    .replace(/\/+$/, '');

  // Part 11 prefers the public HTTPS Universal Link when it is configured,
  // even if an older backend still returns saqtau://... in `url`.
  if (token && configuredBase) {
    return `${configuredBase}/${encodeURIComponent(token)}`;
  }

  if (typeof invite?.url === 'string' && invite.url.trim()) {
    return invite.url.trim();
  }

  return '';
}

export default function InviteFamilyScreen() {
  const { t } = useI18n();
  const [invite, setInvite] = useState(null);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState('');
  const [legacyMode, setLegacyMode] = useState(false);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [sendingId, setSendingId] = useState('');

  const inviteUrl = useMemo(() => inviteUrlFromResponse(invite), [invite]);

  const createLink = async () => {
    setCreating(true);
    setMessage('');
    try {
      const result = await createInviteLink({
        invitedRole: 'child',
        expiresInHours: 24,
        maxUses: 1,
      });
      setInvite(result);
      if (!inviteUrlFromResponse(result)) {
        setMessage(
          t('family.noShareUrl'),
        );
      }
    } catch (error) {
      if (isRouteUnavailable(error)) {
        setLegacyMode(true);
        setMessage(
          t('family.legacyFallback'),
        );
      } else {
        setMessage(error?.message || t('family.createLinkError'));
      }
    } finally {
      setCreating(false);
    }
  };

  const copyLink = async () => {
    if (!inviteUrl) return;
    await Clipboard.setStringAsync(inviteUrl);
    setMessage(t('family.linkCopied'));
  };

  const shareLink = async () => {
    if (!inviteUrl) return;
    await Share.share({
      message: `${t('family.inviteTitle')}: ${inviteUrl}`,
      url: inviteUrl,
    });
  };

  const search = async () => {
    const value = query.trim();
    if (value.length < 2) {
      setMessage(t('family.searchMin'));
      return;
    }

    setSearching(true);
    setMessage('');
    try {
      const result = await searchFamilyAccounts(value);
      setResults(result?.results || []);
      if (!(result?.results || []).length) {
        setMessage(t('family.noAccounts'));
      }
    } catch (error) {
      setMessage(error?.message || t('family.searchError'));
    } finally {
      setSearching(false);
    }
  };

  const sendDirectInvite = async (account) => {
    setSendingId(String(account?.id || ''));
    setMessage('');
    try {
      await createDirectInvite(account.id);
      setMessage(t('family.sentTo', { name: account.name || t('family.account') }));
      setResults((current) => current.filter((item) => item.id !== account.id));
    } catch (error) {
      setMessage(error?.message || t('family.sendError'));
    } finally {
      setSendingId('');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#ECECEC]" edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 50 }} showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center px-5 pt-2">
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
            className="h-11 w-11 items-center justify-center rounded-full bg-white active:opacity-80"
          >
            <ChevronLeft size={23} color="#181027" />
          </Pressable>
          <Text className="ml-4 font-inter-extrabold text-[25px] tracking-[-0.7px] text-[#181027]">
            {t('family.inviteTitle')}
          </Text>
        </View>

        <View className="items-center px-6 pt-8">
          <Image
            source={InviteFamilyPicture}
            resizeMode="contain"
            className="h-[220px] w-full max-w-[330px]"
          />
          <Text className="mt-2 text-center font-inter-extrabold text-[27px] tracking-[-0.8px] text-[#181027]">
            {t('family.inviteHeroTitle')}
          </Text>
          <Text className="mt-3 max-w-[340px] text-center font-inter-medium text-[15px] leading-[22px] text-[#807B89]">
            {t('family.inviteHeroBody')}
          </Text>
        </View>

        <View className="mt-7 px-5">
          {!invite && !legacyMode ? (
            <Pressable
              disabled={creating}
              onPress={createLink}
              className="h-14 items-center justify-center rounded-full bg-[#181027] active:opacity-80"
            >
              {creating ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="font-inter-bold text-[16px] text-white">{t('family.createLink')}</Text>
              )}
            </Pressable>
          ) : null}

          {invite ? (
            <View className="rounded-[28px] bg-white p-5">
              <Text className="font-inter-bold text-[17px] text-[#181027]">{t('family.yourInviteLink')}</Text>
              <View className="mt-3 rounded-[18px] bg-[#F2F1F3] px-4 py-3">
                <Text selectable className="font-inter-medium text-[13px] leading-[19px] text-[#625D71]">
                  {inviteUrl}
                </Text>
              </View>

              <View className="mt-4 flex-row gap-3">
                <Pressable
                  disabled={!inviteUrl}
                  onPress={copyLink}
                  className={`h-12 flex-1 flex-row items-center justify-center rounded-full bg-[#EEECEF] active:opacity-80 ${!inviteUrl ? 'opacity-50' : ''}`}
                >
                  <CopyIcon width={20} height={20} />
                  <Text className="ml-2 font-inter-semibold text-[14px] text-[#181027]">{t('family.copyLink')}</Text>
                </Pressable>
                <Pressable
                  disabled={!inviteUrl}
                  onPress={shareLink}
                  className={`h-12 flex-1 flex-row items-center justify-center rounded-full bg-[#181027] active:opacity-80 ${!inviteUrl ? 'opacity-50' : ''}`}
                >
                  <ShareIcon width={20} height={20} />
                  <Text className="ml-2 font-inter-semibold text-[14px] text-white">{t('family.shareLink')}</Text>
                </Pressable>
              </View>

              <Text className="mt-4 text-center font-inter-medium text-[12px] leading-[18px] text-[#9A96A2]">
                {t('family.inviteExpires')}
              </Text>
            </View>
          ) : null}

          {message ? (
            <View className="mt-4 flex-row items-start rounded-[18px] bg-white px-4 py-3">
              <Text className="flex-1 font-inter-medium text-[13px] leading-[19px] text-[#625D71]">
                {message}
              </Text>
              <Pressable onPress={() => setMessage('')} accessibilityRole="button" accessibilityLabel={t('common.close')} className="ml-2 p-1">
                <X size={17} color="#807B89" />
              </Pressable>
            </View>
          ) : null}

          {legacyMode ? (
            <View className="mt-5 rounded-[28px] bg-white p-5">
              <Text className="font-inter-bold text-[18px] text-[#181027]">{t('family.directInviteTitle')}</Text>
              <Text className="mt-1 font-inter-medium text-[13px] leading-[19px] text-[#807B89]">
                {t('family.directInviteBody')}
              </Text>

              <View className="mt-4 flex-row items-center rounded-[18px] bg-[#F2F1F3] px-3">
                <Search size={19} color="#807B89" />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  onSubmitEditing={search}
                  autoCapitalize="none"
                  placeholder={t('family.searchPlaceholder')}
                  placeholderTextColor="#AAA6B1"
                  className="ml-2 h-12 flex-1 font-inter-medium text-[15px] text-[#181027]"
                />
              </View>
              <Pressable
                disabled={searching}
                onPress={search}
                className="mt-3 h-11 items-center justify-center rounded-full bg-[#181027] active:opacity-80"
              >
                {searching ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="font-inter-semibold text-[14px] text-white">{t('family.search')}</Text>
                )}
              </Pressable>

              {results.map((account) => (
                <View key={account.id} className="mt-3 flex-row items-center rounded-[18px] bg-[#F5F4F6] p-3">
                  <View className="flex-1">
                    <Text className="font-inter-bold text-[15px] text-[#181027]">{account.name}</Text>
                    <Text className="mt-1 font-inter-medium text-[12px] text-[#807B89]">
                      {account.email || account.phone || t('family.account')}
                    </Text>
                  </View>
                  <Pressable
                    disabled={sendingId === String(account.id)}
                    onPress={() => sendDirectInvite(account)}
                    className="h-10 min-w-[82px] items-center justify-center rounded-full bg-[#181027] px-3 active:opacity-80"
                  >
                    {sendingId === String(account.id) ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <Text className="font-inter-semibold text-[13px] text-white">{t('family.sendInvite')}</Text>
                    )}
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
