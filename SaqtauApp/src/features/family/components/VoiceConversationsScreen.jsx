import useI18n from '@/src/features/localization/hooks/useI18n';
import { MessageCircleMore } from 'lucide-react-native';
import { Text, View } from 'react-native';

import FamilySubpageShell from '@/src/features/family/components/FamilySubpageShell';
import FamilyToggleRow from '@/src/features/family/components/FamilyToggleRow';
import UpdatedAtLabel from '@/src/features/family/components/UpdatedAtLabel';
import useFamilyPermissions from '@/src/features/family/hooks/useFamilyPermissions';

export default function VoiceConversationsScreen({ accountId }) {
  const { t } = useI18n();
  const { permissions, updatedAt, loading, savingKey, error, available, reload, update } =
    useFamilyPermissions(accountId);

  return (
    <FamilySubpageShell
      title={t('family.voice')}
      subtitle={t('family.voiceSubtitle')}
      loading={loading}
      error={error}
      onRetry={reload}
    >
      <View className="mb-5 rounded-[26px] bg-[#181027] px-5 py-5">
        <View className="h-11 w-11 items-center justify-center rounded-full bg-white/10">
          <MessageCircleMore size={23} color="#FFFFFF" />
        </View>
        <Text className="mt-4 font-inter-extrabold text-[20px] tracking-[-0.4px] text-white">
          {t('family.voice')}
        </Text>
        <Text className="mt-2 font-inter-medium text-[13px] leading-[19px] text-[#D8D4DE]">
          {t('family.voiceSubtitle')}
        </Text>
      </View>

      <View className="overflow-hidden rounded-[24px] bg-white">
        <FamilyToggleRow
          title={t('family.voiceToggle')}
          subtitle={t('family.voiceToggleBody')}
          value={permissions.voice_conversations}
          saving={savingKey === 'voice_conversations'}
          disabled={!available || Boolean(savingKey)}
          onValueChange={(value) => update('voice_conversations', value)}
          isLast
        />
      </View>

      <UpdatedAtLabel value={updatedAt} />
    </FamilySubpageShell>
  );
}
