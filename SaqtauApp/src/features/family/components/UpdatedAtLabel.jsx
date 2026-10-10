import { Text } from 'react-native';

import { formatUpdatedAt } from '@/src/features/family/family-controls.utils';
import useI18n from '@/src/features/localization/hooks/useI18n';

export default function UpdatedAtLabel({ value }) {
  const { t } = useI18n();
  const formatted = formatUpdatedAt(value);
  if (!formatted) return null;

  return (
    <Text className="mt-3 text-center font-inter-medium text-[11px] text-[#9C98A5]">
      {t('family.updated', { date: formatted })}
    </Text>
  );
}
