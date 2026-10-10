import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import InviteIcon from '@/assets/images/invite family.svg';
import { formatRelativeDate } from '@/src/features/family/family.utils';
import useI18n from '@/src/features/localization/hooks/useI18n';

export default function PendingInviteCard({
  invite,
  busy,
  onAccept,
  onDecline,
}) {
  const { t } = useI18n();
  const incoming = invite.direction === 'incoming';

  return (
    <View className="mb-3 rounded-[24px] bg-white p-4">
      <View className="flex-row items-center">
        <View className="h-12 w-12 items-center justify-center rounded-full bg-[#EEECEF]">
          <InviteIcon width={28} height={28} />
        </View>
        <View className="ml-3 flex-1">
          <Text className="font-inter-bold text-[16px] text-[#181027]">
            {invite.counterpartName}
          </Text>
          <Text className="mt-1 font-inter-medium text-[13px] text-[#807B89]">
            {incoming ? t('family.invitedYou') : t('family.invitationSent')}
          </Text>
          {invite.createdAt ? (
            <Text className="mt-1 font-inter-medium text-[12px] text-[#AAA6B1]">
              {formatRelativeDate(invite.createdAt)}
            </Text>
          ) : null}
        </View>
      </View>

      {incoming ? (
        <View className="mt-4 flex-row gap-3">
          <Pressable
            disabled={busy}
            onPress={onDecline}
            className="h-11 flex-1 items-center justify-center rounded-full bg-[#EEECEF] active:opacity-80"
          >
            <Text className="font-inter-semibold text-[14px] text-[#181027]">{t('family.decline')}</Text>
          </Pressable>
          <Pressable
            disabled={busy}
            onPress={onAccept}
            className="h-11 flex-1 items-center justify-center rounded-full bg-[#181027] active:opacity-80"
          >
            {busy ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="font-inter-semibold text-[14px] text-white">{t('family.accept')}</Text>
            )}
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
