import React from 'react';
import { ProfileView } from '@/components/profile/ProfileView';
import { FIXTURE_PROFILE_USERS } from '@/lib/fixtures';

/** /profile — the signed-in user's own profile (fixture until wiring). */
export default function OwnProfileScreen() {
  return <ProfileView user={FIXTURE_PROFILE_USERS.me} isOwn />;
}
