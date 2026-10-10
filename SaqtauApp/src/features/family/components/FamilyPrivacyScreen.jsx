import { Shield, Trash2 } from 'lucide-react-native';
import { Alert, Pressable, Text, View } from 'react-native';

import FamilySubpageShell from '@/src/features/family/components/FamilySubpageShell';
import FamilyToggleRow from '@/src/features/family/components/FamilyToggleRow';
import UpdatedAtLabel from '@/src/features/family/components/UpdatedAtLabel';
import useFamilyPrivacy from '@/src/features/family/hooks/useFamilyPrivacy';

export default function FamilyPrivacyScreen({ accountId }) {
  const {
    privacy,
    updatedAt,
    loading,
    savingKey,
    deleting,
    error,
    available,
    reload,
    update,
    deleteData,
  } = useFamilyPrivacy(accountId);

  const confirmDelete = () => {
    Alert.alert(
      'Delete this member’s app data?',
      'This asks SaqtauAI to delete the stored child measurements, summaries and notifications covered by the family data endpoint. The family connection itself stays in place.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete data',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteData();
            if (result.ok) {
              Alert.alert('Data deleted', result.message);
            }
          },
        },
      ],
    );
  };

  return (
    <FamilySubpageShell
      title="Data & privacy"
      subtitle="Choose what this family member shares through SaqtauAI family features."
      loading={loading}
      error={error}
      onRetry={reload}
    >
      <View className="mb-5 rounded-[26px] bg-white px-5 py-5">
        <View className="h-11 w-11 items-center justify-center rounded-full bg-[#EEECEF]">
          <Shield size={22} color="#181027" />
        </View>
        <Text className="mt-4 font-inter-extrabold text-[20px] tracking-[-0.4px] text-[#181027]">
          Family sharing
        </Text>
        <Text className="mt-2 font-inter-medium text-[13px] leading-[19px] text-[#807B89]">
          These controls are saved to the family privacy API and determine what connected family features may expose.
        </Text>
      </View>

      <View className="overflow-hidden rounded-[24px] bg-white">
        <FamilyToggleRow
          title="Share check-in results"
          subtitle="Allow connected family features to show this member’s wellness check-in results."
          value={privacy.share_results}
          saving={savingKey === 'share_results'}
          disabled={!available || Boolean(savingKey)}
          onValueChange={(value) => update('share_results', value)}
        />
        <FamilyToggleRow
          title="Share activity"
          subtitle="Allow recent SaqtauAI family activity to be visible to the guardian."
          value={privacy.share_activity}
          saving={savingKey === 'share_activity'}
          disabled={!available || Boolean(savingKey)}
          onValueChange={(value) => update('share_activity', value)}
        />
        <FamilyToggleRow
          title="Allow voice features"
          subtitle="Privacy gate for voice-enabled family experiences when the voice permission is also enabled."
          value={privacy.allow_voice}
          saving={savingKey === 'allow_voice'}
          disabled={!available || Boolean(savingKey)}
          onValueChange={(value) => update('allow_voice', value)}
          isLast
        />
      </View>

      <UpdatedAtLabel value={updatedAt} />

      <Text className="mb-3 mt-8 font-inter-bold text-[18px] text-[#181027]">Data controls</Text>
      <Pressable
        disabled={deleting || !available}
        onPress={confirmDelete}
        className="flex-row items-center rounded-[24px] bg-white px-4 py-4 active:opacity-80"
      >
        <View className="h-12 w-12 items-center justify-center rounded-full bg-[#F5ECEE]">
          <Trash2 size={22} color="#9A3C49" />
        </View>
        <View className="ml-4 flex-1">
          <Text className="font-inter-bold text-[15px] text-[#9A3C49]">
            {deleting ? 'Deleting…' : 'Delete family member app data'}
          </Text>
          <Text className="mt-1 font-inter-medium text-[12px] leading-[17px] text-[#807B89]">
            Deletes server data covered by the family delete-data endpoint without removing the family connection.
          </Text>
        </View>
      </Pressable>
    </FamilySubpageShell>
  );
}
