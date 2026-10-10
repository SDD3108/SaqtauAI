import { router } from 'expo-router';
import { ExternalLink, HeartPulse, ShieldCheck, ChevronRight, Info } from 'lucide-react-native';
import { useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';

import useI18n from '@/src/features/localization/hooks/useI18n';
import SettingsPage from '@/src/features/settings/components/SettingsPage';
import { RELEASE_DETAILS, RELEASE_LINKS } from '@/src/features/release/release.config';

function SectionCard({ title, children }) {
  return (
    <View className="mb-5 rounded-[22px] bg-[#F7F7F8] px-5 py-5">
      <Text accessibilityRole="header" className="mb-3 font-inter-semibold text-[17px] text-[#181027]">{title}</Text>
      {children}
    </View>
  );
}

function DetailRow({ title, value }) {
  return (
    <View className="flex-row items-center justify-between py-2">
      <Text className="font-inter text-[14px] text-[#726D7A]">{title}</Text>
      <Text className="ml-5 font-inter-semibold text-[14px] text-[#181027]">{value}</Text>
    </View>
  );
}

function InfoParagraph({ children }) {
  return <Text className="mb-3 font-inter text-[13px] leading-[20px] text-[#77717F]">{children}</Text>;
}

function LinkRow({ label, onPress, disabled = false, Icon = ExternalLink }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      className="min-h-[52px] flex-row items-center border-t border-[#E5E3E8] py-3 active:opacity-70"
    >
      <Icon size={19} color="#181027" />
      <Text className="ml-3 flex-1 font-inter-semibold text-[14px] text-[#181027]">{label}</Text>
      <ChevronRight size={20} color="#9994A0" />
    </Pressable>
  );
}

export default function AboutSaqtauScreen() {
  const { t } = useI18n();
  const [openError, setOpenError] = useState(false);

  async function openVerifiedLink(value) {
    if (!value) return;
    setOpenError(false);
    try {
      await Linking.openURL(value);
    } catch {
      setOpenError(true);
    }
  }

  return (
    <SettingsPage title={t('about.title')} subtitle={t('about.subtitle')}>
      <View className="mb-5 items-center rounded-[22px] bg-white px-5 py-6">
        <HeartPulse size={42} color="#208AEF" strokeWidth={1.8} />
        <Text className="mt-3 font-inter-extrabold text-[24px] text-[#181027]">SaqtauAI</Text>
        <Text className="mt-3 text-center font-inter text-[13px] leading-[20px] text-[#77717F]">{t('about.description')}</Text>
      </View>

      <SectionCard title={t('about.appVersion')}>
        <DetailRow title={t('about.appVersion')} value={RELEASE_DETAILS.version} />
        <DetailRow title={t('about.build')} value={RELEASE_DETAILS.buildNumber} />
        {__DEV__ ? <DetailRow title={t('about.environment')} value={RELEASE_DETAILS.environment} /> : null}
      </SectionCard>

      <SectionCard title={t('about.dataTitle')}>
        <InfoParagraph>{t('about.measurements')}</InfoParagraph>
        <InfoParagraph>{t('about.voice')}</InfoParagraph>
        <InfoParagraph>{t('about.ai')}</InfoParagraph>
        <InfoParagraph>{t('about.family')}</InfoParagraph>
        <InfoParagraph>{t('about.preferences')}</InfoParagraph>
        <LinkRow Icon={ShieldCheck} label={t('about.dataSettings')} onPress={() => router.push('/(app)/settings/privacy')} />
      </SectionCard>

      <SectionCard title={t('about.privacyPolicy')}>
        {RELEASE_LINKS.privacyPolicy ? (
          <LinkRow label={t('about.privacyPolicy')} onPress={() => openVerifiedLink(RELEASE_LINKS.privacyPolicy)} />
        ) : (
          <InfoParagraph>{t('about.privacyUnavailable')}</InfoParagraph>
        )}
        {RELEASE_LINKS.support ? (
          <LinkRow label={t('about.support')} onPress={() => openVerifiedLink(RELEASE_LINKS.support)} />
        ) : (
          <InfoParagraph>{t('about.supportUnavailable')}</InfoParagraph>
        )}
        {openError ? (
          <Text accessibilityLiveRegion="polite" className="mt-2 font-inter text-[13px] text-[#A04545]">{t('about.openFailed')}</Text>
        ) : null}
      </SectionCard>

      <View className="mb-6 flex-row items-start rounded-[18px] bg-[#ECE8F2] p-4">
        <Info size={18} color="#685877" />
        <Text className="ml-3 flex-1 font-inter text-[12px] leading-[19px] text-[#685877]">{t('about.legalNote')}</Text>
      </View>
    </SettingsPage>
  );
}
