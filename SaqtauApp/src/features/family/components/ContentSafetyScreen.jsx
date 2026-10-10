import useI18n from '@/src/features/localization/hooks/useI18n';
import { ShieldCheck } from 'lucide-react-native';
import { Text, View } from 'react-native';

import FamilySubpageShell from '@/src/features/family/components/FamilySubpageShell';
import FamilyToggleRow from '@/src/features/family/components/FamilyToggleRow';
import UpdatedAtLabel from '@/src/features/family/components/UpdatedAtLabel';
import useFamilyPermissions from '@/src/features/family/hooks/useFamilyPermissions';

export default function ContentSafetyScreen({ accountId }) {
  const { t } = useI18n();
  const { permissions, updatedAt, loading, savingKey, error, available, reload, update } =
    useFamilyPermissions(accountId);

  return (
    <FamilySubpageShell
      title={t('family.contentSafety')}
      subtitle={t('family.contentSafetySubtitle')}
      loading={loading}
      error={error}
      onRetry={reload}
    >
      <View className="mb-5 rounded-[26px] bg-white px-5 py-5">
        <View className="h-11 w-11 items-center justify-center rounded-full bg-[#EEECEF]">
          <ShieldCheck size={23} color="#181027" />
        </View>
        <Text className="mt-4 font-inter-extrabold text-[20px] tracking-[-0.4px] text-[#181027]">
          {t('family.contentSafety')}
        </Text>
        <Text className="mt-2 font-inter-medium text-[13px] leading-[19px] text-[#807B89]">
          {t('family.contentSafetySubtitle')}
        </Text>
      </View>

      <View className="overflow-hidden rounded-[24px] bg-white">
        <FamilyToggleRow
          title={t('family.safetyToggle')}
          subtitle={t('family.safetyToggleBody')}
          value={permissions.content_safety}
          saving={savingKey === 'content_safety'}
          disabled={!available || Boolean(savingKey)}
          onValueChange={(value) => update('content_safety', value)}
          isLast
        />
      </View>

      <UpdatedAtLabel value={updatedAt} />
    </FamilySubpageShell>
  );
}
