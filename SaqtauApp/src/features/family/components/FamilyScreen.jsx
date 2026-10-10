import { router } from 'expo-router';
import { RefreshCw } from 'lucide-react-native';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AddIcon from '@/assets/images/add.svg';
import InviteFamilyIcon from '@/assets/images/invite family.svg';
import PrivateIcon from '@/assets/images/private.svg';
import FamilyMemberCard from '@/src/features/family/components/FamilyMemberCard';
import PendingInviteCard from '@/src/features/family/components/PendingInviteCard';
import useFamily from '@/src/features/family/hooks/useFamily';
import useI18n from '@/src/features/localization/hooks/useI18n';

export default function FamilyScreen() {
  const { t } = useI18n();
  const {
    members,
    max,
    invites,
    loading,
    refreshing,
    error,
    actionId,
    reload,
    refresh,
    acceptInvite,
    declineInvite,
  } = useFamily();

  const openInvite = () => router.push('/(app)/family/invite');

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#ECECEC]">
        <ActivityIndicator color="#181027" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#ECECEC]" edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 130 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#181027" />
        }
      >
        <View className="px-5 pb-2 pt-3">
          <View className="relative min-h-[54px] flex-row items-center justify-start">
            <Text className="font-inter-extrabold text-[32px] tracking-[-1px] text-[#181027]">
              {t('family.title')}
            </Text>
            <Pressable
              onPress={openInvite}
              accessibilityRole="button"
              accessibilityLabel={t('family.invite')}
              className="absolute right-0 h-12 w-12 items-center justify-center rounded-full bg-white active:opacity-80"
            >
              <AddIcon width={24} height={24} />
            </Pressable>
          </View>

          <Text className="mt-1 text-start font-inter-medium text-[15px] leading-[22px] text-[#8B8794]">
            {t('family.subtitle')}
          </Text>
        </View>

        <View className="mt-6 px-5">
          {error ? (
            <View className="mb-4 flex-row items-center rounded-[20px] bg-white px-4 py-3">
              <Text className="flex-1 font-inter-medium text-[13px] leading-[18px] text-[#6F6978]">
                {error}
              </Text>
              <Pressable onPress={reload} accessibilityRole="button" accessibilityLabel={t('common.retry')} className="ml-3 h-9 w-9 items-center justify-center rounded-full bg-[#EEECEF]">
                <RefreshCw size={17} color="#181027" />
              </Pressable>
            </View>
          ) : null}

          {invites.length > 0 ? (
            <View className="mb-5">
              <Text className="mb-3 font-inter-bold text-[20px] tracking-[-0.4px] text-[#181027]">
                {t('family.invitations')}
              </Text>
              {invites.map((invite) => (
                <PendingInviteCard
                  key={invite.id}
                  invite={invite}
                  busy={actionId === invite.id}
                  onAccept={() => acceptInvite(invite.id)}
                  onDecline={() => declineInvite(invite.id)}
                />
              ))}
            </View>
          ) : null}

          <View className="mb-3 flex-row items-end justify-between">
            <Text className="font-inter-bold text-[20px] tracking-[-0.4px] text-[#181027]">
              {t('family.connected')}
            </Text>
            <Text className="font-inter-medium text-[13px] text-[#8B8794]">
              {members.length}/{max}
            </Text>
          </View>

          {members.length ? (
            members.map((member) => (
              <FamilyMemberCard
                key={member.accountId}
                member={member}
                onPress={() =>
                  router.push({
                    pathname: '/(app)/family/[accountId]',
                    params: { accountId: member.accountId },
                  })
                }
              />
            ))
          ) : (
            <View className="rounded-[28px] bg-white px-5 py-6">
              <View className="h-16 w-16 items-center justify-center rounded-full bg-[#EEECEF]">
                <InviteFamilyIcon width={34} height={34} />
              </View>
              <Text className="mt-4 font-inter-bold text-[20px] tracking-[-0.4px] text-[#181027]">
                {t('family.emptyTitle')}
              </Text>
              <Text className="mt-2 font-inter-medium text-[14px] leading-[21px] text-[#807B89]">
                {t('family.emptyBody')}
              </Text>
              <Pressable
                onPress={openInvite}
                className="mt-5 h-12 items-center justify-center rounded-full bg-[#181027] active:opacity-80"
              >
                <Text className="font-inter-semibold text-[15px] text-white">{t('family.invite')}</Text>
              </Pressable>
            </View>
          )}

          {members.length ? (
            <Pressable
              onPress={openInvite}
              className="mt-3 flex-row items-center rounded-[24px] bg-white px-4 py-4 active:opacity-80"
            >
              <View className="h-12 w-12 items-center justify-center rounded-full bg-[#EEECEF]">
                <InviteFamilyIcon width={27} height={27} />
              </View>
              <View className="ml-4 flex-1">
                <Text className="font-inter-bold text-[17px] text-[#181027]">{t('family.invite')}</Text>
                <Text className="mt-1 font-inter-medium text-[13px] text-[#807B89]">
                  {t('family.inviteSubtitle')}
                </Text>
              </View>
            </Pressable>
          ) : null}

          <View className="mt-6 flex-row items-start rounded-[24px] bg-[#E2E0E4] px-4 py-4">
            <PrivateIcon width={28} height={28} />
            <Text className="ml-3 flex-1 font-inter-medium text-[13px] leading-[20px] text-[#625D71]">
              {t('family.private')}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
