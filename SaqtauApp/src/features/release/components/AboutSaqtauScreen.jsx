import { router } from 'expo-router';
import {
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  Globe,
  HeartPulse,
  Info,
  Instagram,
  ShieldCheck,
} from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Linking, Pressable, Text, View } from 'react-native';

import Logo from '@/assets/images/Logo.svg';
import useI18n from '@/src/features/localization/hooks/useI18n';
import { RELEASE_DETAILS, RELEASE_LINKS } from '@/src/features/release/release.config';
import SettingsPage from '@/src/features/settings/components/SettingsPage';

const WEBSITE = 'https://saqtauai.com/';
const INSTAGRAM = 'https://www.instagram.com/saqtau.ai/';

function SectionHeading({ children }) {
  return (
    <Text accessibilityRole="header" className="mb-3 ml-1 mt-7 font-inter-bold text-[19px] leading-6 tracking-[-0.4px] text-[#181027]">
      {children}
    </Text>
  );
}

function LinkRow({ label, detail, Icon = Globe, onPress, external = false }) {
  const Arrow = external ? ArrowUpRight : ChevronRight;

  return (
    <Pressable
      accessibilityRole={external ? 'link' : 'button'}
      accessibilityLabel={detail ? `${label}, ${detail}` : label}
      onPress={onPress}
      className="min-h-[72px] flex-row items-center px-4 py-4 active:opacity-60"
    >
      <View className="h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[#F0EDF5]">
        <Icon size={20} strokeWidth={1.7} color="#685877" />
      </View>
      <View className="ml-3 flex-1">
        <Text className="font-inter-semibold text-[15px] leading-[21px] text-[#181027]">{label}</Text>
        {detail ? <Text className="mt-1 font-inter text-[13px] leading-[19px] text-[#81798C]">{detail}</Text> : null}
      </View>
      <Arrow size={19} color="#918B9D" style={{ marginLeft: 10 }} />
    </Pressable>
  );
}

function Divider() {
  return <View className="mx-4 h-px bg-[#EEEAF1]" />;
}

function TeamMember({ initials, name, role }) {
  return (
    <View className="flex-row items-center px-4 py-5">
      <View accessible={false} className="h-12 w-12 shrink-0 items-center justify-center rounded-[17px] bg-[#ECE8F2]">
        <Text className="font-inter-bold text-[16px] text-[#685877]">{initials}</Text>
      </View>
      <View className="ml-4 flex-1">
        <Text className="font-inter-bold text-[17px] leading-[23px] tracking-[-0.3px] text-[#181027]">{name}</Text>
        <Text className="mt-1 font-inter-medium text-[13px] leading-[19px] text-[#81798C]">{role}</Text>
      </View>
    </View>
  );
}

function DetailRow({ title, value }) {
  return (
    <View className="flex-row items-start justify-between py-1.5">
      <Text className="flex-1 font-inter text-[12px] leading-[18px] text-[#918B9D]">{title}</Text>
      <Text className="ml-4 max-w-[55%] shrink font-inter-medium text-right text-[12px] leading-[18px] text-[#71697E]">{value}</Text>
    </View>
  );
}

export default function AboutSaqtauScreen() {
  const { t } = useI18n();
  const [dataOpen, setDataOpen] = useState(false);

  async function openLink(url) {
    if (!url) return;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(t('about.openFailed'), t('about.linkRetry'));
    }
  }

  return (
    <SettingsPage title={t('about.title')}>
      <View className="rounded-[28px] bg-white p-5">
        <View className="flex-row items-center">
          <View accessible={false} className="shrink-0">
            <Logo width={50} height={48} />
          </View>
          <Text accessibilityRole="header" className="ml-3 flex-1 font-inter-extrabold text-[30px] leading-[36px] tracking-[-1px] text-[#181027]">
            Saqtau AI
          </Text>
        </View>

        <View className="mt-5 self-start rounded-full bg-[#F0EDF5] px-3 py-2">
          <Text className="font-inter-semibold text-[11px] leading-4 text-[#685877]">{t('about.origin')}</Text>
        </View>
        <Text className="mt-5 font-inter-bold text-[27px] leading-[33px] tracking-[-0.8px] text-[#181027]">{t('about.tagline')}</Text>
        <Text className="mt-3 font-inter text-[14px] leading-[22px] text-[#77717F]">{t('about.story')}</Text>

        <View className="mt-5 flex-row flex-wrap gap-2">
          {['about.featureCheckIn', 'about.featureTrends', 'about.featureAi', 'about.featureFamily'].map((key) => (
            <View key={key} className="rounded-full border border-[#E9E5ED] px-3 py-2">
              <Text className="font-inter-medium text-[12px] leading-4 text-[#71697E]">{t(key)}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className="mt-4 rounded-[26px] bg-[#181027] p-5">
        <View className="flex-row items-center justify-between">
          <Text className="flex-1 font-inter-semibold text-[12px] leading-[18px] tracking-[1px] text-[#C9BED9]">rPPG</Text>
          <Logo width={26} height={24} color="#ffffff"/>
          {/* <HeartPulse size={26} strokeWidth={1.6} color="#D7C6EB" /> */}
        </View>
        <Text accessibilityRole="header" className="mt-4 font-inter-bold text-[21px] leading-[27px] tracking-[-0.5px] text-white">{t('about.technologyTitle')}</Text>
        <Text className="mt-2 font-inter text-[14px] leading-[22px] text-[#D1C9DD]">{t('about.technologyBody')}</Text>
      </View>

      <SectionHeading>{t('about.teamTitle')}</SectionHeading>
      <View className="overflow-hidden rounded-[24px] bg-white">
        <TeamMember initials={t('about.developerInitials')} name={t('about.developerName')} role={t('about.developerRole')} />
        <Divider />
        <TeamMember initials={t('about.ceoInitials')} name={t('about.ceoName')} role={t('about.ceoRole')} />
        <Divider />
        <LinkRow label={t('about.moreTeam')} onPress={() => openLink(`${WEBSITE}#team`)} external />
      </View>

      <SectionHeading>{t('about.connectTitle')}</SectionHeading>
      <View className="overflow-hidden rounded-[24px] bg-white">
        <LinkRow label="Instagram" detail="@saqtau.ai" Icon={Instagram} onPress={() => openLink(INSTAGRAM)} external />
        <Divider />
        <LinkRow label={t('about.website')} detail="saqtauai.com" onPress={() => openLink(WEBSITE)} external />
      </View>

      <SectionHeading>{t('about.privacySection')}</SectionHeading>
      <View className="overflow-hidden rounded-[24px] bg-white">
        <LinkRow label={t('about.dataSettings')} Icon={ShieldCheck} onPress={() => router.push('/(app)/settings/privacy')} />
        <Divider />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('about.dataTitle')}
          accessibilityState={{ expanded: dataOpen }}
          onPress={() => setDataOpen((value) => !value)}
          className="min-h-[60px] flex-row items-center px-4 py-4 active:opacity-60"
        >
          <Text className="flex-1 font-inter-semibold text-[14px] leading-[21px] text-[#71697E]">{t('about.dataTitle')}</Text>
          <View style={{ marginLeft: 12, transform: [{ rotate: dataOpen ? '180deg' : '0deg' }] }}>
            <ChevronDown size={19} color="#918B9D" />
          </View>
        </Pressable>
        {dataOpen ? (
          <View className="px-4 pb-2">
            {['about.measurements', 'about.voice', 'about.ai', 'about.family', 'about.preferences'].map((key) => (
              <Text key={key} className="mb-3 font-inter text-[13px] leading-[20px] text-[#81798C]">{t(key)}</Text>
            ))}
          </View>
        ) : null}
        <Divider />
        {RELEASE_LINKS.privacyPolicy ? (
          <LinkRow label={t('about.privacyPolicy')} onPress={() => openLink(RELEASE_LINKS.privacyPolicy)} external />
        ) : (
          <Text className="px-4 py-4 font-inter text-[12px] leading-[18px] text-[#918B9D]">{t('about.privacyUnavailable')}</Text>
        )}
        {RELEASE_LINKS.support ? (
          <>
            <Divider />
            <LinkRow label={t('about.support')} onPress={() => openLink(RELEASE_LINKS.support)} external />
          </>
        ) : null}
      </View>

      <View className="mt-5 flex-row items-start rounded-[20px] bg-[#E6E1EC] p-4">
        <Info size={18} color="#81738F" style={{ marginTop: 2 }} />
        <Text className="ml-3 flex-1 font-inter text-[12px] leading-[19px] text-[#71647E]">{t('about.legalNote')}</Text>
      </View>

      <View className="mb-3 mt-6 border-t border-[#DCD6E3] px-1 pt-4">
        <DetailRow title={t('about.appVersion')} value={RELEASE_DETAILS.version} />
        <DetailRow title={t('about.build')} value={RELEASE_DETAILS.buildNumber} />
        {__DEV__ ? <DetailRow title={t('about.environment')} value={RELEASE_DETAILS.environment} /> : null}
      </View>
    </SettingsPage>
  );
}
