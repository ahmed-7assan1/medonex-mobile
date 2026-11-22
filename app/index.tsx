import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '@/lib/auth';

/** Entry route: signed-in users land on the tabs, everyone else on login. */
export default function Index() {
  const { token, bootstrapped, isGuest } = useAuth();
  if (!bootstrapped) return null; // root layout splash still visible
  return <Redirect href={token || isGuest ? '/(tabs)' : '/(auth)/login'} />;
}
