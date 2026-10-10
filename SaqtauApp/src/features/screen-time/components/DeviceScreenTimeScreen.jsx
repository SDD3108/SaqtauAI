import {
  AppWindow,
  CheckCircle2,
  Clock3,
  RefreshCcw,
  ShieldCheck,
  Smartphone,
  Trash2,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Switch,
  Text,
  View,
} from 'react-native';

import TimePickerSheet from '@/src/features/family/components/TimePickerSheet';
import { formatMinutes } from '@/src/features/family/family-controls.utils';
import useI18n from '@/src/features/localization/hooks/useI18n';
import useDeviceScreenTime from '@/src/features/screen-time/hooks/useDeviceScreenTime';
import SettingsPage from '@/src/features/settings/components/SettingsPage';

const LIMIT_OPTIONS = [60, 90, 120, 180, 240];

function isApproved(status) {
  return String(status || '').toLowerCase().includes('approved');
}

function StatusPill({ approved, unavailable, children }) {
  return (
    <View
      accessibilityRole="text"
      className={`rounded-full px-3 py-1.5 ${
        approved
          ? 'bg-[#E6F1E8]'
          : unavailable
            ? 'bg-[#ECEAEC]'
            : 'bg-[#F4E7E8]'
      }`}
    >
      <Text
        className={`font-inter-semibold text-[11px] ${
          approved
            ? 'text-[#39724B]'
            : unavailable
              ? 'text-[#777180]'
              : 'text-[#A3434B]'
        }`}
      >
        {children}
      </Text>
    </View>
  );
}

function ActionButton({ title, subtitle, Icon, onPress, disabled, busy, danger }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={subtitle}
      accessibilityState={{ disabled: Boolean(disabled || busy), busy: Boolean(busy) }}
      disabled={disabled || busy}
      onPress={onPress}
      className={`mt-3 flex-row items-center gap-4 rounded-[20px] px-4 py-4 active:opacity-70 ${
        danger ? 'bg-[#FFF1F2]' : 'bg-white'
      } ${disabled ? 'opacity-45' : ''}`}
    >
      <View
        className={`h-11 w-11 items-center justify-center rounded-[14px] ${
          danger ? 'bg-[#F8DADD]' : 'bg-[#181027]'
        }`}
      >
        {busy ? (
          <ActivityIndicator color={danger ? '#9A303B' : '#FFFFFF'} />
        ) : (
          <Icon size={22} color={danger ? '#9A303B' : '#FFFFFF'} />
        )}
      </View>
      <View className="min-w-0 flex-1">
        <Text
          className={`font-inter-semibold text-[16px] ${
            danger ? 'text-[#9A303B]' : 'text-[#181027]'
          }`}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text className="mt-1 font-inter-medium text-[12px] leading-[17px] text-[#86808E]">
            {subtitle}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

export default function DeviceScreenTimeScreen() {
  const { t } = useI18n();
  const {
    status,
    policy,
    policySource,
    serverNote,
    loading,
    busy,
    error,
    age,
    recommendedMode,
    refresh,
    requestAccess,
    chooseApps,
    applyPolicy,
    clearPolicy,
    clearSelection,
    setDailyLimit,
    setQuietHours,
  } = useDeviceScreenTime();

  const [picker, setPicker] = useState(null);
  const approved = isApproved(status?.authorizationStatus);
  const unavailable = status?.available === false;
  const selection = status?.selection || {
    applications: 0,
    categories: 0,
    webDomains: 0,
    total: 0,
  };
  const hasSelection = Number(selection.total || 0) > 0;
  const monitoring = Boolean(status?.monitoring);

  const statusLabel = useMemo(() => {
    const value = String(status?.authorizationStatus || 'notDetermined');
    if (value.toLowerCase().includes('approved')) return t('screenTime.approved');
    if (value === 'denied') return t('screenTime.denied');
    if (value === 'unavailable') return t('screenTime.unavailable');
    return t('common.notRequested');
  }, [status?.authorizationStatus, t]);

  const policySourceLabel = useMemo(() => {
    if (policySource === 'family') return t('screenTime.policy');
    if (policySource === 'device') return t('screenTime.savedDevice');
    return t('screenTime.localDraft');
  }, [policySource, t]);

  const selectionLabel = hasSelection
    ? Number(selection.total) === 1
      ? t('screenTime.selectionOne')
      : t('screenTime.selectionMany', { count: selection.total })
    : t('screenTime.nothingSelected');

  return (
    <SettingsPage
      title={t('screenTime.appleTitle')}
      subtitle={t('screenTime.appleSubtitle')}
    >
      <View className="rounded-[26px] bg-[#181027] px-5 py-5">
        <View className="flex-row items-start justify-between gap-3">
          <View className="h-12 w-12 items-center justify-center rounded-[16px] bg-white/10">
            <ShieldCheck size={25} color="#FFFFFF" />
          </View>
          <StatusPill approved={approved} unavailable={unavailable}>
            {statusLabel}
          </StatusPill>
        </View>
        <Text accessibilityRole="header" className="mt-4 font-inter-extrabold text-[22px] tracking-[-0.5px] text-white">
          {t('screenTime.realEnforcement')}
        </Text>
        <Text className="mt-2 font-inter-medium text-[13px] leading-[19px] text-[#D8D4DE]">
          {t('screenTime.realEnforcementBody')}
        </Text>
      </View>

      {loading ? (
        <View accessibilityLiveRegion="polite" className="mt-5 items-center rounded-[20px] bg-white px-4 py-6">
          <ActivityIndicator color="#181027" />
          <Text className="mt-3 font-inter-medium text-[13px] text-[#777180]">
            {t('screenTime.readingStatus')}
          </Text>
        </View>
      ) : null}

      {!loading && unavailable ? (
        <View accessibilityLiveRegion="polite" className="mt-5 rounded-[20px] bg-[#FFF6E8] px-4 py-4">
          <Text className="font-inter-bold text-[15px] text-[#6A4A16]">
            {t('screenTime.nativeUnavailable')}
          </Text>
          <Text className="mt-1 font-inter-medium text-[12px] leading-[18px] text-[#846A42]">
            {t('screenTime.nativeUnavailableBody')}
          </Text>
        </View>
      ) : null}

      {!approved && !unavailable ? (
        <View className="mt-5 rounded-[22px] bg-white px-4 py-4">
          <View className="flex-row items-center gap-3">
            <Smartphone size={22} color="#181027" />
            <View className="min-w-0 flex-1">
              <Text className="font-inter-bold text-[16px] text-[#181027]">
                {t('screenTime.authorizeIphone')}
              </Text>
              <Text className="mt-1 font-inter-medium text-[12px] leading-[18px] text-[#827C8B]">
                {recommendedMode === 'child'
                  ? age !== null
                    ? t('screenTime.childAuthWithAge', { age })
                    : t('screenTime.childAuthNoAge')
                  : t('screenTime.individualAuthBody')}
              </Text>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('screenTime.requestAccess')}
            accessibilityState={{ busy: busy === 'authorization', disabled: busy === 'authorization' }}
            onPress={() => requestAccess()}
            disabled={busy === 'authorization'}
            className="mt-4 min-h-[50px] items-center justify-center rounded-[16px] bg-[#181027] px-4 active:opacity-80"
          >
            {busy === 'authorization' ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="font-inter-bold text-[15px] text-white">
                {t('screenTime.requestAccess')}
              </Text>
            )}
          </Pressable>
          {recommendedMode === 'child' ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('screenTime.devIndividual')}
              accessibilityState={{ disabled: busy === 'authorization' }}
              onPress={() => requestAccess('individual')}
              disabled={busy === 'authorization'}
              className="mt-2 min-h-[44px] items-center justify-center rounded-[14px] bg-[#F2F0F3] px-4 active:opacity-70"
            >
              <Text className="font-inter-semibold text-[13px] text-[#625C6B]">
                {t('screenTime.devIndividual')}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {approved ? (
        <>
          <View className="mt-5 rounded-[22px] bg-[#F7F7F8] px-4 py-4">
            <View className="flex-row items-center justify-between gap-3">
              <View className="min-w-0 flex-row items-center gap-3">
                <View className="h-10 w-10 items-center justify-center rounded-[13px] bg-[#181027]">
                  <AppWindow size={21} color="#FFFFFF" />
                </View>
                <View className="min-w-0 flex-1">
                  <Text className="font-inter-bold text-[16px] text-[#181027]">
                    {t('screenTime.appsWebsites')}
                  </Text>
                  <Text className="mt-0.5 font-inter-medium text-[12px] text-[#817B89]">
                    {selectionLabel}
                  </Text>
                </View>
              </View>
              {hasSelection ? <CheckCircle2 size={22} color="#39724B" /> : null}
            </View>
            <Text className="mt-3 font-inter-medium text-[12px] leading-[18px] text-[#8A8491]">
              {t('screenTime.opaqueTokensBody')}
            </Text>
            <View className="mt-4 flex-row gap-2">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('screenTime.chooseApps')}
                accessibilityState={{ busy: busy === 'picker', disabled: busy === 'picker' }}
                onPress={chooseApps}
                disabled={busy === 'picker'}
                className="min-h-[46px] flex-1 items-center justify-center rounded-[14px] bg-[#181027] px-3 active:opacity-80"
              >
                {busy === 'picker' ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="font-inter-bold text-[13px] text-white">
                    {t('screenTime.chooseApps')}
                  </Text>
                )}
              </Pressable>
              {hasSelection ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('common.clear')}
                  onPress={clearSelection}
                  disabled={busy === 'selection'}
                  className="min-h-[46px] items-center justify-center rounded-[14px] bg-[#E9E7EC] px-4 active:opacity-70"
                >
                  <Text className="font-inter-semibold text-[13px] text-[#625C6B]">
                    {t('common.clear')}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </View>

          <View className="mt-4 rounded-[22px] bg-white px-4 py-4">
            <View className="flex-row items-center gap-3">
              <Clock3 size={21} color="#181027" />
              <View className="flex-1">
                <Text className="font-inter-bold text-[16px] text-[#181027]">
                  {t('screenTime.dailyLimit')}
                </Text>
                <Text className="mt-0.5 font-inter-medium text-[12px] text-[#817B89]">
                  {formatMinutes(policy.daily_limit_minutes)} · {policySourceLabel}
                </Text>
              </View>
            </View>
            <View className="mt-4 flex-row flex-wrap gap-2">
              {LIMIT_OPTIONS.map((minutes) => {
                const selected = Number(policy.daily_limit_minutes) === minutes;
                return (
                  <Pressable
                    key={minutes}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={formatMinutes(minutes)}
                    onPress={() => setDailyLimit(minutes)}
                    className={`rounded-full px-4 py-2.5 ${
                      selected ? 'bg-[#181027]' : 'bg-[#EEECEF]'
                    }`}
                  >
                    <Text
                      className={`font-inter-semibold text-[12px] ${
                        selected ? 'text-white' : 'text-[#5E5867]'
                      }`}
                    >
                      {formatMinutes(minutes)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View className="mt-4 rounded-[22px] bg-white px-4 py-4">
            <View className="flex-row items-center justify-between gap-3">
              <View className="min-w-0 flex-1">
                <Text className="font-inter-bold text-[16px] text-[#181027]">
                  {t('screenTime.quietHours')}
                </Text>
                <Text className="mt-1 font-inter-medium text-[12px] leading-[18px] text-[#817B89]">
                  {t('screenTime.quietShieldBody')}
                </Text>
              </View>
              <Switch
                accessibilityRole="switch"
                accessibilityLabel={t('screenTime.quietHours')}
                accessibilityState={{ checked: Boolean(policy.quiet_hours.enabled) }}
                value={Boolean(policy.quiet_hours.enabled)}
                onValueChange={(enabled) => setQuietHours({ enabled })}
                trackColor={{ false: '#D8D5DA', true: '#554C67' }}
                thumbColor="#FFFFFF"
              />
            </View>
            {policy.quiet_hours.enabled ? (
              <View className="mt-4 flex-row gap-2">
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${t('screenTime.quietFrom')} ${policy.quiet_hours.from}`}
                  onPress={() => setPicker('from')}
                  className="flex-1 rounded-[15px] bg-[#F3F1F4] px-4 py-3 active:opacity-70"
                >
                  <Text className="font-inter-medium text-[11px] text-[#918B9D]">
                    {t('screenTime.quietFrom')}
                  </Text>
                  <Text className="mt-1 font-inter-bold text-[17px] text-[#181027]">
                    {policy.quiet_hours.from}
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${t('screenTime.quietTo')} ${policy.quiet_hours.to}`}
                  onPress={() => setPicker('to')}
                  className="flex-1 rounded-[15px] bg-[#F3F1F4] px-4 py-3 active:opacity-70"
                >
                  <Text className="font-inter-medium text-[11px] text-[#918B9D]">
                    {t('screenTime.quietTo')}
                  </Text>
                  <Text className="mt-1 font-inter-bold text-[17px] text-[#181027]">
                    {policy.quiet_hours.to}
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </View>

          <ActionButton
            title={monitoring ? t('screenTime.updatePolicy') : t('screenTime.apply')}
            subtitle={hasSelection ? t('screenTime.applyBody') : t('screenTime.chooseFirst')}
            Icon={ShieldCheck}
            onPress={applyPolicy}
            disabled={!hasSelection}
            busy={busy === 'apply'}
          />

          {monitoring ? (
            <ActionButton
              title={t('screenTime.clear')}
              subtitle={t('screenTime.clearBody')}
              Icon={Trash2}
              onPress={clearPolicy}
              busy={busy === 'clear'}
              danger
            />
          ) : null}
        </>
      ) : null}

      {serverNote ? (
        <View accessibilityLiveRegion="polite" className="mt-4 rounded-[18px] bg-[#F2F0F3] px-4 py-3">
          <Text className="font-inter-medium text-[12px] leading-[18px] text-[#716B78]">
            {serverNote}
          </Text>
        </View>
      ) : null}

      {error ? (
        <View accessibilityLiveRegion="assertive" className="mt-4 rounded-[18px] bg-[#FFF0F1] px-4 py-3">
          <Text className="font-inter-semibold text-[12px] leading-[18px] text-[#9A303B]">
            {error}
          </Text>
        </View>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('screenTime.refreshStatus')}
        onPress={refresh}
        className="mt-4 flex-row items-center justify-center gap-2 py-3 active:opacity-70"
      >
        <RefreshCcw size={16} color="#777180" />
        <Text className="font-inter-semibold text-[12px] text-[#777180]">
          {t('screenTime.refreshStatus')}
        </Text>
      </Pressable>

      <View className="mt-2 rounded-[20px] bg-[#E9E7EC] px-4 py-4">
        <View className="flex-row items-start gap-3">
          <Smartphone size={20} color="#625C6B" />
          <Text className="flex-1 font-inter-medium text-[12px] leading-[18px] text-[#625C6B]">
            {t('screenTime.familyEnforcementNote')}
          </Text>
        </View>
      </View>

      <TimePickerSheet
        visible={picker === 'from'}
        title={t('screenTime.start')}
        value={policy.quiet_hours.from}
        onClose={() => setPicker(null)}
        onConfirm={(value) => {
          setQuietHours({ from: value });
          setPicker(null);
        }}
      />
      <TimePickerSheet
        visible={picker === 'to'}
        title={t('screenTime.end')}
        value={policy.quiet_hours.to}
        onClose={() => setPicker(null)}
        onConfirm={(value) => {
          setQuietHours({ to: value });
          setPicker(null);
        }}
      />
    </SettingsPage>
  );
}
