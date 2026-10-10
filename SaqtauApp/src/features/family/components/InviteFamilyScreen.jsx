import useI18n from '@/src/features/localization/hooks/useI18n';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { ArrowLeft, Copy, Search, Share2, X } from 'lucide-react-native';
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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import QRCode from 'react-native-qrcode-svg';
import InviteFamilyNavigation from '@/src/features/family/components/InviteFamilyNavigation';
import InviteFamilyPicture from '@/assets/images/family-invite/hero.png';
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

function InvitationQr({ value, t }) {
  const [failed, setFailed] = useState(false);
  return (
    <View
      accessibilityLabel={failed ? t('family.qrUnavailable') : t('family.qrLabel')}
      className="mt-3 items-center justify-center self-center rounded-[13px] bg-white p-3"
      style={{ minWidth: 168, minHeight: 168, boxShadow: '0px 2px 5px rgba(0, 0, 0, 0.18)' }}
    >
      {failed ? (
        <Text className="max-w-[160px] text-center font-inter-medium text-[13px] leading-[19px] text-[#807B89]">
          {t('family.qrUnavailable')}
        </Text>
      ) : (
        <QRCode value={value} size={144} quietZone={8} color="#181027" backgroundColor="white" ecl="M" onError={() => setFailed(true)} />
      )}
    </View>
  );
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
    <SafeAreaView className="flex-1 bg-[#ECECEC]" edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 20 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ width: '100%', maxWidth: 560, alignSelf: 'center' }}>
            <View className="mt-5 flex-row items-center px-1">
              <Pressable
                onPress={() => router.back()}
                accessibilityRole="button"
                accessibilityLabel={t('common.back')}
                className="h-11 w-11 items-center justify-center active:opacity-60"
              >
                <ArrowLeft size={30} strokeWidth={2.3} color="#181027" />
              </Pressable>
              <Text accessibilityRole="header" className="flex-1 text-center font-inter-bold text-[27px] leading-[34px] tracking-[-0.7px] text-[#181027]">
                {t('family.inviteTitle')}
              </Text>
              <View className="w-11" />
            </View>
            <Text className="mt-3 max-w-[330px] self-center px-3 text-center font-inter-medium text-[14px] leading-[20px] text-[#807B89]">
              {t('family.designInviteBody')}
            </Text>

            <Image
              source={InviteFamilyPicture}
              resizeMode="contain"
              accessible={false}
              style={{ width: '100%', marginTop:20,height:207 }}
            />

            {!legacyMode ? (
              <View className="rounded-[20px] bg-[#F7F7F8] px-5 pb-4 pt-4" style={{ boxShadow: '0px 2px 5px rgba(0, 0, 0, 0.16)' }}>
                <Text accessibilityRole="header" className="text-center font-inter-semibold text-[17px] leading-[23px] tracking-[-0.3px] text-[#181027]">
                  {t('family.shareInvitation')}
                </Text>
                <Text className="mt-1.5 text-center font-inter-medium text-[14px] leading-[20px] text-[#807B89]">
                  {t('family.scanOrLink')}
                </Text>

                {!invite ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('family.createLink')}
                    disabled={creating}
                    onPress={createLink}
                    className="mt-5 min-h-[52px] items-center justify-center rounded-full bg-[#181027] px-4 py-3 active:opacity-70 disabled:opacity-60"
                  >
                    {creating ? <ActivityIndicator color="white" /> : <Text className="text-center font-inter-semibold text-[15px] text-white">{t('family.createLink')}</Text>}
                  </Pressable>
                ) : null}

                {invite ? (
                  <>
                    {inviteUrl ? <InvitationQr key={inviteUrl} value={inviteUrl} t={t} /> : null}
                    <Text className="mt-3 text-center font-inter-medium text-[13px] leading-[19px] text-[#807B89]">
                      {t('family.yourInviteLink')}
                    </Text>
                    <Text selectable className="mt-1 text-center font-inter-medium text-[11px] leading-[16px] text-[#807B89]">
                      {inviteUrl || t('family.noShareUrl')}
                    </Text>
                    <View className="mt-4 flex-row gap-3">
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={t('family.copyLink')}
                        disabled={!inviteUrl}
                        onPress={copyLink}
                        className="min-h-[46px] flex-1 flex-row items-center justify-center gap-2 rounded-full bg-[#F7F7F8] px-2 py-3 active:opacity-65 disabled:opacity-50"
                        style={{ boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.18)' }}
                      >
                        <Copy size={20} color="#807B89" />
                        <Text className="shrink text-center font-inter-semibold text-[14px] leading-[19px] text-[#807B89]">{t('family.copyLink')}</Text>
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={t('family.shareLink')}
                        disabled={!inviteUrl}
                        onPress={shareLink}
                        className="min-h-[46px] flex-1 flex-row items-center justify-center gap-2 rounded-full bg-[#F7F7F8] px-2 py-3 active:opacity-65 disabled:opacity-50"
                        style={{ boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.18)' }}
                      >
                        <Share2 size={20} color="#807B89" />
                        <Text className="shrink text-center font-inter-semibold text-[14px] leading-[19px] text-[#807B89]">{t('family.shareLink')}</Text>
                      </Pressable>
                    </View>
                    <Text className="mt-4 text-center font-inter-medium text-[11px] leading-[16px] text-[#9A96A2]">
                      {t('family.inviteExpires')}
                    </Text>
                  </>
                ) : null}
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
      </KeyboardAvoidingView>
      <InviteFamilyNavigation disabled={creating || searching || Boolean(sendingId)} />
    </SafeAreaView>
  );
}
