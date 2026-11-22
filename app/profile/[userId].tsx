import React from 'react';
import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/theme/ThemeContext';
import { ProfileView } from '@/components/profile/ProfileView';
import { FIXTURE_PROFILE_USERS } from '@/lib/fixtures';

/** /profile/[userId] — public profile, pixel match of the site's ProfileServerView. */
export default function PublicProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { st, fonts } = useTheme();
  const user = FIXTURE_PROFILE_USERS[String(userId)] ?? FIXTURE_PROFILE_USERS.u1;
  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: st.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: st.muted, fontFamily: fonts.sans, fontSize: 15 }}>User not found</Text>
      </View>
    );
  }
  return <ProfileView user={user} isOwn={false} />;
}
