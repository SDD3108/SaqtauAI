import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import useI18n from '@/src/features/localization/hooks/useI18n';

function Action({title, onPress, disabled, secondary}) {
  return (
    <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress}
      className={`mr-2 mt-3 min-h-11 justify-center rounded-[16px] px-4 py-2 active:opacity-70 ${secondary ? 'bg-[#EEECEF]' : 'bg-[#181027]'} ${disabled ? 'opacity-50' : ''}`}>
      <Text className={`text-center font-inter-semibold text-[14px] ${secondary ? 'text-[#181027]' : 'text-white'}`}>{title}</Text>
    </Pressable>
  );
}

export default function GuardianshipPanel({state, member}) {
  const { t } = useI18n();
  if (!state.enabled) return null;
  const own = member && state.links.find(l => l.direction === 'as_adult' && String(l.counterpart_id) === member.accountId);
  const myGuardian = member && state.links.find(l => l.direction === 'as_child' && l.status === 'accepted'
    && String(l.counterpart_id) === member.accountId);
  const received = state.links.filter(l => l.direction === 'as_child' && l.role === 'guardian' && l.status === 'pending'
    && (!member || String(l.counterpart_id) === member.accountId));
  const incoming = received.length > 0;
  if (!member && !incoming && !state.error && !state.notice) return null;

  const answer = (link, yes) => {
    if (!yes) return state.answer(link, 'decline');
    Alert.alert(t('guard.confirm', {name:link.counterpart_name}), t('guard.scope'), [
      {text:t('common.cancel'),style:'cancel'},
      {text:t('family.accept'),onPress:() => state.answer(link,'accept')},
    ]);
  };
  const canRequest = member && !incoming && !myGuardian && (!own || own.status === 'declined');
  return (
    <View className="mb-4 rounded-[24px] bg-white p-4">
      <Text accessibilityRole="header" className="font-inter-bold text-[18px] text-[#181027]">
        {t(member ? 'guard.title' : 'guard.inbox')}
      </Text>
      {!!state.notice && <Text accessibilityLiveRegion="polite" className="mt-2 font-inter-medium text-[14px] text-[#355D48]">{t(state.notice)}</Text>}
      {state.error && <View>
        <Text accessibilityLiveRegion="polite" className="mt-2 font-inter text-[14px] text-[#92464B]">{t(state.error)}</Text>
        <Action title={t('common.retry')} onPress={state.refresh} secondary />
      </View>}
      {!state.ready && !state.error && <ActivityIndicator className="mt-3" color="#181027" />}
      {state.ready && received.map(link => (
        <View key={link.id} className="mt-3">
          <Text className="font-inter-semibold text-[16px] text-[#181027]">{t('guard.from', {name:link.counterpart_name})}</Text>
          <Text className="mt-2 font-inter text-[14px] leading-5 text-[#625D71]">{t('guard.scope')}</Text>
          <View className="flex-row flex-wrap">
            <Action title={t('family.accept')} disabled={!!state.busy} onPress={() => answer(link,true)} />
            <Action title={t('family.decline')} secondary disabled={!!state.busy} onPress={() => answer(link,false)} />
          </View>
        </View>
      ))}
      {member && state.ready && <>
        {myGuardian && <Text className="mt-2 font-inter text-[14px] text-[#625D71]">{t('guard.yours', {name:member.name})}</Text>}
        {own?.status === 'accepted' && <Text className="mt-2 font-inter text-[14px] text-[#625D71]">{t('guard.approved')}</Text>}
        {own?.status === 'pending' && <Text className="mt-2 font-inter text-[14px] text-[#625D71]">{t('guard.pending', {name:member.name})}</Text>}
        {canRequest && <>
          <Text className="mt-2 font-inter text-[14px] leading-5 text-[#625D71]">{t(own?.status === 'declined' ? 'guard.declined' : 'guard.requestBody', {name:member.name})}</Text>
          <Action title={t('guard.request')} disabled={!!state.busy}
            onPress={() => Alert.alert(t('guard.request'), t('guard.requestBody',{name:member.name}), [
              {text:t('common.cancel'),style:'cancel'}, {text:t('guard.send'),onPress:() => state.request(member.accountId)},
            ])} />
        </>}
      </>}
    </View>
  );
}
