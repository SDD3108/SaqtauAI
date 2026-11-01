import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useAuthStore } from '@/src/features/auth/auth.store';
import useI18n from '@/src/features/localization/hooks/useI18n';
import useResultDescription from './useResultDescription';

function DescriptionContent({ measurementId, language, token, enabled }) {
  const { t } = useI18n();
  const { status, description, canRetry, retry } = useResultDescription(
    measurementId, language, token, enabled,
  );
  const loading = status === 'loading' || status === 'pending';
  const messageKey = {
    loading: 'checkin.descriptionLoading',
    pending: 'checkin.descriptionPending',
    waiting: 'checkin.descriptionWaiting',
    failed: 'checkin.descriptionError',
    error: 'checkin.descriptionError',
    unavailable: 'checkin.descriptionUnavailable',
    forbidden: 'checkin.descriptionForbidden',
  }[status];
  const showRetry = enabled && ['waiting', 'failed', 'error', 'unavailable'].includes(status);

  return (
    <View accessibilityLiveRegion="polite">
      {loading ? (
        <View className="mt-3 flex-row items-start">
          <ActivityIndicator size="small" color="#181027" accessibilityLabel={t('checkin.descriptionLoading')} />
          <Text className="ml-3 flex-1 font-inter text-[14px] leading-[21px] text-[#807B89]">
            {t(messageKey)}
          </Text>
        </View>
      ) : (
        <Text selectable={status === 'ready'} className="mt-2 font-inter text-[14px] leading-[21px] text-[#696372]">
          {status === 'ready' ? description : t(messageKey)}
        </Text>
      )}

      {showRetry ? (
        <>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t(status === 'waiting' ? 'checkin.checkAgain' : 'common.retry')}
            accessibilityState={{ disabled: !canRetry }}
            disabled={!canRetry}
            onPress={retry}
            className="mt-3 min-h-[44px] self-start items-center justify-center rounded-[13px] bg-[#181027] px-4 py-2 active:opacity-80 disabled:opacity-40"
          >
            <Text className="font-inter-semibold text-[13px] text-white">
              {t(status === 'waiting' ? 'checkin.checkAgain' : 'common.retry')}
            </Text>
          </Pressable>
          {!canRetry ? (
            <Text className="mt-2 font-inter text-[12px] leading-[18px] text-[#807B89]">
              {t('checkin.descriptionRetryLater')}
            </Text>
          ) : null}
        </>
      ) : null}
    </View>
  );
}

export default function ResultDescriptionCard({ measurement }) {
  const { t, language } = useI18n();
  const token = useAuthStore((state) => state.token);
  const accountId = useAuthStore((state) => state.account?.id);
  const id = measurement?.id == null ? '' : String(measurement.id);
  const enabled = Boolean(id && token && measurement?.status === 'completed');

  return (
    <View className="mt-5 rounded-[20px] bg-white px-4 py-4">
      <Text accessibilityRole="header" className="font-inter-semibold text-[14px] text-[#181027]">
        {t('checkin.descriptionTitle')}
      </Text>
      <DescriptionContent
        key={JSON.stringify([accountId, token, id, language, enabled])}
        measurementId={id}
        language={language}
        token={token}
        enabled={enabled}
      />
    </View>
  );
}
